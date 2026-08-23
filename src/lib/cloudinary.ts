import { v2 as cloudinary } from "cloudinary";

// Extract credentials from any environment variable key variation
const cloudName =
  process.env.Cloud_name ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.cloud_name ||
  "ugpy6fko";

const apiKey =
  process.env.API_key ||
  process.env.CLOUDINARY_API_KEY ||
  process.env.api_key ||
  "766543529596412";

const apiSecret =
  process.env.API_secret ||
  process.env.CLOUDINARY_API_SECRET ||
  process.env.api_secret;

const cloudinaryUrl =
  process.env.API_environment_variable ||
  process.env.CLOUDINARY_URL;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else if (cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
    secure: true,
  });
}

export default cloudinary;
