import { Router } from "express";
import {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  getAllCompanies,
  getDashboardStats,
  getAllCandidates,
  getAllJobsAdmin,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

router.use(verifyJWT);
router.use(checkRole("ADMIN"));

router.get("/stats", getDashboardStats);
router.get("/companies", getAllCompanies);
router.get("/companies/pending", getPendingCompanies);
router.patch("/companies/:id/approve", approveCompany);
router.patch("/companies/:id/reject", rejectCompany);
router.get("/candidates", getAllCandidates);
router.get("/jobs", getAllJobsAdmin);

export default router;
