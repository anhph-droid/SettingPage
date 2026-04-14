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

const DEFAULT_SETTINGS = {
  title: "Input your title here",
  content: "Input your content here",
  backgroundColor: "#f3f0ff",
  color: "#000000",
  size: "medium",
  position: "top",
  priority: 0,
  status: true,
  dismissible: false,
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const banner = await prisma.app_banner.findUnique({
      where: { id: Number(id) },
    });
    return banner;
  }
  return null;
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

  const timeEndStr = formData.get("timeEnd")?.toString().trim();

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
  const initialSettings = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [title, setTitle] = useState(initialSettings?.title || DEFAULT_SETTINGS.title);
  const [content, setContent] = useState(initialSettings?.content || DEFAULT_SETTINGS.content);
  const [link, setLink] = useState(initialSettings?.link || "");
  const [color, setColor] = useState(initialSettings?.color || DEFAULT_SETTINGS.color);
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings?.backgroundColor || DEFAULT_SETTINGS.backgroundColor
  );
  const [size, setSize] = useState(initialSettings?.size || DEFAULT_SETTINGS.size);
  const [position, setPosition] = useState(initialSettings?.position || DEFAULT_SETTINGS.position);
  const [priority, setPriority] = useState(initialSettings?.priority || DEFAULT_SETTINGS.priority);
  const [status, setStatus] = useState(initialSettings?.status ?? DEFAULT_SETTINGS.status);
  const [dismissible, setDismissible] = useState(initialSettings?.dismissible ?? DEFAULT_SETTINGS.dismissible);

  const [timeEnd, setTimeEnd] = useState(
    initialSettings?.timeEnd
      ? new Date(initialSettings.timeEnd).toISOString().slice(0, 16)
      : ""
  );

  const isSaving = fetcher.state === "submitting";

  // Toast notification
  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Settings saved successfully!", { duration: 3000 });
      if (!initialSettings?.id) navigate(-1); // Quay lại sau khi tạo mới
    }
    if (fetcher.data?.errors) {
      shopify.toast.show(fetcher.data.errors.general || "Save failed", { isError: true });
    }
  }, [fetcher.data, shopify, navigate, initialSettings]);

  const handleSubmit = (e) => {
    // Remix sẽ tự handle form
  };

  return (
    <Page
      title={initialSettings ? "Edit Widget" : "Create New Widget"}
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "2fr 1fr" }}>
        
        {/* Form Section */}
        <fetcher.Form method="post" onSubmit={handleSubmit}>
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

                <Checkbox
                  label="Active (Status)"
                  name="status"
                  checked={status}
                  onChange={setStatus}
                />

                <Checkbox
                  label="Dismissible (user can close)"
                  name="dismissible"
                  checked={dismissible}
                  onChange={setDismissible}
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
              <Text variant="headingLg" fontWeight="bold" as="h3">
                {title}
              </Text>
              <Text variant="bodyMd" style={{ marginTop: "8px", opacity: 0.9 }}>
                {content}
              </Text>
              {link && (
                <Button plain monochrome style={{ marginTop: "12px" }}>
                  Learn more →
                </Button>
              )}
            </div>

            <Card subdued>
              <BlockStack gap="200">
                <Text variant="headingSm">Configuration Summary</Text>
                <Text>Size: <strong>{size}</strong></Text>
                <Text>Position: <strong>{position}</strong></Text>
                <Text>Priority: <strong>{priority}</strong></Text>
                <Text>Status: <strong>{status ? "Active" : "Disabled"}</strong></Text>
                <Text>Dismissible: <strong>{dismissible ? "Yes" : "No"}</strong></Text>
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