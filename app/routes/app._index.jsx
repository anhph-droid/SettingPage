/* eslint-disable react/prop-types */

import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Text,
  Badge,
  EmptyState,
  IndexTable,
  Box,
} from "@shopify/polaris";
import { Popover, ActionList } from "@shopify/polaris";
import { MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { useNavigate, useLoaderData, useFetcher } from "react-router";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

function getBannerStatus(banner) {
  const isTimeEnded = banner.timeEnd && new Date(banner.timeEnd).getTime() <= Date.now();

  if (isTimeEnded) {
    return { tone: "attention", label: "Time End" };
  }

  return banner.status
    ? { tone: "success", label: "Active" }
    : { tone: "critical", label: "Disabled" };
}

async function loadProductMap(admin, productBanners) {
  const ids = [...new Set(productBanners.map((banner) => banner.targetProductId).filter(Boolean))];
  if (ids.length === 0) return {};

  const response = await admin.graphql(
    `#graphql
      query ProductBannerIndexProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            handle
            status
          }
        }
      }
    `,
    { variables: { ids } },
  );

  const responseJson = await response.json();
  const products = responseJson.data?.nodes || [];

  return products.reduce((accumulator, product) => {
    if (!product?.id) return accumulator;
    accumulator[product.id] = product;
    return accumulator;
  }, {});
}

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    await prisma.app_banner.deleteMany({
      where: {
        id,
        shop: session.shop,
      },
    });
    return { ok: true };
  }

  if (intent === "duplicate") {
    const id = Number(formData.get("id"));
    const banner = await prisma.app_banner.findFirst({
      where: {
        id,
        shop: session.shop,
      },
    });

    if (!banner) return { ok: false };

    await prisma.app_banner.create({
      data: {
        ...banner,
        id: undefined,
        title: `${banner.title} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    return { ok: true };
  }

  return null;
};

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const [pageBanners, productBanners] = await Promise.all([
    prisma.app_banner.findMany({
      where: {
        shop: session.shop,
        targetProductId: null,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.app_banner.findMany({
      where: {
        shop: session.shop,
        targetProductId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const productMap = await loadProductMap(admin, productBanners);

  return { pageBanners, productBanners, productMap };
};

function RowActionMenu({ banner, navigate, fetcher }) {
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((prev) => !prev), []);
  const close = useCallback(() => setActive(false), []);
  const editPath = banner.targetProductId
    ? `/app/productBanner?id=${banner.id}`
    : `/app/settingPage?id=${banner.id}`;

  return (
    <div
      role="presentation"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Popover
        active={active}
        activator={
          <Button variant="plain" icon={MenuHorizontalIcon} onClick={toggleActive} />
        }
        onClose={close}
      >
        <ActionList
          items={[
            {
              content: "Edit",
              onAction: () => navigate(editPath),
            },
            {
              content: "Duplicate",
              onAction: () => {
                const nextFormData = new FormData();
                nextFormData.append("id", banner.id);
                nextFormData.append("intent", "duplicate");
                fetcher.submit(nextFormData, { method: "post" });
              },
            },
            {
              content: "Delete",
              destructive: true,
              onAction: () => {
                if (!confirm("Delete this banner?")) return;
                const nextFormData = new FormData();
                nextFormData.append("id", banner.id);
                nextFormData.append("intent", "delete");
                fetcher.submit(nextFormData, { method: "post" });
              },
            },
          ]}
        />
      </Popover>
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { pageBanners, productBanners, productMap } = useLoaderData();
  const activePageBanners = pageBanners.filter((banner) => getBannerStatus(banner).label === "Active");
  const activeProductBanners = productBanners.filter(
    (banner) => getBannerStatus(banner).label === "Active",
  );

  const pageRows = pageBanners.map((banner, index) => (
    <IndexTable.Row
      id={banner.id.toString()}
      key={banner.id}
      position={index}
      onClick={() => navigate(`/app/settingPage?id=${banner.id}`)}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold">
          {banner.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text tone="subdued" variant="bodySm">
          {banner.targetPage || "all"}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text tone="subdued" variant="bodySm">
          {banner.content}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={getBannerStatus(banner).tone}>
          {getBannerStatus(banner).label}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <RowActionMenu banner={banner} navigate={navigate} fetcher={fetcher} />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const productRows = productBanners.map((banner, index) => {
    const product = productMap[banner.targetProductId];

    return (
      <IndexTable.Row
        id={banner.id.toString()}
        key={banner.id}
        position={index}
        onClick={() => navigate(`/app/productBanner?id=${banner.id}`)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold">
            {banner.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text tone="subdued" variant="bodySm">
            {product?.title || banner.link || banner.targetProductId}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">{banner.position === "bottom" ? "Bottom" : "Top"}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={getBannerStatus(banner).tone}>
            {getBannerStatus(banner).label}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <RowActionMenu banner={banner} navigate={navigate} fetcher={fetcher} />
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page title="Củ Khoai APP countdown" subtitle="Report va danh sach tat ca banner">
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">
                    Active page banners
                  </Text>
                  <Text variant="heading2xl" fontWeight="bold" tone="success">
                    {activePageBanners.length}
                  </Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">
                    Total page banners
                  </Text>
                  <Text variant="heading2xl" fontWeight="bold">
                    {pageBanners.length}
                  </Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">
                    Active product banners
                  </Text>
                  <Text variant="heading2xl" fontWeight="bold" tone="success">
                    {activeProductBanners.length}
                  </Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">
                    Total product banners
                  </Text>
                  <Text variant="heading2xl" fontWeight="bold">
                    {productBanners.length}
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text variant="headingMd">Create Page Banner</Text>
                  <Text tone="subdued" variant="bodySm">
                    Trang nay chi de tao banner cho page.
                  </Text>
                  <Button variant="primary" onClick={() => navigate("/app/settingPage")}>
                    Create page banner
                  </Button>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text variant="headingMd">Create Product Banner</Text>
                  <Text tone="subdued" variant="bodySm">
                    Trang nay chi de tao banner cho product.
                  </Text>
                  <Button variant="primary" onClick={() => navigate("/app/productBanner")}>
                    Create product banner
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Page Banners</Text>
              {pageBanners.length === 0 ? (
                <EmptyState
                  heading="No page banners yet"
                  action={{
                    content: "Create page banner",
                    onAction: () => navigate("/app/settingPage"),
                  }}
                >
                  <p>Danh sach page banner se hien thi o day.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "page banner", plural: "page banners" }}
                  itemCount={pageBanners.length}
                  headings={[
                    { title: "Banner name" },
                    { title: "Display page" },
                    { title: "Description" },
                    { title: "Status" },
                    { title: "" },
                  ]}
                >
                  {pageRows}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Product Banners</Text>
              {productBanners.length === 0 ? (
                <EmptyState
                  heading="No product banners yet"
                  action={{
                    content: "Create product banner",
                    onAction: () => navigate("/app/productBanner"),
                  }}
                >
                  <p>Danh sach product banner se hien thi o day.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "product banner", plural: "product banners" }}
                  itemCount={productBanners.length}
                  headings={[
                    { title: "Banner name" },
                    { title: "Product" },
                    { title: "Position" },
                    { title: "Status" },
                    { title: "" },
                  ]}
                >
                  {productRows}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
