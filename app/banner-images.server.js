const BANNER_IMAGE_NAMESPACE = "settings_banner";
const BANNER_IMAGE_KEY = "banner_images";

const GET_BANNER_IMAGES_QUERY = `#graphql
  query GetBannerImages {
    currentAppInstallation {
      id
      metafield(namespace: "settings_banner", key: "banner_images") {
        value
      }
    }
  }
`;

const SET_BANNER_IMAGES_MUTATION = `#graphql
  mutation SetBannerImages($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function parseGraphqlResponse(response) {
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  return payload.data;
}

function normalizeBannerImageMap(value) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce((accumulator, [key, imageUrl]) => {
      if (typeof imageUrl !== "string") return accumulator;

      const trimmedKey = String(key).trim();
      const trimmedUrl = imageUrl.trim();
      if (!trimmedKey) return accumulator;

      accumulator[trimmedKey] = trimmedUrl;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

async function getBannerImageOwnerState(admin) {
  const response = await admin.graphql(GET_BANNER_IMAGES_QUERY);
  const data = await parseGraphqlResponse(response);
  const currentAppInstallation = data?.currentAppInstallation;

  if (!currentAppInstallation?.id) {
    throw new Error("Could not resolve current app installation");
  }

  return {
    ownerId: currentAppInstallation.id,
    imageMap: normalizeBannerImageMap(currentAppInstallation.metafield?.value),
  };
}

export async function getBannerImageMap(admin) {
  const { imageMap } = await getBannerImageOwnerState(admin);
  return imageMap;
}

export async function setBannerImageForBanner(admin, bannerId, imageUrl) {
  const normalizedBannerId = String(bannerId || "").trim();
  if (!normalizedBannerId) {
    throw new Error("Banner ID is required to persist the image");
  }

  const { ownerId, imageMap } = await getBannerImageOwnerState(admin);
  const nextImageMap = { ...imageMap };

  if (imageUrl) {
    nextImageMap[normalizedBannerId] = imageUrl;
  } else {
    delete nextImageMap[normalizedBannerId];
  }

  const response = await admin.graphql(SET_BANNER_IMAGES_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId,
          namespace: BANNER_IMAGE_NAMESPACE,
          key: BANNER_IMAGE_KEY,
          type: "json",
          value: JSON.stringify(nextImageMap),
        },
      ],
    },
  });

  const data = await parseGraphqlResponse(response);
  const result = data?.metafieldsSet;

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => error.message).join(", "));
  }

  return nextImageMap[normalizedBannerId] || null;
}
