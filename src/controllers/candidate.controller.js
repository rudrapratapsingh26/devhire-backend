import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  scoreResume as scoreResumeAI,
  generateCoverLetter as generateCoverLetterAI,
} from "../utils/gemini.js";
import { extractText } from "unpdf";

// POST /candidate/profile
export const createProfile = asyncHandler(async (req, res) => {
  const { skills, experience, education, headline, location, bio } =
    req.body || {};

  const existing = await db.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (existing) {
    throw new ApiError(409, "Profile already exists");
  }

  let resumeUrl = null;
  let resumeFileName = null;
  if (req.file) {
    resumeUrl = req.file.path;
    resumeFileName = req.file.originalname;
  }

  const profile = await db.candidateProfile.create({
    data: {
      userId: req.user.id,
      headline: headline || null,
      location: location || null,
      bio: bio || null,
      skills: skills || [],
      experience: experience || null,
      education: education || null,
      resumeUrl,
      resumeFileName,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { profile }, "Profile created successfully"));
});

// GET /candidate/profile
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await db.candidateProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      user: {
        select: { fullName: true, email: true },
      },
    },
  });

  if (!profile) {
    return res
      .status(200)
      .json(new ApiResponse(200, { profile: null }, "No profile yet"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { profile }, "Profile fetched successfully"));
});

// PUT /candidate/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { skills, experience, education, headline, location, bio } =
    req.body || {};

  let profile = await db.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });

  let resumeUrl = profile?.resumeUrl || null;
  let resumeFileName = profile?.resumeFileName || null;

  if (req.file) {
    resumeUrl = req.file.path;
    resumeFileName = req.file.originalname;
  }

  if (!profile) {
    profile = await db.candidateProfile.create({
      data: {
        userId: req.user.id,
        headline: headline || null,
        location: location || null,
        bio: bio || null,
        skills: skills || [],
        experience: experience || null,
        education: education || null,
        resumeUrl,
        resumeFileName,
      },
    });
  } else {
    profile = await db.candidateProfile.update({
      where: { userId: req.user.id },
      data: {
        headline: headline ?? profile.headline,
        location: location ?? profile.location,
        bio: bio ?? profile.bio,
        skills: skills ?? profile.skills,
        experience: experience ?? profile.experience,
        education: education ?? profile.education,
        resumeUrl,
        resumeFileName,
      },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { profile }, "Profile updated successfully"));
});

// POST /candidate/score-resume
export const scoreResumeHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Resume file is required");
  }

  const jobDescription = req.body.jobDescription || "";

  const { text } = await extractText(new Uint8Array(req.file.buffer), {
    mergePages: true,
  });
  const resumeText = text;

  if (!resumeText || resumeText.trim().length < 50) {
    throw new ApiError(400, "Could not extract text from resume PDF");
  }

  const result = await scoreResumeAI(resumeText, jobDescription);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        score: result.score,
        feedback: result.summary,
        suggestions: result.weaknesses,
        strengths: result.strengths,
      },
      "Resume scored successfully"
    )
  );
});

// POST /candidate/generate-cover-letter
export const generateCoverLetterHandler = asyncHandler(async (req, res) => {
  const { jobTitle, company, jobDescription } = req.body;

  if (!jobTitle || !company || !jobDescription) {
    throw new ApiError(
      400,
      "Job title, company and job description are required"
    );
  }

  const profile = await db.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });

  const resumeText = profile
    ? `${profile.headline || ""} ${profile.bio || ""} Skills: ${
        profile.skills?.join(", ") || ""
      }`
    : "Experienced developer seeking new opportunities";

  const coverLetter = await generateCoverLetterAI(
    resumeText,
    jobDescription,
    company
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverLetter },
        "Cover letter generated successfully"
      )
    );
});
