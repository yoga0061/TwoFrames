import imageCompression from "browser-image-compression";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnjg95fe7/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "twoframes_upload";

/**
 * Compresses the image to max 0.3MB/1200px and uploads it to Cloudinary.
 * Returns the secure_url of the uploaded image.
 */
export async function uploadToCloudinary(file: File, signal?: AbortSignal): Promise<string> {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Invalid image file provided.");
  }

  // Compress image to 0.3MB limit before upload
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  };

  let compressedFile: File = file;
  try {
    compressedFile = await imageCompression(file, options);
  } catch (error) {
    console.warn("Compression failed; using original image:", error);
  }

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Cloudinary API returned an error status.");
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error("Cloudinary response did not contain secure_url.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failure:", error);
    throw error instanceof Error ? error : new Error("Network error occurred during upload.");
  }
}

/**
 * Uploads an audio file (voice memory or custom track) to Cloudinary.
 * Returns the secure_url of the uploaded audio.
 */
export async function uploadAudioToCloudinary(file: File): Promise<string> {
  if (!file || !file.type.startsWith("audio/")) {
    throw new Error("Invalid audio file provided.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    // Cloudinary manages audio files under the 'video' resource type
    const audioUploadUrl = CLOUDINARY_UPLOAD_URL.replace("/image/upload", "/video/upload");
    const response = await fetch(audioUploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Cloudinary API returned an error status.");
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error("Cloudinary response did not contain secure_url.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary audio upload failure:", error);
    throw error instanceof Error ? error : new Error("Network error occurred during upload.");
  }
}
