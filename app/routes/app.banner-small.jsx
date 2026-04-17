import { useNavigate, useFetcher, useLoaderData } from "react-router";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Button,
  ButtonGroup,
  Text,
  TextField,
  FormLayout,
  Checkbox,
  Select,
  Divider,
} from "@shopify/polaris";

import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
  import prisma from "../db.server";
import { getBannerPreset, getBannerPreviewStyle, getBannerSize } from "../lib/bannerPresets";

const FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
];

const DEFAULT_SETTINGS = {
  title: "Input your title here",
  content: "Input your content here",
  backgroundColor: "#f3f0ff",
  color: "#000000",
  titleFont: "'Playfair Display', serif",
  contentFont: "Inter, sans-serif",
  size: "medium",
  position: "top",
  priority: 0,
  status: true,
  dismissible: false,
};

function getRemainingTimeParts(timeEndValue, now) {
  if (!timeEndValue) return null;

  const endTime = new Date(timeEndValue).getTime();
  if (Number.isNaN(endTime)) return null;

  const distance = Math.max(endTime - now, 0);

  return {
    expired: distance === 0,
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
}

async function loadProducts(admin) {
  const response = await admin.graphql(`
    query ProductBannerProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            status
          }
        }
      }
    }
  `);

  const responseJson = await response.json();

  return (
    responseJson.data?.products?.edges?.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      status: node.status,
      path: `/products/${node.handle}`,
    })) || []
  );
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const preset = url.searchParams.get("preset");

  const [products, banner] = await Promise.all([
    loadProducts(admin),
    id
      ? prisma.app_banner.findUnique({
          where: { id: Number(id) },
        })
      : Promise.resolve(null),
  ]);

  return { products, banner, preset: getBannerPreset(preset) };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const id = formData.get("id");
  const title = formData.get("title")?.toString() || "";
  const content = formData.get("content")?.toString() || "";
  const color = formData.get("color")?.toString() || "#000000";
  const backgroundColor = formData.get("backgroundColor")?.toString() || "#f3f0ff";
  const size = formData.get("size")?.toString() || "medium";
  const position = formData.get("position")?.toString() || "top";
  const priority = Number(formData.get("priority") || 0);
  const status = formData.get("status") === "true";
  const dismissible = formData.get("dismissible") === "true";
  const targetProductId = formData.get("targetProductId")?.toString() || "";
  const productPath = formData.get("productPath")?.toString() || "";
  const timeEndStr = formData.get("timeEnd")?.toString().trim();

  if (!targetProductId) {
    return { ok: false, errors: { general: "Please select a product" } };
  }

  const data = {
    shop: session.shop,
    title,
    content,
    link: productPath || null,
    color,
    backgroundColor,
    size,
    position,
    priority,
    status,
    dismissible,
    targetProductId,
    targetPage: "product",
    timeEnd: timeEndStr ? new Date(timeEndStr) : null,
  };

  if (id) {
    await prisma.app_banner.update({
      where: { id: Number(id) },
      data,
    });
  } else {
    await prisma.app_banner.create({ data });
  }

  return { ok: true };
};

