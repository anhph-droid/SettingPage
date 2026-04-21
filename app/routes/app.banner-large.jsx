import { useNavigate, useFetcher, useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getBannerPreset, getBannerPreviewStyle, getBannerSize } from "../lib/bannerPresets";

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
  await authenticate.admin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const preset = url.searchParams.get("preset");
  let banner = null;

  if (id) {
    banner = await prisma.app_banner.findUnique({
      where: { id: Number(id) },
    });
  }

  return { banner, preset: getBannerPreset(preset) };
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
  const targetPage = formData.get("targetPage")?.toString() || "all";
  const customTargetPage = normalizeCustomTargetPage(
    formData.get("customTargetPage")?.toString() || "",
  );
  const timeEndStr = formData.get("timeEnd")?.toString().trim();
  const borderColor = formData.get("borderColor")?.toString() || "#cccccc";
  const borderWidth = formData.get("borderWidth")?.toString() || "0";
  const borderStyle = formData.get("borderStyle")?.toString() || "solid";
  const borderRadius = formData.get("borderRadius")?.toString() || "0";
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
    link: null,
    color,
    backgroundColor,
    size,
    position,
    priority,
    status,
    dismissible,
    borderColor,
    borderWidth,
    borderStyle,
    borderRadius,
    targetProductId: null,
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
  const { banner: initialSettings, preset } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
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
  const initialTargetPageState = getTargetPageState(initialSettings?.targetPage);
  const [targetPage, setTargetPage] = useState(initialTargetPageState.selectedTargetPage);
  const [customTargetPage, setCustomTargetPage] = useState(initialTargetPageState.customTargetPage);
  const [timeEnd, setTimeEnd] = useState(
    initialSettings?.timeEnd
      ? new Date(initialSettings.timeEnd).toISOString().slice(0, 16)
      : "",
  );
  const [now, setNow] = useState(Date.now());

  const isSaving = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Settings saved successfully!", { duration: 3000 });
      if (!initialSettings?.id) navigate(-1);
    }
    if (fetcher.data?.errors) {
      shopify.toast.show(fetcher.data.errors.general || "Save failed", { isError: true });
    }
  }, [fetcher.data, shopify, navigate, initialSettings]);

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
  const [borderColor, setBorderColor] = useState(initialSettings?.borderColor || "#cccccc");
  const [borderWidth, setBorderWidth] = useState(initialSettings?.borderWidth || "0");
  const [borderStyle, setBorderStyle] = useState(initialSettings?.borderStyle || "solid");
  const [borderRadius, setBorderRadius] = useState(initialSettings?.borderRadius || "0");

  return (
    <Page
      title={initialSettings ? "Edit Banner" : "Create Large widget"}
      subtitle="Banner chung hien thi tren storefront"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "2fr 1fr" }}>
        <fetcher.Form method="post">
          <input type="hidden" name="id" value={initialSettings?.id || ""} />
          <input type="hidden" name="size" value={size} />

          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd">Banner Settings</Text>
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

                <FormLayout.Group>
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="medium">
                      Background Color
                    </Text>
                    <input
                      type="color"
                      name="backgroundColor"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
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
                      onChange={(e) => setColor(e.target.value)}
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

                <Text variant="headingMd">Border & Shape</Text>

                  <FormLayout.Group>
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="medium">Border Color</Text>
                      <input
                        type="color"
                        name="borderColor"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        style={{ width: "80px", height: "50px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                      />
                    </div>

                    <Select
                      label="Border Style"
                      name="borderStyle"
                      value={borderStyle}
                      onChange={setBorderStyle}
                      options={[
                        { label: "None", value: "none" },
                        { label: "Solid", value: "solid" },
                        { label: "Dashed", value: "dashed" },
                        { label: "Dotted", value: "dotted" },
                      ]}
                    />
                  </FormLayout.Group>

                  <FormLayout.Group>
                    <TextField
                      label="Border Width (px)"
                      type="number"
                      name="borderWidth"
                      value={borderWidth}
                      onChange={setBorderWidth}
                      suffix="px"
                      min={0}
                      max={20}
                    />
                    <TextField
                      label="Border Radius (px)"
                      type="number"
                      name="borderRadius"
                      value={borderRadius}
                      onChange={setBorderRadius}
                      suffix="px"
                      min={0}
                      max={100}
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
                    helpText="Vi du: /pages/about-us, /collections/all, /blogs/news."
                  />
                ) : (
                  <input type="hidden" name="customTargetPage" value="" />
                )}

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
                    {initialSettings ? "Save Changes" : "Create Banner"}
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </BlockStack>
          </Card>
        </fetcher.Form>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Live Preview</Text>

            <div
              style={{
                backgroundColor,
                color,
                ...previewStyle.container,
                textAlign: "center",
                border: borderStyle === "none" ? "none" : `${borderWidth}px ${borderStyle} ${borderColor}`,
                borderRadius: `${borderRadius}px`,
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
    </Page>
  );
}
