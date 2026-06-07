import { Router } from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getCompanyJobs,
} from "../controllers/job.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";
import { isApprovedCompany } from "../middleware/isApprovedCompany.js";

const router = Router();

// company/my-jobs MUST be before /:id
router.get(
  "/company/my-jobs",
  verifyJWT,
  checkRole("COMPANY"),
  isApprovedCompany,
  getCompanyJobs
);

// public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// company only routes
router.post("/", verifyJWT, checkRole("COMPANY"), isApprovedCompany, createJob);
router.put(
  "/:id",
  verifyJWT,
  checkRole("COMPANY"),
  isApprovedCompany,
  updateJob
);
router.delete(
  "/:id",
  verifyJWT,
  checkRole("COMPANY"),
  isApprovedCompany,
  deleteJob
);

export default router;
