import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  ButtonGroup,
  Tabs,
  Badge,
  TextField,
  Checkbox,
  Select,
  RangeSlider,
  Divider,
} from "@shopify/polaris";

import { useState } from "react";
import { useNavigate } from "react-router";

const PRESETS = [
  {
    title: "Time is ticking",
    subtitle: "Sale ends in:",
    badgeText: "SAVE 35%",
    backgroundColor: "#111827",
    textColor: "#ffffff",
    badgeTone: "success",
  },
  {
    title: "Flash sale",
    subtitle: "Only a few hours left",
    badgeText: "HOT DEAL",
    backgroundColor: "#7c2d12",
    textColor: "#fff7ed",
    badgeTone: "warning",
  },
  {
    title: "Limited drop",
    subtitle: "Offer closes soon",
    badgeText: "NEW",
    backgroundColor: "#1e3a8a",
    textColor: "#dbeafe",
    badgeTone: "info",
  },
  {
    title: "Weekend offer",
    subtitle: "Ends at midnight",
    badgeText: "SAVE 20%",
    backgroundColor: "#14532d",
    textColor: "#f0fdf4",
    badgeTone: "success",
  },
];

export default function BarTimerSettings() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState("top");
  const [isSticky, setIsSticky] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(true);

  const [title, setTitle] = useState("Title");
  const [subtitle, setSubtitle] = useState("Sale ends in: ");
  const [badgeText, setBadgeText] = useState("SAVE 35%");
  const [ctaText, setCtaText] = useState("Http:shope");

  const [days, setDays] = useState("2");
  const [hours, setHours] = useState("23");
  const [minutes, setMinutes] = useState("59");
  const [seconds, setSeconds] = useState("56");

  const [audience, setAudience] = useState("all");
  const [device, setDevice] = useState("both");
  const [frequency, setFrequency] = useState("always");

  const [backgroundColor, setBackgroundColor] = useState("#111827");
  const [textColor, setTextColor] = useState("#ffffff");
  const [radius, setRadius] = useState(8);
  const [padding, setPadding] = useState(16);

  const tabs = [
    { id: "general", content: "General" },
    { id: "content", content: "Content" },
    { id: "timer", content: "Timer" },
    { id: "targeting", content: "Targeting" },
    { id: "background", content: "Background" },
  ];

  const audienceOptions = [
    { label: "All visitors", value: "all" },
    { label: "New visitors", value: "new" },
    { label: "Returning visitors", value: "returning" },
  ];

  const deviceOptions = [
    { label: "Desktop and mobile", value: "both" },
    { label: "Desktop only", value: "desktop" },
    { label: "Mobile only", value: "mobile" },
  ];

  const frequencyOptions = [
    { label: "Always show", value: "always" },
    { label: "Once per session", value: "session" },
    { label: "Hide after close", value: "dismissed" },
  ];

  const applyPreset = (preset) => {
    setTitle(preset.title.toUpperCase());
    setSubtitle(preset.subtitle);
    setBadgeText(preset.badgeText);
    setBackgroundColor(preset.backgroundColor);
    setTextColor(preset.textColor);
  };

  const renderTabContent = () => {
    if (selected === 0) {
      return (
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued">
              Position
            </Text>
            <ButtonGroup>
              <Button
                pressed={position === "top"}
                onClick={() => setPosition("top")}
              >
                Top
              </Button>
              <Button
                pressed={position === "bottom"}
                onClick={() => setPosition("bottom")}
              >
                Bottom
              </Button>
            </ButtonGroup>
          </BlockStack>

          <Checkbox
            label="Sticky bar"
            checked={isSticky}
            onChange={setIsSticky}
          />

          <Checkbox
            label="Show close button"
            checked={showCloseButton}
            onChange={setShowCloseButton}
          />

          <Divider />

          <BlockStack gap="200">
            <Text variant="headingSm">Presets</Text>
            {PRESETS.map((preset) => (
              <Card key={preset.title}>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text fontWeight="medium">{preset.title}</Text>
                    <Badge tone={preset.badgeTone}>{preset.badgeText}</Badge>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued">
                    {preset.subtitle}
                  </Text>
                  <Button onClick={() => applyPreset(preset)}>Apply preset</Button>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </BlockStack>
      );
    }

    if (selected === 1) {
      return (
        <BlockStack gap="400">
          <TextField label="Headline" value={title} onChange={setTitle} autoComplete="off" />
          <TextField label="Supporting text" value={subtitle} onChange={setSubtitle} autoComplete="off" />
          <TextField label="Badge text" value={badgeText} onChange={setBadgeText} autoComplete="off" />
          <TextField label="CTA label" value={ctaText} onChange={setCtaText} autoComplete="off" />
        </BlockStack>
      );
    }

    if (selected === 2) {
      return (
        <BlockStack gap="400">
          <InlineStack gap="200" wrap={false} blockAlign="start">
            <div style={{ flex: 1 }}>
              <TextField label="Days" type="number" value={days} onChange={setDays} autoComplete="off" />
            </div>
            <div style={{ flex: 1 }}>
              <TextField label="Hours" type="number" value={hours} onChange={setHours} autoComplete="off" />
            </div>
          </InlineStack>

          <InlineStack gap="200" wrap={false} blockAlign="start">
            <div style={{ flex: 1 }}>
              <TextField label="Minutes" type="number" value={minutes} onChange={setMinutes} autoComplete="off" />
            </div>
            <div style={{ flex: 1 }}>
              <TextField label="Seconds" type="number" value={seconds} onChange={setSeconds} autoComplete="off" />
            </div>
          </InlineStack>

          <Text variant="bodySm" tone="subdued">
            Use this tab to mock countdown values before wiring real data.
          </Text>
        </BlockStack>
      );
    }

    if (selected === 3) {
      return (
        <BlockStack gap="400">
          <Select label="Audience" options={audienceOptions} value={audience} onChange={setAudience} />
          <Select label="Device targeting" options={deviceOptions} value={device} onChange={setDevice} />
          <Select label="Display frequency" options={frequencyOptions} value={frequency} onChange={setFrequency} />
        </BlockStack>
      );
    }

    return (
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text variant="bodyMd" as="p">
            Background color
          </Text>
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              aria-label="Background color"
              style={{
                width: "48px",
                height: "48px",
                padding: 0,
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "transparent",
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1 }}>
              <TextField
                label="Background color"
                labelHidden
                value={backgroundColor}
                onChange={setBackgroundColor}
                autoComplete="off"
              />
            </div>
          </InlineStack>
        </BlockStack>
        <BlockStack gap="200">
          <Text variant="bodyMd" as="p">
            Text color
          </Text>
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <input
              type="color"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
              aria-label="Text color"
              style={{
                width: "48px",
                height: "48px",
                padding: 0,
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "transparent",
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1 }}>
              <TextField
                label="Text color"
                labelHidden
                value={textColor}
                onChange={setTextColor}
                autoComplete="off"
              />
            </div>
          </InlineStack>
        </BlockStack>
        <RangeSlider
          label={`Border radius: ${radius}px`}
          value={radius}
          onChange={setRadius}
          min={0}
          max={24}
        />
        <RangeSlider
          label={`Padding: ${padding}px`}
          value={padding}
          onChange={setPadding}
          min={8}
          max={28}
        />
      </BlockStack>
    );
  };

  return (
    <Page
      title="Bar timer"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd">Bar timer</Text>
            </InlineStack>

            <Card background="bg-surface-secondary">
              <BlockStack gap="200">
                <Text fontWeight="medium">Activate the app in your theme</Text>
                <Text variant="bodySm" tone="subdued">
                  Enable app embed in theme editor to use widget
                </Text>
                <Button>Activate</Button>
              </BlockStack>
            </Card>

            <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

            {renderTabContent()}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd">Preview</Text>
              <Badge>{position === "top" ? "Top bar" : "Bottom bar"}</Badge>
            </InlineStack>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  background: backgroundColor,
                  color: textColor,
                  padding: `${padding}px`,
                  borderRadius: `${radius}px`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  boxShadow: isSticky
                    ? "0 10px 24px rgba(15, 23, 42, 0.16)"
                    : "none",
                }}
              >
                <BlockStack gap="100">
                  <Text as="span" variant="headingMd" fontWeight="bold">
                    {title}
                  </Text>
                  <Text as="span" variant="bodySm">
                    {subtitle}
                  </Text>
                </BlockStack>

                <InlineStack gap="400" blockAlign="center">
                  <Text as="span">
                    <b>{days}</b> d
                  </Text>
                  <Text as="span">
                    <b>{hours}</b> h
                  </Text>
                  <Text as="span">
                    <b>{minutes}</b> m
                  </Text>
                  <Text as="span">
                    <b>{seconds}</b> s
                  </Text>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">{badgeText}</Badge>
                  <Button size="slim">{ctaText}</Button>
                  {showCloseButton ? (
                    <Button variant="plain" accessibilityLabel="Close preview bar">
                      ×
                    </Button>
                  ) : null}
                </InlineStack>
              </div>
            </div>
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
}
