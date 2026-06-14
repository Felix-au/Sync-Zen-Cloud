import { v2 as cloudinary } from 'cloudinary'

/**
 * Cloudinary upload helper.
 *
 * Replaces Google Drive. Service account Drive quotas are shared-drive only;
 * Cloudinary free tier gives 25 GB storage and direct CDN delivery with no
 * proxy or extra auth needed.
 *
 * Configuration is read from environment variables on first call.
 * The cloudinary package caches config internally so this is safe to call
 * from multiple serverless routes.
 */

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure:     true,
  })
}

export interface UploadResult {
  /** Cloudinary public_id — used to delete / transform later */
  fileId: string
  /** Direct HTTPS CDN URL — ready to use as <img src> */
  url: string
}

/**
 * Uploads a base64 data URI to Cloudinary.
 *
 * @param dataUri  - full data URI, e.g. "data:image/jpeg;base64,/9j/..."
 * @param folder   - Cloudinary folder path, e.g. "synczen/hotelId/checkin"
 * @returns        - { fileId: public_id, url: secure_url }
 */
export async function uploadToCloudinary(
  dataUri: string,
  folder: string
): Promise<UploadResult> {
  configure()

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    // Auto-quality and format — reduces storage and speeds up delivery
    quality: 'auto',
    fetch_format: 'auto',
  })

  return {
    fileId: result.public_id,
    url:    result.secure_url,
  }
}

/**
 * Deletes a previously uploaded image by its Cloudinary public_id.
 * Called when a booking is cancelled or a photo is replaced.
 *
 * @param publicId - the fileId returned from uploadToCloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  configure()
  await cloudinary.uploader.destroy(publicId)
}
