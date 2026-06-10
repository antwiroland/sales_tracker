import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface UploadedImage {
  publicId: string;
  url: string;
}

/**
 * Upload a base64 data URI (or remote URL) to Cloudinary under sales-kpi/<folder>.
 * Returns null when Cloudinary is not configured so callers can degrade gracefully.
 */
export async function uploadImage(
  dataUri: string,
  folder: "profiles" | "invoices" | "companies" | "branches",
): Promise<UploadedImage | null> {
  if (!isCloudinaryConfigured) return null;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: `sales-kpi/${folder}`,
    resource_type: "image",
  });
  return { publicId: res.public_id, url: res.secure_url };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[cloudinary] delete failed:", err);
  }
}

export { cloudinary };
