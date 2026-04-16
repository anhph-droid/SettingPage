
import { Page, Card, BlockStack, Text } from "@shopify/polaris";


export default function fap(){
  return (
    <Page
      title="FAQ & Feedback"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
    >
      <BlockStack gap="400">
        {/* FAQ SECTION */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Frequently Asked Questions</Text>
            <Text><strong>Q: What is this app?</strong></Text>
            <Text>This app helps you create banners easily.</Text>
            <Text><strong>Q: How to use?</strong></Text>
            <Text>Create a banner and enable it.</Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );}
