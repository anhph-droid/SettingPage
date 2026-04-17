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

function PreviewCard({ preset }) {
  const previewStyleMap = {
    bar: { width: "92%", height: "28px", top: "22px", left: "4%" },
    small: { width: "32%", height: "88px", top: "72px", right: "6%" },
    inline: { width: "36%", height: "76px", top: "12px", right: "8%" },
    large: { width: "86%", height: "104px", top: "42px", left: "7%" },
  };

  const accent = previewStyleMap[preset.key];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "220px",
        borderRadius: "18px",
        background: preset.key === "large" ? "linear-gradient(135deg, #53545d, #2d2f36)" : "#f4f6fb",
        overflow: "hidden",
        border: "1px solid #e6ebf2",
      }}
    >
      {[...Array(6)].map((_, index) => (
        <div
          key={`line-${preset.key}-${index}`}
          style={{
            position: "absolute",
            top: `${20 + index * 32}px`,
            left: `${index % 2 === 0 ? 16 : 58}%`,
            width: `${index % 3 === 0 ? 46 : 18}%`,
            height: "12px",
            borderRadius: "8px",
            background: preset.key === "large" ? "rgba(255,255,255,0.1)" : "#e7eaf2",
          }}
        />
      ))}

      {[...Array(4)].map((_, index) => (
        <div
          key={`box-${preset.key}-${index}`}
          style={{
            position: "absolute",
            bottom: "16px",
            left: `${16 + index * 24}%`,
            width: "18%",
            height: "44px",
            borderRadius: "8px",
            background: preset.key === "large" ? "rgba(255,255,255,0.08)" : "#eceff5",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          ...accent,
          borderRadius: "12px",
          border: "2px dashed #5b8ef7",
          background: "#1f2027",
          boxShadow: "0 10px 24px rgba(18, 24, 40, 0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            height: "100%",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          <span style={{ width: "18px", height: "8px", borderRadius: "4px", background: "#fff" }} />
          <span style={{ display: "flex", gap: "4px" }}>
            {["6", "12", "24", "36"].map((value) => (
              <span
                key={value}
                style={{
                  display: "inline-flex",
                  width: "22px",
                  height: "22px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  background: "#fff",
                  color: "#111827",
                }}
              >
                {value}
              </span>
            ))}
          </span>
          <span style={{ width: "18px", height: "8px", borderRadius: "4px", background: "#fff" }} />
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
              <InlineStack align="space-between" blockAlign="end">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
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
    </Page>
  );
}
