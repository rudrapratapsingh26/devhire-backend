import prisma from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { scoreResume, generateCoverLetter } from "../utils/gemini.js";
import cloudinary from "../utils/cloudinary.js";
import fetch from "node-fetch";

// POST /applications/:jobId/apply
export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { generateCover } = req.body || {};

  if (!req.file) {
    throw new ApiError(400, "Resume PDF is required");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: { companyName: true },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "ACTIVE") {
    throw new ApiError(400, "This job is no longer accepting applications");
  }

  const existing = await prisma.application.findUnique({
    where: {
      jobId_candidateId: {
        jobId,
        candidateId: req.user.id,
      },
    },
  });

  if (existing) {
    throw new ApiError(409, "You have already applied to this job");
  }

  const resumeUrl = req.file.path;

  // fetch PDF text for AI scoring
  let aiScore = null;
  let coverLetter = null;

  try {
    const pdfResponse = await fetch(resumeUrl);
    const pdfBuffer = await pdfResponse.buffer();
    const resumeText = pdfBuffer.toString("utf-8").slice(0, 3000);

    const jobDescription = `${job.title}\n${job.description}\n${job.requirements}`;

    const scoreResult = await scoreResume(resumeText, jobDescription);
    aiScore = scoreResult.score;

    if (generateCover === "true") {
      coverLetter = await generateCoverLetter(
        resumeText,
        jobDescription,
        job.company.companyName
      );
    }
  } catch (err) {
    console.error("AI scoring failed:", err.message);
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      candidateId: req.user.id,
      resumeUrl,
      coverLetter,
      aiScore,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, application, "Application submitted successfully")
    );
});

// GET /applications/my — candidate sees their applications
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { candidateId: req.user.id },
    include: {
      job: {
        select: {
          title: true,
          location: true,
          type: true,
          salary: true,
          deadline: true,
          company: {
            select: { companyName: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, applications, "Applications fetched successfully")
    );
});

// GET /applications/job/:jobId — company sees applicants for a job
export const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.companyId !== req.company.id) {
    throw new ApiError(
      403,
      "You are not authorized to view these applications"
    );
  }

  const applications = await prisma.application.findMany({
    where: { jobId },
    include: {
      candidate: {
        select: {
          name: true,
          email: true,
          candidateProfile: {
            select: { skills: true, experience: true, education: true },
          },
        },
      },
    },
    orderBy: { aiScore: "desc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        applications,
        "Job applications fetched successfully"
      )
    );
});

// PATCH /applications/:id/status — company updates application status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["APPLIED", "REVIEWING", "ACCEPTED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.job.companyId !== req.company.id) {
    throw new ApiError(
      403,
      "You are not authorized to update this application"
    );
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Application status updated"));
});

// DELETE /applications/:id — candidate withdraws application
export const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.candidateId !== req.user.id) {
    throw new ApiError(
      403,
      "You are not authorized to withdraw this application"
    );
  }

  if (application.resumeUrl) {
    const publicId = application.resumeUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`devhire/resumes/${publicId}`, {
      resource_type: "raw",
    });
  }

  await prisma.application.delete({ where: { id } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Application withdrawn successfully"));
});
