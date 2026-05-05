const STAGED_UPLOADS_CREATE_MUTATION = `#graphql
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        resourceUrl
        url
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE_MUTATION = `#graphql
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        ... on MediaImage {
          id
          alt
          fileStatus
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function sanitizeFilenamePart(value) {
  return value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function getFileExtension(filename, mimeType) {
  const match = filename.match(/(\.[a-zA-Z0-9]+)$/);
  if (match) return match[1].toLowerCase();

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}

async function parseGraphqlResponse(response) {
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  return payload.data;
}

export async function uploadImageToShopifyFiles({ admin, file, filenamePrefix = "banner" }) {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("No image file provided");
  }

  const safePrefix = sanitizeFilenamePart(filenamePrefix) || "banner";
  const extension = getFileExtension(file.name, file.type);
  const filename = `${safePrefix}-${Date.now()}${extension}`;

  const stagedUploadsResponse = await admin.graphql(STAGED_UPLOADS_CREATE_MUTATION, {
    variables: {
      input: [
        {
          filename,
          mimeType: file.type || "image/jpeg",
          httpMethod: "POST",
          resource: "IMAGE",
          fileSize: String(file.size),
        },
      ],
    },
  });

  const stagedUploadsData = await parseGraphqlResponse(stagedUploadsResponse);
  const stagedUploadsResult = stagedUploadsData?.stagedUploadsCreate;

  if (stagedUploadsResult?.userErrors?.length) {
    throw new Error(stagedUploadsResult.userErrors.map((error) => error.message).join(", "));
  }

  const target = stagedUploadsResult?.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) {
    throw new Error("Shopify did not return an upload target");
  }

  const uploadFormData = new FormData();
  for (const parameter of target.parameters || []) {
    uploadFormData.append(parameter.name, parameter.value);
  }
  uploadFormData.append("file", file, filename);

  const uploadResponse = await fetch(target.url, {
    method: "POST",
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Shopify staged upload failed with status ${uploadResponse.status}`);
  }

  const fileCreateResponse = await admin.graphql(FILE_CREATE_MUTATION, {
    variables: {
      files: [
        {
          alt: filenamePrefix,
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    },
  });

  const fileCreateData = await parseGraphqlResponse(fileCreateResponse);
  const fileCreateResult = fileCreateData?.fileCreate;

  if (fileCreateResult?.userErrors?.length) {
    throw new Error(fileCreateResult.userErrors.map((error) => error.message).join(", "));
  }

  const createdFile = fileCreateResult?.files?.[0];
  const imageUrl = createdFile?.image?.url;

  if (!imageUrl) {
    throw new Error("Shopify file was created but no image URL was returned");
  }

  return imageUrl;
}
