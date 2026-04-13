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
} from "@shopify/polaris";

const DEFAULT_SETTINGS = {
  title: "Input your title here",
  content: "Input your content here",
  backgroundColor: "#f3f0ff",
  timeStart: "",
  timeEnd: "",
};


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const setting = await prisma.app_banner.findUnique({
    where: { shop: session.shop },
  });

  return setting || DEFAULT_SETTINGS;
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title")?.toString() || "";
  const content = formData.get("content")?.toString() || "";
  const link = formData.get("link")?.toString() || "";

  const color = formData.get("color")?.toString() || "#000000";
  const backgroundColor =
    formData.get("backgroundColor")?.toString() || "#f5f5f5";

  const size = formData.get("size")?.toString() || "medium";
  const position = formData.get("position")?.toString() || "top";

  const priority = Number(formData.get("priority") || 0);

  const status = formData.get("status") === "on";
  const dismissible = formData.get("dismissible") === "on";

  const timeStartStr = formData.get("timeStart")?.toString().trim();
  const timeEndStr = formData.get("timeEnd")?.toString().trim();

  const errors = {};

  // validate time
  if (timeStartStr && timeEndStr) {
    if (new Date(timeStartStr) > new Date(timeEndStr)) {
      errors.general = "Start time must be before End time";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const shopRes = await admin.graphql(`
    query {
      shop {
        id
      }
    }
  `);

  const shopJson = await shopRes.json();
  const shopId = shopJson.data.shop.id;

  const metafields = [];

  if (title) {
    metafields.push({
      namespace: "banner",
      key: "title",
      type: "single_line_text_field",
      value: title,
      ownerId: shopId,
    });
  }

  if (content) {
    metafields.push({
      namespace: "banner",
      key: "content",
      type: "multi_line_text_field",
      value: content,
      ownerId: shopId,
    });
  }

  if (link) {
    metafields.push({
      namespace: "banner",
      key: "link",
      type: "single_line_text_field",
      value: link,
      ownerId: shopId,
    });
  }

  metafields.push(
    {
      namespace: "banner",
      key: "color",
      type: "single_line_text_field",
      value: color,
      ownerId: shopId,
    },
    {
      namespace: "banner",
      key: "background_color",
      type: "single_line_text_field",
      value: backgroundColor,
      ownerId: shopId,
    },
    {
      namespace: "banner",
      key: "status",
      type: "boolean",
      value: status ? "true" : "false",
      ownerId: shopId,
    }
  );

  if (timeStartStr) {
    metafields.push({
      namespace: "banner",
      key: "time_start",
      type: "date_time",
      value: new Date(timeStartStr + ":00").toISOString(),
      ownerId: shopId,
    });
  }

  if (timeEndStr) {
    metafields.push({
      namespace: "banner",
      key: "time_end",
      type: "date_time",
      value: new Date(timeEndStr + ":00").toISOString(),
      ownerId: shopId,
    });
  }

  const res = await admin.graphql(
    `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `,
    { variables: { metafields } }
  );

  const json = await res.json();
  console.log("METAFIELD RESULT:", json);

  if (json.data.metafieldsSet.userErrors.length > 0) {
    return {
      ok: false,
      errors: json.data.metafieldsSet.userErrors,
    };
  }

  await prisma.app_banner.upsert({
    where: { shop: session.shop },
    update: {
      title,
      content,
      link,
      color,
      backgroundColor,
      size,
      position,
      priority,
      status,
      dismissible,
      timeStart: timeStartStr ? new Date(timeStartStr) : null,
      timeEnd: timeEndStr ? new Date(timeEndStr) : null,
    },
    create: {
      shop: session.shop,
      title,
      content,
      link,
      color,
      backgroundColor,
      size,
      position,
      priority,
      status,
      dismissible,
      timeStart: timeStartStr ? new Date(timeStartStr) : null,
      timeEnd: timeEndStr ? new Date(timeEndStr) : null,
    },
  });

  return { ok: true };
};

export default function SettingPage() {
  const initialSettings = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [link, setLink] = useState(initialSettings?.link || "");
  const [color, setColor] = useState(initialSettings?.color || "#000000");
  const [size, setSize] = useState(initialSettings?.size || "medium");
  const [position, setPosition] = useState(initialSettings?.position || "top");
  const [priority, setPriority] = useState(initialSettings?.priority || 0);
  const [status, setStatus] = useState(initialSettings?.status || false);
  const [title, setTitle] = useState(initialSettings?.title || DEFAULT_SETTINGS.title);
  const [content, setContent] = useState(initialSettings?.content || DEFAULT_SETTINGS.content);
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings?.backgroundColor || DEFAULT_SETTINGS.backgroundColor
  );  

const [timeStart, setTimeStart] = useState(
  initialSettings?.timeStart
    ? new Date(initialSettings.timeStart).toISOString().slice(0, 16)
    : ""
);

const [timeEnd, setTimeEnd] = useState(
  initialSettings?.timeEnd
    ? new Date(initialSettings.timeEnd).toISOString().slice(0, 16)
    : ""
);

const now = new Date();

const isActive =
  (!timeStart || new Date(timeStart) <= now) &&
  (!timeEnd || new Date(timeEnd) >= now);

  const [errors, setErrors] = useState({});

useEffect(() => {
  if (!fetcher.data) return;

  if (fetcher.data.ok) {
    shopify.toast.show("Settings saved successfully", {
      duration: 3000,
    });
  }

  if (fetcher.data.errors) {
    shopify.toast.show("Error saving settings", {
      duration: 3000,
    });
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
          <fetcher.Form method="post" onSubmit={handleSubmit}>
          <Card>
            <BlockStack gap="400">
              <TextField
                label="Title"
                name="title"
                value={title}
                onChange={setTitle}
              />

              <TextField
                label="Content"
                name="content"
                value={content}
                onChange={setContent}
                multiline={4}
              />

              <TextField
                label="Link"
                name="link"
                value={link}
                onChange={setLink}
                placeholder="https://..."
              />
              <Text variant="bodySm">Background color</Text>
                <input
                  type="color"
                  name="backgroundColor"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{ width: "60px", height: "40px", border: "none" }}
              />

             <Text variant="bodySm">Text color</Text>
                <input
                  type="color"
                  name="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: "60px", height: "40px", border: "none" }}
               />

              {/* size */}
              <BlockStack gap="100">
                <Text variant="bodySm">Size</Text>
                <select
                  name="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </BlockStack>

              {/* position */}
              <BlockStack gap="100">
                <Text variant="bodySm">Position</Text>
                <select
                  name="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </BlockStack>

              <TextField
                label="Priority"
                type="number"
                name="priority"
                value={priority}
                onChange={setPriority}
              />

              {/* checkbox */}
              <InlineStack gap="400">
                <label>
                  <input
                    type="checkbox"
                    name="status"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                  />
                  Status
                </label>

              </InlineStack>

              {/* time */}
              <BlockStack gap="100">
                <Text variant="bodySm">Time end</Text>
                  <input
                    type="datetime-local"
                    name="timeEnd"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    style={{ padding: 8 }}
                  />
              </BlockStack>

              <InlineStack align="end">
                <ButtonGroup>
                  <Button
                    onClick={() => {
                      setTitle(DEFAULT_SETTINGS.title);
                      setContent(DEFAULT_SETTINGS.content);
                      setBackgroundColor(DEFAULT_SETTINGS.backgroundColor);
                      setTimeStart("");
                      setTimeEnd("");
                      setErrors({});
                    }}
                  >
                    Reset to Default
                  </Button>

                  <Button variant="primary" submit loading={isSaving}>
                    Save Settings
                  </Button>
                </ButtonGroup>
              </InlineStack>

            </BlockStack>
          </Card>
        </fetcher.Form>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingSm">Preview</Text>
              <Card>
                <BlockStack gap="200">
                  <text>{title}</text>
                  <text>{content}</text>
                  <Text variant="headingXs">Configuration</Text>
                  <Text> Link: {link || "—"}</Text>
                  <Text> Text color: {color}</Text>
                  <Text> Background: {backgroundColor}</Text>
                  <Text> Size: {size}</Text>
                  <Text> Position: {position}</Text>
                  <Text> Priority: {priority}</Text>
                  <Text> Status: {status ? "ON" : "OFF"}</Text>
                  <Text>
                     Time end :
                    { timeEnd ? ` ${new Date( timeEnd ).toLocaleString()}`: " Not scheduled"}
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>     
    </div>
    </Page>
  );
}