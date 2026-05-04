import { BlockStack, Button, Card, InlineStack, Page, Text } from "@shopify/polaris";
import { useNavigate } from "react-router";

const WIDGET_TYPES = [
  {
    key: "bar",
    title: "Bar",
    description: "Narrow horizontally aligned timer. Best for the top or bottom of any page.",
    action: "/app/create-bar",
    label: "For all pages",
  },
  {
    key: "small",
    title: "Small",
    description: "Small timer with no or solid background. Best for the product page and other sections.",
    action: "/app/create-small",
    label: "Product widget",
  },
  {
    key: "inline",
    title: "Inline",
    description: "Compact timer with no or solid background. For any place, from cart drawer to product cards.",
    action: "/app/create-inline",
    label: "Flexible placement",
  },
  {
    key: "large",
    title: "Large",
    description: "Page-wide timer with background image. Best for home, collection, and password page.",
    action: "/app/create-large",
    label: "Campaign hero",
  },
];

const COUNTDOWN_VALUES = [
  { value: "02", label: "days" },
  { value: "21", label: "hours" },
  { value: "41", label: "mins" },
  { value: "42", label: "secs" },
];

const PREVIEW_SURFACES = {
  bar: {
    minHeight: "260px",
    padding: "18px",
    background:
      "radial-gradient(circle at top right, rgba(253, 224, 71, 0.18), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  },
  small: {
    minHeight: "260px",
    padding: "20px",
    background:
      "radial-gradient(circle at top left, rgba(221, 214, 254, 0.5), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  },
  inline: {
    minHeight: "260px",
    padding: "20px",
    background:
      "radial-gradient(circle at top left, rgba(191, 219, 254, 0.45), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  },
  large: {
    minHeight: "260px",
    padding: "20px",
    background:
      "radial-gradient(circle at top left, rgba(254, 215, 170, 0.4), transparent 28%), radial-gradient(circle at 82% 18%, rgba(191, 219, 254, 0.35), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  },
};

const FRAME_BOX = {
  position: "absolute",
  borderRadius: "12px",
  background: "rgba(17, 24, 39, 0.06)",
};

function PreviewCountdown({ mode }) {
  if (mode === "large") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        {COUNTDOWN_VALUES.map((item) => (
          <div
            key={item.label}
            style={{
              width: "72px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                color: "#111827",
                fontSize: "42px",
                lineHeight: 1,
                fontWeight: 800,
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                color: "rgba(17, 24, 39, 0.72)",
                fontSize: "12px",
                textTransform: "lowercase",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const boxSize = mode === "small" ? 24 : 30;
  const railColor = mode === "bar" ? "rgba(255,255,255,0.92)" : "rgba(17, 24, 39, 0.14)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          width: "14px",
          height: "6px",
          borderRadius: "999px",
          background: railColor,
        }}
      />
      {COUNTDOWN_VALUES.map((item) => (
        <span
          key={item.label}
          style={{
            display: "inline-flex",
            width: `${boxSize}px`,
            height: `${boxSize}px`,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: mode === "bar" ? "4px" : "8px",
            background: "#ffffff",
            color: "#111827",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {item.value}
        </span>
      ))}
      <span
        style={{
          width: "14px",
          height: "6px",
          borderRadius: "999px",
          background: railColor,
        }}
      />
    </div>
  );
}

function PreviewLine({ width, height = 10, color = "rgba(17, 24, 39, 0.16)" }) {
  return (
    <span
      style={{
        display: "block",
        width,
        height,
        borderRadius: "999px",
        background: color,
      }}
    />
  );
}

function PreviewCard({ preset }) {
  const isBar = preset.key === "bar";
  const isSmall = preset.key === "small";
  const isInline = preset.key === "inline";
  const isLarge = preset.key === "large";

  const bannerStyle = isBar
    ? {
        width: "100%",
        minHeight: "52px",
        padding: "12px 16px",
        borderRadius: "14px",
        background: "#1f2027",
        color: "#f8fafc",
        boxShadow: "0 16px 28px rgba(15, 23, 42, 0.18)",
      }
    : isSmall
      ? {
          width: "260px",
          minHeight: "140px",
          padding: "18px",
          margin: "0 auto",
          borderRadius: "14px",
          background: "linear-gradient(180deg, #f7f3ff 0%, #efe9ff 100%)",
          boxShadow: "0 12px 30px rgba(17, 24, 39, 0.14)",
        }
      : isInline
        ? {
            width: "100%",
            maxWidth: "520px",
            minHeight: "50px",
            padding: "12px 18px",
            margin: "0 auto",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid rgba(17, 24, 39, 0.08)",
            boxShadow: "0 10px 24px rgba(17, 24, 39, 0.12)",
          }
        : {
            width: "100%",
            maxWidth: "520px",
            minHeight: "140px",
            padding: "12px 18px",
            margin: "0 auto",
            borderRadius: "14px",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid rgba(17, 24, 39, 0.08)",
            boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)",
          };

  const contentStyle = isBar
    ? {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
        minHeight: "100%",
      }
    : isInline
      ? {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          textAlign: "center",
          minHeight: "100%",
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isLarge ? "18px" : "12px",
          textAlign: "center",
          minHeight: "100%",
        };

  const previewChrome = (
    <>
      <div style={{ ...FRAME_BOX, left: "22px", top: "30px", width: "48px", height: "10px", borderRadius: "999px" }} />
      <div style={{ ...FRAME_BOX, right: "22px", top: "28px", width: "10px", height: "10px", borderRadius: "999px" }} />
    </>
  );

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        border: "1px solid #e6ebf2",
        ...PREVIEW_SURFACES[preset.key],
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "14px",
          borderRadius: "16px",
          border: "1px dashed rgba(148, 163, 184, 0.35)",
          pointerEvents: "none",
        }}
      />

      {previewChrome}

      {isBar ? (
        <>
          <div style={{ ...FRAME_BOX, left: "22px", top: "58px", width: "456px", height: "42px", borderRadius: "14px" }} />
          <div style={{ ...FRAME_BOX, left: "22px", top: "116px", width: "456px", height: "92px" }} />
          <div style={{ ...FRAME_BOX, left: "22px", bottom: "22px", width: "100px", height: "64px" }} />
          <div style={{ ...FRAME_BOX, left: "136px", bottom: "22px", width: "100px", height: "64px" }} />
          <div style={{ ...FRAME_BOX, left: "250px", bottom: "22px", width: "100px", height: "64px" }} />
          <div style={{ ...FRAME_BOX, left: "364px", bottom: "22px", width: "100px", height: "64px" }} />
        </>
      ) : null}

      {isSmall ? (
        <>
          <div style={{ ...FRAME_BOX, left: "20px", top: "48px", width: "56px", height: "166px" }} />
          <div style={{ ...FRAME_BOX, left: "92px", top: "48px", width: "226px", height: "166px" }} />
          <div style={{ ...FRAME_BOX, left: "334px", top: "48px", width: "126px", height: "26px", borderRadius: "8px" }} />
          <div style={{ ...FRAME_BOX, left: "334px", top: "86px", width: "148px", height: "26px", borderRadius: "8px" }} />
          <div style={{ ...FRAME_BOX, left: "334px", top: "126px", width: "96px", height: "14px", borderRadius: "999px" }} />
          <div style={{ ...FRAME_BOX, left: "334px", top: "156px", width: "128px", height: "14px", borderRadius: "999px" }} />
          <div style={{ ...FRAME_BOX, left: "334px", bottom: "26px", width: "42px", height: "26px" }} />
          <div style={{ ...FRAME_BOX, left: "388px", bottom: "26px", width: "42px", height: "26px" }} />
          <div style={{ ...FRAME_BOX, left: "442px", bottom: "26px", width: "42px", height: "26px" }} />
        </>
      ) : null}

      {isInline ? (
        <>
          <div style={{ ...FRAME_BOX, left: "18px", top: "64px", width: "112px", height: "118px" }} />
          <div style={{ ...FRAME_BOX, left: "144px", top: "64px", width: "112px", height: "118px" }} />
          <div style={{ ...FRAME_BOX, left: "270px", top: "64px", width: "112px", height: "118px" }} />
          <div style={{ ...FRAME_BOX, left: "18px", bottom: "30px", width: "52px", height: "12px", borderRadius: "4px", background: "#1f2027" }} />
          <div style={{ ...FRAME_BOX, left: "84px", bottom: "28px", width: "44px", height: "14px", borderRadius: "999px" }} />
          <div style={{ ...FRAME_BOX, left: "152px", bottom: "30px", width: "52px", height: "12px", borderRadius: "4px", background: "#1f2027" }} />
          <div style={{ ...FRAME_BOX, left: "218px", bottom: "28px", width: "44px", height: "14px", borderRadius: "999px" }} />
          <div style={{ ...FRAME_BOX, left: "286px", bottom: "30px", width: "52px", height: "12px", borderRadius: "4px", background: "#1f2027" }} />
          <div style={{ ...FRAME_BOX, left: "352px", bottom: "28px", width: "44px", height: "14px", borderRadius: "999px" }} />
        </>
      ) : null}

      {isLarge ? (
        <>
          <div style={{ ...FRAME_BOX, left: "26px", bottom: "26px", width: "146px", height: "34px" }} />
          <div style={{ ...FRAME_BOX, left: "186px", bottom: "26px", width: "146px", height: "34px" }} />
          <div style={{ ...FRAME_BOX, left: "346px", bottom: "26px", width: "146px", height: "34px" }} />
        </>
      ) : null}
     
      <div
        style={
          isInline
            ? {
                ...bannerStyle,
                position: "absolute",
                top: "30px",
                right: "20px",
                width: "152px",
                minHeight: "0",
                padding: "10px 10px",
                boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
              }
            : bannerStyle
        }
      >
        <div style={contentStyle}>
          {isBar ? (
            <>
              <PreviewLine width="112px" height={10} color="rgba(255,255,255,0.32)" />
              <PreviewCountdown mode="bar" />
              <PreviewLine width="78px" height={10} color="rgba(255,255,255,0.2)" />
            </>
          ) : (
            <>
              {!isInline && !isLarge ? (
                <PreviewLine width="96px" height={8} color="rgba(17,24,39,0.18)" />
              ) : null}

              <PreviewLine
                width={isLarge ? "220px" : isInline ? "82px" : "144px"}
                height={isLarge ? 18 : 12}
                color="rgba(17,24,39,0.78)"
              />

              {isLarge ? (
                <BlockStack gap="100" inlineAlign="center">
                  <PreviewLine width="280px" height={10} color="rgba(17,24,39,0.16)" />
                  <PreviewLine width="220px" height={10} color="rgba(17,24,39,0.12)" />
                </BlockStack>
              ) : null}

              <PreviewCountdown mode={isLarge ? "large" : isInline ? "inline" : "small"} />

              {!isInline ? (
                <PreviewLine
                  width={isLarge ? "168px" : "128px"}
                  height={10}
                  color={isLarge ? "rgba(17,24,39,0.2)" : "rgba(17,24,39,0.14)"}
                />
              ) : null}

              {isLarge ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "136px",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    border: "1px dashed rgba(17, 24, 39, 0.28)",
                    background: "#ffffff",
                  }}
                >
                  <PreviewLine width="68px" height={10} color="rgba(17,24,39,0.7)" />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Page title="Choose widget type" subtitle="Select the layout you want before creating the banner.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "20px",
        }}
      >
        {WIDGET_TYPES.map((preset) => (
          <Card key={preset.key} padding="400">
            <BlockStack gap="400">
              <PreviewCard preset={preset} />
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center" wrap={false}>
                    <Text as="h2" variant="headingMd">
                      {preset.title}
                    </Text>
                    <Text as="span" tone="subdued" variant="bodySm">
                      {preset.label}
                    </Text>
                  </InlineStack>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {preset.description}
                  </Text>
                </BlockStack>
                <Button variant="primary" onClick={() => navigate(preset.action)}>
                  Select
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "24px",
          marginTop: "24px",
          fontSize: "14px",
        }}
      >
        <span
          style={{ cursor: "pointer", textDecoration: "underline", color: "#6d7175" }}
          onClick={() => navigate("/faq")}
        >
          View FAQ
        </span>

        <span
          style={{ cursor: "pointer", textDecoration: "underline", color: "#6d7175" }}
          onClick={() => navigate("/manual")}
        >
          View user manual
        </span>

        <span
          style={{ cursor: "pointer", textDecoration: "underline", color: "#6d7175" }}
          onClick={() => navigate("/updates")}
        >
          Join us on X for updates
        </span>
      </div>
    </Page>
  );
}
