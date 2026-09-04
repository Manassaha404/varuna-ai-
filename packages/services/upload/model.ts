import { z } from "zod";

// ─── Request DTOs ────────────────────────────────────────────────────────────

/** Client sends this to the server to get a Cloudinary signature */
export const getUploadSignatureDto = z.object({
  /** Destination folder inside your Cloudinary account (e.g. "quiz_media") */
  folder: z.string().min(1).default("quiz_media"),
  /** Desired resource type: image | video | raw | auto */
  resourceType: z.enum(["image", "video", "raw", "auto"]).default("image"),
  /** Optional: public_id override. Cloudinary will auto-generate one if omitted. */
  publicId: z.string().optional(),
});

export type GetUploadSignatureInput = z.infer<typeof getUploadSignatureDto>;

// ─── Response types ───────────────────────────────────────────────────────────

/** Returned by the server; the client uses these to upload directly to Cloudinary */
export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  /** Always "public" — ensures raw assets are accessible without auth */
  accessMode: string;
  /** The Cloudinary direct-upload endpoint to POST to */
  uploadUrl: string;
}

/** Shape returned by Cloudinary after a successful client-side upload */
export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
  bytes: number;
  thumbnailUrl?: string;
}
