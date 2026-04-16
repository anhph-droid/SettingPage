import {
  useNavigate,
  useFetcher,
  useLoaderData,
} from "react-router";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import {
  Page,
  Card,
  BlockStack,
  TextField,
  Button,
  ButtonGroup,
  Text,
  InlineStack,
  FormLayout,
  Checkbox,
  Select,
  Divider,
} from "@shopify/polaris";

import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

const FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
];

const PAGE_OPTIONS = [
  { label: "All pages", value: "all" },
  { label: "Home page", value: "home" },
  { label: "Product page", value: "product" },
  { label: "Collection page", value: "collection" },
  { label: "Page", value: "page" },
  { label: "Blog", value: "blog" },
  { label: "Article", value: "article" },
  { label: "Search", value: "search" },
  { label: "Cart page", value: "cart" },
  { label: "Custom URL / path", value: "custom" },
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

function normalizeCustomTargetPage(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      return url.pathname || "/";
    }
  } catch {
    return trimmed;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getTargetPageState(targetPageValue) {
  if (!targetPageValue || targetPageValue === "all") {
    return { selectedTargetPage: "all", customTargetPage: "" };
  }

  if (targetPageValue.startsWith("custom:")) {
    return {
      selectedTargetPage: "custom",
      customTargetPage: targetPageValue.slice("custom:".length),
    };
  }

  return { selectedTargetPage: targetPageValue, customTargetPage: "" };
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  let banner = null;

  if (id) {
    banner = await prisma.app_banner.findUnique({
      where: { id: Number(id) },
    });
  }  

  const response = await admin.graphql(`
    query ProductPickerProducts {
      products(first: 30, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            status
            featuredImage {
              url
              altText
            }
          }
        }
      }
    }
  `);

  const responseJson = await response.json();
  const products =
    responseJson.data?.products?.edges?.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      status: node.status,
      imageUrl: node.featuredImage?.url || "",
      imageAlt: node.featuredImage?.altText || node.title,
      path: `/products/${node.handle}`,
    })) || [];

  return { banner, products };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const id = formData.get("id");
  const title = formData.get("title")?.toString() || "";
  const content = formData.get("content")?.toString() || "";
  const link = formData.get("link")?.toString() || "";
  const color = formData.get("color")?.toString() || "#000000";
  const backgroundColor = formData.get("backgroundColor")?.toString() || "#f3f0ff";
  const size = formData.get("size")?.toString() || "medium";
  const position = formData.get("position")?.toString() || "top";
  const priority = Number(formData.get("priority") || 0);
  const status = formData.get("status") === "true";
  const dismissible = formData.get("dismissible") === "true";
  const targetPage = formData.get("targetPage")?.toString() || "all";
  const customTargetPage = normalizeCustomTargetPage(
    formData.get("customTargetPage")?.toString() || "",
  );

  const timeEndStr = formData.get("timeEnd")?.toString().trim();
  const normalizedTargetPage =
    targetPage === "custom"
      ? customTargetPage
        ? `custom:${customTargetPage}`
        : "all"
      : targetPage;
  
  const data = {
    shop: session.shop,
    title,
    content,
    link: link || null,
    color,
    backgroundColor,
    size,
    position,
    priority,
    status,
    dismissible,
    targetPage: normalizedTargetPage,
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

export default function SettingPage() {
  const navigate = useNavigate();
  const { banner: initialSettings, products } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [title, setTitle] = useState(initialSettings?.title || DEFAULT_SETTINGS.title);
  const [content, setContent] = useState(initialSettings?.content || DEFAULT_SETTINGS.content);
  const [link, setLink] = useState(initialSettings?.link || "");
  const [color, setColor] = useState(initialSettings?.color || DEFAULT_SETTINGS.color);
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings?.backgroundColor || DEFAULT_SETTINGS.backgroundColor
  );
  const [titleFont, setTitleFont] = useState(
    initialSettings?.titleFont || DEFAULT_SETTINGS.titleFont
  );
  const [contentFont, setContentFont] = useState(
    initialSettings?.contentFont || DEFAULT_SETTINGS.contentFont
  );
  const [size, setSize] = useState(initialSettings?.size || DEFAULT_SETTINGS.size);
  const [position, setPosition] = useState(initialSettings?.position || DEFAULT_SETTINGS.position);
  const [priority, setPriority] = useState(initialSettings?.priority || DEFAULT_SETTINGS.priority);
  const [status, setStatus] = useState( initialSettings?.status ?? DEFAULT_SETTINGS.status );
  const [dismissible, setDismissible] = useState(initialSettings?.dismissible ?? DEFAULT_SETTINGS.dismissible);
  const [selectedProductId, setSelectedProductId] = useState("");
  const initialTargetPageState = getTargetPageState(initialSettings?.targetPage);
  const [targetPage, setTargetPage] = useState(initialTargetPageState.selectedTargetPage);
  const [customTargetPage, setCustomTargetPage] = useState(initialTargetPageState.customTargetPage);

  const [timeEnd, setTimeEnd] = useState(
    initialSettings?.timeEnd
      ? new Date(initialSettings.timeEnd).toISOString().slice(0, 16)
      : ""
  );
  const [now, setNow] = useState(Date.now());

  const isSaving = fetcher.state === "submitting";

  // Toast notification
  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Settings saved successfully!", { duration: 3000 });
      if (!initialSettings?.id) navigate(-1); 
    }
    if (fetcher.data?.errors) {
      shopify.toast.show(fetcher.data.errors.general || "Save failed", { isError: true });
    }
  }, [fetcher.data, shopify, navigate, initialSettings]);
