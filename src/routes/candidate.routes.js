import { Router } from "express";
import {
  createProfile,
  getProfile,
  updateProfile,
  scoreResumeHandler,
  generateCoverLetterHandler,
} from "../controllers/candidate.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";
import { uploadResume } from "../utils/cloudinary.js";
import multer from "multer";

const memoryUpload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(verifyJWT);
router.use(checkRole("CANDIDATE"));

router.post("/profile", uploadResume.single("resume"), createProfile);
router.get("/profile", getProfile);
router.put("/profile", uploadResume.single("resume"), updateProfile);
router.post("/score-resume", memoryUpload.single("resume"), scoreResumeHandler);
router.post("/generate-cover-letter", generateCoverLetterHandler);

export default router;
