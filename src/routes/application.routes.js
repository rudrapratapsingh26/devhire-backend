import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/application.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";
import { isApprovedCompany } from "../middleware/isApprovedCompany.js";
import { uploadResume } from "../utils/cloudinary.js";

const router = Router();

router.use(verifyJWT);

// candidate routes
router.post(
  "/:jobId/apply",
  checkRole("CANDIDATE"),
  uploadResume.single("resume"),
  applyToJob
);
router.get("/my", checkRole("CANDIDATE"), getMyApplications);
router.delete("/:id/withdraw", checkRole("CANDIDATE"), withdrawApplication);

// company routes
router.get(
  "/job/:jobId",
  checkRole("COMPANY"),
  isApprovedCompany,
  getJobApplications
);
router.patch(
  "/:id/status",
  checkRole("COMPANY"),
  isApprovedCompany,
  updateApplicationStatus
);

export default router;
