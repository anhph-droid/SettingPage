import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { payload, shop, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);
    const orderId = payload?.id?.toString();
    const customerEmail = payload?.customer?.email || null;

    console.log("===== ORDERS CREATE WEBHOOK =====");
    console.log("Shop:", shop);
    console.log("Order ID:", orderId);
    console.log("Customer Email:", customerEmail);
  
    await prisma.webhook_logs.create({
      data: {
        topic,
        shop,
        orderId,
        customerEmail,
      },
    });

    console.log("Saved to DB");

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return new Response("error", { status: 500 });
  }
};