export default function ProductBannerPage() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { banner: initialSettings, products, preset } = useLoaderData();
  const initialSize = initialSettings?.size ? getBannerSize(initialSettings.size) : preset.size;

  const [title, setTitle] = useState(initialSettings?.title || DEFAULT_SETTINGS.title);
  const [content, setContent] = useState(initialSettings?.content || DEFAULT_SETTINGS.content);
  const [color, setColor] = useState(initialSettings?.color || DEFAULT_SETTINGS.color);
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings?.backgroundColor || DEFAULT_SETTINGS.backgroundColor,
  );
  const [titleFont, setTitleFont] = useState(
    initialSettings?.titleFont || DEFAULT_SETTINGS.titleFont,
  );
  const [contentFont, setContentFont] = useState(
    initialSettings?.contentFont || DEFAULT_SETTINGS.contentFont,
  );
  const [size] = useState(initialSize);
  const [position, setPosition] = useState(
    initialSettings?.position || preset.position || DEFAULT_SETTINGS.position,
  );
  const [priority, setPriority] = useState(initialSettings?.priority || DEFAULT_SETTINGS.priority);
  const [status, setStatus] = useState(initialSettings?.status ?? DEFAULT_SETTINGS.status);
  const [dismissible, setDismissible] = useState(
    initialSettings?.dismissible ?? DEFAULT_SETTINGS.dismissible,
  );
  const [selectedProductId, setSelectedProductId] = useState(
    initialSettings?.targetProductId || "",
  );
  const [timeEnd, setTimeEnd] = useState(
    initialSettings?.timeEnd
      ? new Date(initialSettings.timeEnd).toISOString().slice(0, 16)
      : "",
  );
  const [now, setNow] = useState(Date.now());

  const isSaving = fetcher.state === "submitting";
  const productOptions = [
    { label: "Select a product", value: "" },
    ...products.map((product) => ({
      label: `${product.title} (${product.status})`,
      value: product.id,
    })),
  ];
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) || null;

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Product banner saved successfully!", { duration: 3000 });
      navigate("/app");
    }

    if (fetcher.data?.errors) {
      shopify.toast.show(fetcher.data.errors.general || "Save failed", { isError: true });
    }
  }, [fetcher.data, navigate, shopify]);

  useEffect(() => {
    if (!timeEnd) return undefined;

    setNow(Date.now());
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeEnd]);

  const remainingTime = getRemainingTimeParts(timeEnd, now);
  const showCountdown = remainingTime && !remainingTime.expired;
  const previewStyle = getBannerPreviewStyle(size);

  return (
    <Page
      title={initialSettings ? "Edit Small Widget" : "Create Small Widget"}
      subtitle="Banner chung hien thi tren storefront"
      backAction={{ content: "Back", onAction: () => navigate("/app") }}
    >
      <Layout>
        <Layout.Section>
          <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "2fr 1fr" }}>
            <fetcher.Form method="post">
              <input type="hidden" name="id" value={initialSettings?.id || ""} />
              <input type="hidden" name="size" value={size} />
              <input type="hidden" name="productPath" value={selectedProduct?.path || ""} />

              <Card>
                <BlockStack gap="500">
                <Text variant="headingMd">
                  {initialSettings ? "Edit Product Banner" : "Create Product Banner"}
                </Text>
                {!initialSettings ? (
                  <Text tone="subdued" variant="bodySm">
                    Layout dang chon: {preset.title}
                  </Text>
                ) : null}

                  <FormLayout>
                    <Select
                      label="Product"
                      name="targetProductId"
                      value={selectedProductId}
                      onChange={setSelectedProductId}
                      options={productOptions}
                      helpText="Banner nay chi hien thi tren product duoc chon"
                    />

                    <TextField
                      label="Title"
                      name="title"
                      value={title}
                      onChange={setTitle}
                      autoComplete="off"
                    />

                    <TextField
                      label="Content"
                      name="content"
                      value={content}
                      onChange={setContent}
                      multiline={4}
                      autoComplete="off"
                    />

                    <FormLayout.Group>
                      <div>
                        <Text variant="bodyMd" as="p" fontWeight="medium">
                          Background Color
                        </Text>
                        <input
                          type="color"
                          name="backgroundColor"
                          value={backgroundColor}
                          onChange={(event) => setBackgroundColor(event.target.value)}
                          style={{
                            width: "80px",
                            height: "50px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        />
                      </div>

                      <div>
                        <Text variant="bodyMd" as="p" fontWeight="medium">
                          Text Color
                        </Text>
                        <input
                          type="color"
                          name="color"
                          value={color}
                          onChange={(event) => setColor(event.target.value)}
                          style={{
                            width: "80px",
                            height: "50px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    </FormLayout.Group>

                    <FormLayout.Group>
                      <Select
                        label="Title Font"
                        name="titleFont"
                        value={titleFont}
                        onChange={setTitleFont}
                        options={FONT_OPTIONS}
                      />

                      <Select
                        label="Content Font"
                        name="contentFont"
                        value={contentFont}
                        onChange={setContentFont}
                        options={FONT_OPTIONS}
                      />
                    </FormLayout.Group>

                    <FormLayout.Group>
                      <Select
                        label="Position"
                        name="position"
                        value={position}
                        onChange={setPosition}
                        options={[
                          { label: "Top", value: "top" },
                          { label: "Bottom", value: "bottom" },
                        ]}
                      />
                    </FormLayout.Group>

                    <TextField
                      label="Priority"
                      type="number"
                      name="priority"
                      value={priority}
                      onChange={(value) => setPriority(Number(value))}
                    />

                    <Checkbox
                      label="Active (Status)"
                      checked={status}
                      onChange={(value) => setStatus(value)}
                    />

                    <input type="hidden" name="status" value={status ? "true" : "false"} />

                    <Checkbox
                      label="Dismissible (user can close)"
                      checked={dismissible}
                      onChange={(value) => setDismissible(value)}
                    />

                    <input
                      type="hidden"
                      name="dismissible"
                      value={dismissible ? "true" : "false"}
                    />

                    <TextField
                      label="End Time"
                      type="datetime-local"
                      name="timeEnd"
                      value={timeEnd}
                      onChange={setTimeEnd}
                    />
                  </FormLayout>

                  <Divider />

                  <InlineStack align="end">
                    <ButtonGroup>
                      <Button onClick={() => navigate("/app")}>Cancel</Button>
                      <Button variant="primary" submit loading={isSaving}>
                        {initialSettings ? "Save Changes" : "Create Product Banner"}
                      </Button>
                    </ButtonGroup>
                  </InlineStack>
                </BlockStack>
              </Card>
            </fetcher.Form>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Live Preview</Text>
                <Text tone="subdued" variant="bodySm">
                  {selectedProduct ? `Ap dung cho ${selectedProduct.title}` : "Chua chon product"}
                </Text>

                <div
                  style={{
                    backgroundColor,
                    color,
                    ...previewStyle.container,
                    textAlign: "center",
                    border: "1px solid #ddd",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: titleFont,
                      fontSize: previewStyle.titleSize,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      marginTop: "8px",
                      marginBottom: 0,
                      opacity: 0.9,
                      fontFamily: contentFont,
                      fontSize: previewStyle.contentSize,
                      lineHeight: 1.5,
                    }}
                  >
                    {content}
                  </p>

                  {showCountdown ? (
                    <div
                      style={{
                        marginTop: "18px",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {[
                        { label: "Days", value: remainingTime.days },
                        { label: "Hours", value: remainingTime.hours },
                        { label: "Minutes", value: remainingTime.minutes },
                        { label: "Seconds", value: remainingTime.seconds },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: "12px 8px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(255,255,255,0.18)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: titleFont,
                              fontSize: previewStyle.countdownValueSize,
                              fontWeight: 700,
                            }}
                          >
                            {String(item.value).padStart(2, "0")}
                          </div>
                          <div
                            style={{
                              marginTop: "4px",
                              fontFamily: contentFont,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
