import { v2 as cloudinary } from "cloudinary";

// Initialise once — reused across warm Lambda invocations
cloudinary.config({
  cloud_name: process.env.Cloud_name,   // matches Render env key exactly
  api_key:    process.env.API_key,
  api_secret: process.env.API_secret,
  secure:     true,
});

export default cloudinary;
