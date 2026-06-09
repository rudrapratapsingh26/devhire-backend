import { Router } from "express";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "../controllers/candidate.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";
import { uploadResume } from "../utils/cloudinary.js";

const router = Router();

router.use(verifyJWT);
router.use(checkRole("CANDIDATE"));

router.post("/profile", uploadResume.single("resume"), createProfile);
router.get("/profile", getProfile);
router.put("/profile", uploadResume.single("resume"), updateProfile);

export default router;
