import prisma from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadResume } from "../utils/cloudinary.js";

// POST /candidate/profile
export const createProfile = asyncHandler(async (req, res) => {
  const { skills, experience, education } = req.body || {};

  const existing = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (existing) {
    throw new ApiError(409, "Profile already exists");
  }

  let resumeUrl = null;
  if (req.file) {
    resumeUrl = req.file.path;
  }

  const profile = await prisma.candidateProfile.create({
    data: {
      userId: req.user.id,
      skills: skills || null,
      experience: experience || null,
      education: education || null,
      resumeUrl,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, profile, "Profile created successfully"));
});

// GET /candidate/profile
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

// PUT /candidate/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { skills, experience, education } = req.body || {};

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  let resumeUrl = profile.resumeUrl;
  if (req.file) {
    resumeUrl = req.file.path;
  }

  const updated = await prisma.candidateProfile.update({
    where: { userId: req.user.id },
    data: {
      skills: skills || profile.skills,
      experience: experience || profile.experience,
      education: education || profile.education,
      resumeUrl,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Profile updated successfully"));
});
