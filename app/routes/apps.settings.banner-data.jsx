import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session?.shop) {
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
      shop: session.shop,
      status: true,
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
      backgroundColor: true,
      color: true,
      position: true,
      timeEnd: true,
      targetPage: true,
      dismissible: true,
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
