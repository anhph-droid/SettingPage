import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const { session } = await authenticate.public.appProxy(request);
  const shop = session?.shop || url.searchParams.get("shop");
  const bannerId = Number(url.searchParams.get("bannerId"));
  const now = new Date();

  if (!shop) {
    return new Response(JSON.stringify({ banners: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",    
        "Cache-Control": "no-store",
      },
    });
  }

  const banners = await prisma.app_banner.findMany({
    where: {
      shop,
      ...(Number.isInteger(bannerId) && bannerId > 0 ? { id: bannerId } : {}),
      status: true,
      OR: [
        { timeEnd: null },
        { timeEnd: { gt: now } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      content: true,
      link: true,
      size: true,
      backgroundColor: true,
      color: true,
      position: true,
      timeEnd: true,
      targetPage: true,
      targetProductId: true,
      dismissible: true,
      borderColor: true,
      borderWidth: true,
      borderStyle: true,
      borderRadius: true,
    },
  });

  return new Response(JSON.stringify({ banners }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
