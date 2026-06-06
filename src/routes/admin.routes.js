import { Router } from "express";
import {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  getAllCompanies,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

router.use(verifyJWT);
router.use(checkRole("ADMIN"));

router.get("/companies", getAllCompanies);
router.get("/companies/pending", getPendingCompanies);
router.patch("/companies/:id/approve", approveCompany);
router.patch("/companies/:id/reject", rejectCompany);

export default router;