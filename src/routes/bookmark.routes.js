import { Router } from "express";
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
} from "../controllers/bookmark.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

router.use(verifyJWT);
router.use(checkRole("CANDIDATE"));

router.post("/:jobId", addBookmark);
router.delete("/:jobId", removeBookmark);
router.get("/", getBookmarks);

export default router;
