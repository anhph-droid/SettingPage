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
  useIndexResourceState,
  Box,
  Divider,
} from "@shopify/polaris";

import React, { useState, useCallback } from "react";
import {
  Popover,
  ActionList,
} from "@shopify/polaris";

import { MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useNavigate, useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    await prisma.app_banner.delete({ where: { id } });
    return { ok: true };
  }

  if (intent === "bulk-delete") {
    const ids = formData
      .getAll("ids")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (ids.length === 0) return { ok: false };

    await prisma.app_banner.deleteMany({
      where: {
        id: { in: ids },
        shop: session.shop,
      },
    });

    return { ok: true };
  }

  if (intent === "duplicate") {
    const id = Number(formData.get("id"));
    const banner = await prisma.app_banner.findUnique({ where: { id } });

    if (!banner) return { ok: false };

    await prisma.app_banner.create({
      data: {
        ...banner,
        id: undefined,
        title: banner.title + " (Copy)",
        createdAt: undefined,
        updatedAt: undefined,
      },
    });
    return { ok: true };
  }
  return null;
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const banners = await prisma.app_banner.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return banners;
};

function RowActionMenu({ banner, navigate, fetcher }) {
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((prev) => !prev), []);
  const close = useCallback(() => setActive(false), []);

  return (
    <div onClick={(e) => e.stopPropagation()}>
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
              onAction: () => navigate(`/app/settingPage?id=${banner.id}`),
            },
            {
              content: "Duplicate",
              onAction: () => {
                const formData = new FormData();
                formData.append("id", banner.id);
                formData.append("intent", "duplicate");
                fetcher.submit(formData, { method: "post" });
              },
            },
            {
              content: "Delete",
              destructive: true,
              onAction: () => {
                if (!confirm("Delete this banner?")) return;
                const formData = new FormData();
                formData.append("id", banner.id);
                formData.append("intent", "delete");
                fetcher.submit(formData, { method: "post" });
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
  const banners = useLoaderData();
  const fetcher = useFetcher();

  const resourceName = { singular: "banner", plural: "banners" };

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(banners);

  const handleBulkDelete = () => {
    if (selectedResources.length === 0) return;
    if (!confirm(`Delete ${selectedResources.length} selected widget?`)) return;

    const formData = new FormData();
    formData.append("intent", "bulk-delete");
    selectedResources.forEach((id) => formData.append("ids", id));
    fetcher.submit(formData, { method: "post" });
  };

  const rowMarkup = banners.map((banner, index) => (
    <IndexTable.Row
      id={banner.id.toString()}
      key={banner.id}
      selected={selectedResources.includes(banner.id.toString())}
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
          {banner.content}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone="info">{banner.size || "Bar"}</Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone={banner.status ? "success" : "critical"}>
          {banner.status ? "Active" : "Disabled"}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>

        <RowActionMenu 
        banner={banner} 
        navigate={navigate} 
        fetcher={fetcher} />

      </IndexTable.Cell>
      
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Củ Khoai APP countdown "
      subtitle="Manage your countdown widgets"
      secondaryActions={[
        {
          content: `Delete selected `,
          onAction: handleBulkDelete,
          destructive: true,
          disabled: selectedResources.length === 0 || fetcher.state === "submitting",
        },
      ]}
      primaryAction={{
        content: "Create banner",
        onAction: () => navigate("/app/settingPage"),
      }}
    >
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">Active widgets</Text>
                  <Text variant="heading2xl" fontWeight="bold" tone="success">
                    {banners.filter((b) => b.status).length}
                  </Text>
                </BlockStack>
              </Box>  
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">Total widgets</Text>
                  <Text variant="heading2xl" fontWeight="bold">
                    {banners.length}
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            {banners.length === 0 ? (
              <EmptyState
                heading="No widgets yet"
                action={{
                  content: "Create your first widget",
                  onAction: () => navigate("/app/settingPage"),
                }}
              >
                <p>Start creating beautiful countdown timers for your store.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={banners.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Widget name" },
                  { title: "Description" },
                  { title: "Type" },
                  { title: "Status" },
                  { title: "" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
  
        <Layout.Section>
            <div style={{ padding: "16px", textAlign: "center" }}>
              <InlineStack gap="400" align="center">
                <Button variant="plain" onClick={() => navigate("/app/faq")}>
                  View FAQ
                </Button>

                <Button
                  variant="plain"
                  onClick={() => navigate("/app/manual")}
                >
                  View user manual
                </Button>

                <Button
                  variant="plain"
                  onClick={() => navigate("/app/updates")}
                >
                  Join us on X for updates
                </Button>
              </InlineStack>
            </div>
    
        </Layout.Section>
      </Layout>
    </Page>
  );
}
