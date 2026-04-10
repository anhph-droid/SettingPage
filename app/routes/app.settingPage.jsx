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
  const { session } = await authenticate.admin(request);
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
    const start = new Date(timeStartStr);
    const end = new Date(timeEndStr);

    if (start > end) {
      errors.general = "Start time must be before End time";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
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

              <TextField
                label="Text color"
                name="color"
                value={color}
                onChange={setColor}
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
                  Enable banner
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="dismissible"
                    checked={dismissible}
                    onChange={(e) => setDismissible(e.target.checked)}
                  />
                  Allow close
                </label>
              </InlineStack>

              {/* time */}
              <BlockStack gap="100">
                <Text variant="bodySm">Schedule</Text>

                <InlineStack gap="200">
                  <input
                    type="datetime-local"
                    name="timeStart"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    style={{ padding: 8 }}
                  />

                  <input
                    type="datetime-local"
                    name="timeEnd"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    style={{ padding: 8 }}
                  />
                </InlineStack>
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

    {isActive ? (
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
    ) : (
      <div
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            color: "#202223",
          }}
        >
          {timeStart && timeEnd ? `Will show from ${new Date(timeStart).toLocaleString()} to ${new Date(timeEnd).toLocaleString()}` : "Set start and end time to schedule the banner"}
        </div>
    )}
  </BlockStack>
</Card>
    </div>
    </Page>
  );
}