// select product
  useEffect(() => {
    const matchedProduct =
      products.find((product) => product.path === link || link.endsWith(product.path)) || null;
    setSelectedProductId(matchedProduct?.id || "");
  }, [link, products]);
 // time 
  useEffect(() => {
    if (!timeEnd) return undefined;

    setNow(Date.now());
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeEnd]);

  const handleProductChange = (value) => {
    setSelectedProductId(value);
    const product = products.find((item) => item.id === value);
    if (!product) return;
    setLink(product.path);
  };

  const productOptions = [
    { label: "Select a product", value: "" },
    ...products.map((product) => ({
      label: `${product.title} (${product.status})`,
      value: product.id,
    })),
  ];
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) || null;
  const remainingTime = getRemainingTimeParts(timeEnd, now);

  return (
    <Page
      title={initialSettings ? "Settings Widget" : "Create New Widget"}
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "2fr 1fr" }}>
        
        {/* Form Section */}
        <fetcher.Form method="post">
          <input type="hidden" name="id" value={initialSettings?.id || ""} />

          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd">Widget Settings</Text>

              <FormLayout>
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

                <TextField
                  label="Link (optional)"
                  name="link"
                  value={link}
                  onChange={setLink}
                  placeholder="https://yourstore.com/sale"
                />

                <Select
                  label="Browse Product"
                  value={selectedProductId}
                  onChange={handleProductChange}
                  options={productOptions}
                  helpText="Select a product from your store to fill the link automatically."
                />

                {selectedProductId ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: "1px solid #dfe3e8",
                      borderRadius: "10px",
                    }}
                  >
                    {selectedProduct?.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.imageAlt}
                        style={{
                          width: "56px",
                          height: "56px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : null}
                    <div>
                      <Text variant="bodyMd" fontWeight="medium">
                        {selectedProduct?.title}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {selectedProduct?.path}
                      </Text>
                    </div>
                  </div>
                ) : null}

                <FormLayout.Group>
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="medium">Background Color</Text>
                    <input
                      type="color"
                      name="backgroundColor"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      style={{ width: "80px", height: "50px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                    />
                  </div>

                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="medium">Text Color</Text>
                    <input
                      type="color"
                      name="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ width: "80px", height: "50px", border: "none", borderRadius: "8px", cursor: "pointer" }}
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
                    label="Size"
                    name="size"
                    value={size}
                    onChange={setSize}
                    options={[
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" },
                    ]}
                  />

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

                <Select
                  label="Display on page"
                  name="targetPage"
                  value={targetPage}
                  onChange={setTargetPage}
                  options={PAGE_OPTIONS}
                  helpText="Chon trang cua storefront de banner hien thi."
                />

                {targetPage === "custom" ? (
                  <TextField
                    label="Custom storefront path"
                    name="customTargetPage"
                    value={customTargetPage}
                    onChange={(value) => setCustomTargetPage(normalizeCustomTargetPage(value))}
                    autoComplete="off"
                    placeholder="/pages/about-us"
                    helpText="Vi du: /pages/about-us, /products/your-product, /blogs/news."
                  />
                ) : (
                  <input type="hidden" name="customTargetPage" value="" />
                )}

                <Checkbox
                  label="Active (Status)"
                  checked={status}
                  onChange={(value) => setStatus(value)}
                />

                <input
                  type="hidden"
                  name="status"
                  value={status ? "true" : "false"}
                />

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

                <FormLayout.Group>
                  <TextField
                    label="End Time"
                    type="datetime-local"
                    name="timeEnd"
                    value={timeEnd}
                    onChange={setTimeEnd}
                  />
                </FormLayout.Group>
              </FormLayout>
              <Divider />

              <InlineStack align="end">
                <ButtonGroup>
                  <Button onClick={() => navigate(-1)}>Cancel</Button>
                  <Button variant="primary" submit loading={isSaving}>
                    {initialSettings ? "Save Changes" : "Create Widget"}
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </BlockStack>
          </Card>
        </fetcher.Form>

        {/* Live Preview */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Live Preview</Text>

            <div
              style={{
                backgroundColor: backgroundColor,
                color: color,
                padding: size === "large" ? "28px" : size === "medium" ? "20px" : "14px",
                borderRadius: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                minHeight: "180px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: titleFont,
                  fontSize: size === "large" ? "2rem" : size === "medium" ? "1.6rem" : "1.3rem",
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
                  fontSize: size === "large" ? "1.05rem" : size === "medium" ? "0.95rem" : "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {content}
              </p>

              {remainingTime ? (
                <div
                  style={{
                    marginTop: "18px",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "10px",
                  }}
                >
                  {remainingTime.expired ? (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255,255,255,0.18)",
                        fontFamily: contentFont,
                        fontWeight: 600,
                      }}
                    >
                      Countdown ended
                    </div>
                  ) : (
                    [
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
                            fontSize: size === "large" ? "1.35rem" : "1.1rem",
                            fontWeight: 700,
                          }}
                        >
                          {String(item.value).padStart(2, "0")}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            fontFamily: contentFont,
                            fontSize: "0.8rem",
                            opacity: 0.9,
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
              
            </div>  

            <Card subdued>
              <BlockStack gap="200">
                <Text variant="headingSm">Configuration Summary : </Text>
                <Text>Size: <strong>{size}</strong></Text>
                <Text>Position: <strong>{position}</strong></Text>
                <Text>Priority: <strong>{priority}</strong></Text>
                <Text>Status: <strong>{status ? "Active" : "Disabled"}</strong></Text>
                {timeEnd && (
                  <Text>End Time: <strong>{new Date(timeEnd).toLocaleString()}</strong></Text>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
}
