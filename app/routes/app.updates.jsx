import { Page, Card, BlockStack, Text, Button } from "@shopify/polaris";
import { useNavigate } from "react-router";


export default function UpdatesPage() {
  const navigate = useNavigate();
  return (
    <Page title="Updates" 
    backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <Card>
        <BlockStack gap="300">
          <Text variant="headingMd">Stay Updated</Text>

          <Text>Follow us on X (Twitter) for latest updates.</Text>

          <Button
            url="https://x.com/youraccount"
            target="_blank"
            variant="primary"
          >
            Go to X
          </Button>
        </BlockStack>
      </Card>
    </Page>
  );
}