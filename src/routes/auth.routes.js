import { Router } from "express";
import passport from "../utils/passport.js";
import {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleAuthFailure,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
  }),
  googleAuth
);
router.get("/google/failure", googleAuthFailure);

export default router;
