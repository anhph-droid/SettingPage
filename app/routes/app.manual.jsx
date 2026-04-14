import { Page, Card, BlockStack, Text } from "@shopify/polaris";
import { useNavigate } from "react-router"; 

export default function ManualPage() {
  const navigate = useNavigate();

  return (
    <Page title="User Manual" 
    backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <Card>
        <BlockStack gap="300">
          <Text variant="headingMd">User Guide</Text>

          <Text>1. Create banner</Text>
          <Text>2. Configure settings</Text>
          <Text>3. Enable banner</Text>
        </BlockStack>
      </Card>
    </Page>
  );
}