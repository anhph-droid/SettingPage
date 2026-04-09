// app/routes/app.settings.jsx

import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import {
  Page,
  Card,
  BlockStack,
  TextField,
  ButtonGroup,
  Button,
  Text,
  InlineStack,
  Banner,
} from "@shopify/polaris";

const DEFAULT_SETTINGS = {
  title: "Input your title here",
  content: "Input your content here",
  backgroundColor: "#f3f0ff",
};

const COLOR_OPTIONS = [
  { label: "Lavender", value: "#f3f0ff" },
  { label: "Mint", value: "#dff7e5" },
  { label: "Peach", value: "#ffe6d9" },
  { label: "Sky", value: "#dff1ff" },
  { label: "Slate", value: "#e9ecef" },
];


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const setting = await prisma.app_settings.findUnique({
    where: { shop: session.shop },
  });

  return setting || DEFAULT_SETTINGS;
};


export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const backgroundColor = formData.get("backgroundColor")?.toString().trim() ?? "";
  const errors = {};

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > 10){
    errors.title = "Title must be less than 10 characters";
  }

  if (!content) {
    errors.content = "Content is required";
  } else if (content.length > 50){
    errors.content = "Content must be less than 50 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }   

  await prisma.app_settings.upsert({
    where: { shop: session.shop },
    update: { title, content, backgroundColor },
    create: { shop: session.shop, title, content, backgroundColor },
  });
  
  const shopRes = await admin.graphql(`
    query { shop { id } }
  `);
  const shopJson = await shopRes.json();
  const shopId = shopJson.data.shop.id;

  const metafields = [
    { namespace: "settings", key: "title", type: "single_line_text_field", value: title, ownerId: shopId },
    { namespace: "settings", key: "content", type: "multi_line_text_field", value: content, ownerId: shopId },
    { namespace: "settings", key: "background_color", type: "color", value: backgroundColor, ownerId: shopId },
  ];

  const metafieldResult = await admin.graphql(
    `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key value }
          userErrors { field message }
        }
      }
    `,
    { variables: { metafields } }
  );

  const resultJson = await metafieldResult.json();

  if (resultJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield errors:", resultJson.data.metafieldsSet.userErrors);
    return { 
      ok: false, 
      errors: { general: "Failed to save metafields. Please try again." } 
    };
  }

  return { 
    ok: true, 
    message: "Settings saved successfully" 
  };
};

export default function SettingPage() {
  const initialSettings = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [title, setTitle] = useState(initialSettings?.title || DEFAULT_SETTINGS.title);
  const [content, setContent] = useState(initialSettings?.content || DEFAULT_SETTINGS.content);
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings?.backgroundColor || DEFAULT_SETTINGS.backgroundColor
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Settings saved successfully", { duration: 3000 });
      setErrors({});
    } else if (fetcher.data?.errors) {
      setErrors(fetcher.data.errors);
    }
  }, [fetcher.data, shopify]);

  const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";

  const handleSubmit = (e) => {
    setErrors({});
  };

  return (
    <Page title="Settings Banner">
      <div
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "1.1fr 0.9fr",
        }}
      >
        {/* Form */}
        <fetcher.Form method="post" onSubmit={handleSubmit}>
          <Card>
            <BlockStack gap="400">
              {fetcher.data?.errors?.general && (
                <Banner tone="critical">{fetcher.data.errors.general}</Banner>
              )}

              <TextField
                label="Title"
                name="title"
                value={title}
                onChange={setTitle}
                error={errors.title}
                autoComplete="off"
                maxLength={10}
              />

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Content
                </Text>
                <textarea
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: errors.content ? "1px solid #d82c0d" : "1px solid #ccc",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  maxLength={10}
                />
                {errors.content && (
                  <Text tone="critical" as="p" variant="bodySm">
                    {errors.content}
                  </Text>
                )}
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Background Color
                </Text>
                <BlockStack gap="200">
                  {COLOR_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        border:
                          backgroundColor === option.value
                            ? "2px solid #008060"
                            : "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="backgroundColor"
                        value={option.value}
                        checked={backgroundColor === option.value}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{ accentColor: "#008060" }}
                      />
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: option.value,
                          border: "1px solid #ddd",
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </BlockStack>
                {errors.backgroundColor && (
                  <Text tone="critical" as="p" variant="bodySm">
                    {errors.backgroundColor}
                  </Text>
                )}
              </BlockStack>

              <InlineStack align="end">
                <ButtonGroup>
                  <Button
                    onClick={() => {
                      setTitle(DEFAULT_SETTINGS.title);
                      setContent(DEFAULT_SETTINGS.content);
                      setBackgroundColor(DEFAULT_SETTINGS.backgroundColor);
                      setErrors({});
                    }}
                  >
                    Reset to Default
                  </Button>

                  <Button
                    variant="primary"
                    submit
                    loading={isSaving}
                  >
                    Save Settings
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </BlockStack>
          </Card>
        </fetcher.Form>

        {/* Preview */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingSm">Preview</Text>
            <div
              style={{
                background: backgroundColor,
                padding: "24px",
                borderRadius: "16px",
                minHeight: "180px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  color: "#202223",
                }}
              >
                {title || "Your title will appear here"}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: "#202223",
                }}
              >
                {content || "Your content will appear here"}
              </div>
            </div>
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
}