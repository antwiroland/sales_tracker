import { z } from "zod";
import { ok, route, requireUser, ApiError } from "@/lib/api";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";

const schema = z.object({
  dataUri: z.string().min(1),
  folder: z.enum(["profiles", "invoices", "companies", "branches"]).default("invoices"),
});

export const POST = route(async (req: Request) => {
  await requireUser();
  if (!isCloudinaryConfigured)
    throw new ApiError(503, "Image upload is not configured (set Cloudinary env vars)");

  const { dataUri, folder } = schema.parse(await req.json());
  const uploaded = await uploadImage(dataUri, folder);
  if (!uploaded) throw new ApiError(500, "Upload failed");
  return ok(uploaded);
});
