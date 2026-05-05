import prisma from "./db.server.js";

export async function syncExpiredBannersForShop(shop, now = new Date()) {
  if (!shop) return;

  await prisma.app_banner.updateMany({
    where: {
      shop,
      status: true,
      timeEnd: { not: null, lte: now },
    },
    data: { status: false },
  });
}
