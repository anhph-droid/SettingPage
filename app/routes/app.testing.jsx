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
} from "@shopify/polaris";

import { useState } from "react";
import { useNavigate } from "react-router";

export default function BarTimerSettings() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(0);
  const [isSticky, setIsSticky] = useState(true);
  const [position, setPosition] = useState("top");

  const [days, setDays] = useState(2);
  const [hours, setHours] = useState(23);
  const [minutes, setMinutes] = useState(59);
  const [seconds, setSeconds] = useState(56);

  const tabs = [
    { id: "general", content: "General" },
    { id: "content", content: "Content" },
    { id: "timer", content: "Timer" },
    { id: "targeting", content: "Targeting" },
  ];

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
        }}
      >
        {/* LEFT SIDEBAR */}
        <Card>
          <BlockStack gap="400">
            {/* Header */}
            <InlineStack align="space-between">
              <Text variant="headingMd">Bar timer</Text>
              <Badge tone="critical">Disabled</Badge>
            </InlineStack>

            {/* Activate box */}
            <Card background="bg-surface-secondary">
              <BlockStack gap="200">
                <Text fontWeight="medium">
                  Activate the app in your theme
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Enable app embed in theme editor to use widget
                </Text>
                <Button>Activate</Button>
              </BlockStack>
            </Card>

            {/* Tabs */}
            <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

            {/* GENERAL TAB */}
            {selected === 0 && (
              <BlockStack gap="400">
               <div>
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
                </div>

                {/* Presets */}
                <BlockStack gap="200">
                  <Text variant="headingSm">Presets</Text>

                  {[1, 2, 3,4,5,6,7,8,9,10].map((i) => (
                    <Card key={i}>
                      <BlockStack gap="100">
                        <InlineStack align="space-between">
                          <Text>Time is ticking</Text>
                          <Badge tone="success">SAVE {30 + i}%</Badge>
                        </InlineStack>

                        <Text variant="headingMd">
                          0{i} : 05 : 1{i} : {20 + i}
                        </Text>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              </BlockStack>
            )}

            {/* OTHER TAB */}
            {selected !== 0 && (
              <Text tone="subdued">
                {tabs[selected].content} settings coming soon...
              </Text>
            )}
          </BlockStack>
        </Card>

        {/* RIGHT PREVIEW */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Preview</Text>

            {/* Banner Preview */}
            <div
              style={{
                background: "#000",
                color: "#fff",
                padding: "16px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <InlineStack gap="200">
                <Text fontWeight="bold">TIME IS TICKING</Text>
                <Text variant="bodySm">Sale ends in:</Text>
              </InlineStack>

              <InlineStack gap="400">
                <Text>
                  <b>{days}</b> d
                </Text>
                <Text>
                  <b>{hours}</b> h
                </Text>
                <Text>
                  <b>{minutes}</b> m
                </Text>
                <Text>
                  <b>{seconds}</b> s
                </Text>
              </InlineStack>

              <Badge tone="success">SAVE 35%</Badge>
            </div>

            <InlineStack align="center" gap="200">
              <Button>💻</Button>
              <Button>📱</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
}