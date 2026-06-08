import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "devhire/company-logos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "devhire/resumes",
    allowed_formats: ["pdf"],
    resource_type: "raw",
  }),
});

export const uploadLogo = multer({ storage: logoStorage });
export const uploadResume = multer({ storage: resumeStorage });
export const upload = uploadLogo;
export default cloudinary;
