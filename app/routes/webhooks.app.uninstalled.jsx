import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  console.log("Webhook:", topic);
  console.log("Shop uninstall:", shop);
  
  await prisma.app_settings.deleteMany({
    where: { shop },
  })
  console.log("Deleted settings for", shop);

  return new Response();
};
