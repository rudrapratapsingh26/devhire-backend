import { Router } from "express";
import {
  registerCompany,
  getCompanyProfile,
  updateCompanyProfile,
  deleteCompany,
} from "../controllers/company.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";
import { upload } from "../utils/cloudinary.js";

const router = Router();

router.use(verifyJWT);
router.use(checkRole("COMPANY"));

router.post("/register", upload.single("logo"), registerCompany);
router.get("/profile", getCompanyProfile);
router.put("/update", upload.single("logo"), updateCompanyProfile);
router.delete("/delete", deleteCompany);

export default router;
