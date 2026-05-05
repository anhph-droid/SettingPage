import {
  ActionList,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Page,
  Popover,
  Text,
} from "@shopify/polaris";
import { MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";

import { getBannerStatusMeta, isBannerExpired } from "../banner.shared";
import { syncExpiredBannersForShop } from "../banner.server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

function parseTargetProductIds(targetProductIdValue) {
  if (!targetProductIdValue) return [];

  return targetProductIdValue
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function getBannerProductTitles(banner, productMap) {
  const productTitles = parseTargetProductIds(banner.targetProductId)
    .map((id) => productMap[id]?.title)
    .filter(Boolean);

  if (productTitles.length === 0) return "Product banner";
  return productTitles.join(", ");
}

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = Number(formData.get("id"));

  if (intent === "delete") {
    await prisma.app_banner.deleteMany({
      where: { id, shop: session.shop },
    });
    return { ok: true };
  }

  if (intent === "duplicate") {
    const banner = await prisma.app_banner.findFirst({
      where: { id, shop: session.shop },
    });

    if (!banner) return { ok: false };

    await prisma.app_banner.create({
      data: {
        ...banner,
        id: undefined,
        title: `${banner.title} (Copy)`,
        status: isBannerExpired(banner.timeEnd) ? false : banner.status,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    return { ok: true };
  }

  if (intent === "toggle_status") {
    const banner = await prisma.app_banner.findFirst({
      where: { id, shop: session.shop },
    });

    if (!banner) return { ok: false };
    if (isBannerExpired(banner.timeEnd)) {
      await prisma.app_banner.update({
        where: { id },
        data: { status: false },
      });
      return { ok: false, ended: true };
    }

    await prisma.app_banner.update({
      where: { id },
      data: { status: !banner.status },
    });

    return { ok: true };
  }

  return null;
};

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  await syncExpiredBannersForShop(session.shop);

  const smallBanners = await prisma.app_banner.findMany({
    where: {
      shop: session.shop,
      size: "small",
      targetProductId: { not: null },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const ids = [
    ...new Set(
      smallBanners.flatMap((banner) => parseTargetProductIds(banner.targetProductId)),
    ),
  ];
  let productMap = {};

  if (ids.length > 0) {
    const response = await admin.graphql(
      `#graphql
        query SmallBannerProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
            }
          }
        }
      `,
      { variables: { ids } },
    );

    const responseJson = await response.json();
    const products = responseJson.data?.nodes || [];
    productMap = products.reduce((accumulator, product) => {
      if (!product?.id) return accumulator;
      accumulator[product.id] = product;
      return accumulator;
    }, {});
  }

  return {
    shop: session.shop,
    smallBanners,
    productMap,
    totals: {
      enabled: smallBanners.filter((banner) => getBannerStatusMeta(banner).label === "Enabled").length,
      total: smallBanners.length,
    },
  };
};

function RowActionMenu({ banner, fetcher, navigate }) {
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((prev) => !prev), []);
  const close = useCallback(() => setActive(false), []);

  return (
    <div
      role="presentation"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Popover
        active={active}
        activator={<Button variant="plain" icon={MenuHorizontalIcon} onClick={toggleActive} />}
        onClose={close}
      >
        <ActionList
          items={[
            {
              content: "Edit",
              onAction: () => navigate(`/app/banner-small?id=${banner.id}`),
            },
            {
              content: "Duplicate",
              onAction: () => {
                const nextFormData = new FormData();
                nextFormData.append("id", String(banner.id));
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
                nextFormData.append("id", String(banner.id));
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

function StatusToggle({ banner }) {
  const fetcher = useFetcher();
  const statusMeta = getBannerStatusMeta(banner);
  const isEnded = statusMeta.label === "End time";
  const checked =
    fetcher.formData?.get("intent") === "toggle_status"
      ? fetcher.formData.get("nextStatus") === "true"
      : banner.status;

  return (
    <fetcher.Form
      method="post"
      onClick={(event) => event.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
      <input type="hidden" name="intent" value="toggle_status" />
      <input type="hidden" name="id" value={banner.id} />
      <input type="hidden" name="nextStatus" value={String(!banner.status)} />
      <span style={{ fontSize: "12px", fontWeight: 600, color: isEnded ? "#8a6116" : checked ? "#0f8a5f" : "#6b7280", minWidth: "54px", textAlign: "right" }}>
        {isEnded ? "End time" : checked ? "Enabled" : "Disabled"}
      </span>
      <button
        type="submit"
        aria-label={isEnded ? "Banner expired" : checked ? "Disable banner" : "Enable banner"}
        disabled={isEnded}
        style={{ width: "28px", height: "16px", borderRadius: "999px", border: 0, padding: "2px", background: isEnded ? "#c2a46a" : checked ? "#2f855a" : "#111827", cursor: isEnded ? "not-allowed" : "pointer", opacity: isEnded ? 0.75 : 1 }}
      >
        <span
          style={{ display: "block", width: "12px", height: "12px", borderRadius: "50%", background: "#ffffff", transform: `translateX(${checked ? "12px" : "0"})`, transition: "transform 0.18s ease" }}
        />
      </button>
    </fetcher.Form>
  );
}

function SmallRow({ banner, navigate, shop, productMap }) {
  const fetcher = useFetcher();
  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return (
    <div
      role="presentation"
      onClick={() => navigate(`/app/banner-small?id=${banner.id}`)}
      style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr auto", gap: "16px", alignItems: "center", padding: "18px 16px", borderTop: "1px solid #eef1f4", cursor: "pointer" }}
    >
      <BlockStack gap="100">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h3" variant="bodyMd" fontWeight="semibold">
            {banner.title}
          </Text>
          <Badge tone="info">small</Badge>
        </InlineStack>
        <Text as="p" tone="subdued" variant="bodySm">
          {getBannerProductTitles(banner, productMap)}
        </Text>
      </BlockStack>

      <Text as="p" variant="bodySm" tone="subdued">
        {banner.position === "bottom" ? "Bottom" : "Top"}
      </Text>

      <InlineStack gap="200" wrap>
        <Button
          variant="plain"
          onClick={(event) => {
            event.stopPropagation();
            navigator.clipboard?.writeText(String(banner.id));
          }}
        >
          Copy ID
        </Button>
        <Button
          variant="plain"
          url={themeEditorUrl}
          target="_blank"
          onClick={(event) => event.stopPropagation()}
        >
          Add to theme
        </Button>
      </InlineStack>

      <StatusToggle banner={banner} />

      <RowActionMenu banner={banner} fetcher={fetcher} navigate={navigate} />
    </div>
  );
}

export default function SmallHomePage() {
  const navigate = useNavigate();
  const { shop, smallBanners, productMap, totals } = useLoaderData();

  return (
    <Page
      title="Small widget"
      subtitle="Create and manage banners created from the Small layout."
      backAction={{ content: "Back", onAction: () => navigate("/app") }}
    >
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Small information
            </Text>
            <Text as="p" tone="subdued">
              Small is a compact banner suited for product pages and tight content areas.
            </Text>
            <InlineStack gap="300">
              <Button variant="primary" onClick={() => navigate("/app/banner-small?preset=small")}>
                Create small banner
              </Button>
              <Text as="p" tone="subdued" variant="bodySm">
                {totals.enabled} enabled / {totals.total} total
              </Text>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="0">
          {smallBanners.length === 0 ? (
            <Box padding="600">
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  No small banners yet
                </Text>
                <Text as="p" tone="subdued">
                  Create your first small banner to display it on product pages.
                </Text>
                <InlineStack>
                  <Button variant="primary" onClick={() => navigate("/app/productBanner?preset=small")}>
                    Create
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          ) : (
            <div>
              {smallBanners.map((banner) => (
                <SmallRow key={banner.id} banner={banner} navigate={navigate} shop={shop} productMap={productMap} />
              ))}
            </div>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}
