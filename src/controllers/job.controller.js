import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// POST /jobs — create job
export const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    requirements,
    location,
    salaryRange,
    jobType,
    experienceLevel,
    deadline,
  } = req.body;

  if (!title || !description || !requirements || !location || !deadline) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const job = await db.job.create({
    data: {
      companyId: req.company.id,
      title,
      description,
      requirements,
      location,
      salaryRange: salaryRange || null,
      jobType: jobType || "FULL_TIME",
      experienceLevel: experienceLevel || "JUNIOR",
      deadline: new Date(deadline),
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, job, "Job created successfully"));
});

// GET /jobs — public feed with filters + pagination
export const getJobs = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    jobType,
    experienceLevel,
    status,
    page = 1,
    limit = 10,
  } = req.query;

  const filters = {};

  if (title) {
    filters.title = { contains: title, mode: "insensitive" };
  }

  if (location) {
    filters.location = { contains: location, mode: "insensitive" };
  }

  if (jobType) {
    filters.jobType = jobType;
  }

  if (experienceLevel) {
    filters.experienceLevel = experienceLevel;
  }

  filters.status = status || "ACTIVE";

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where: filters,
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            website: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNumber,
    }),
    db.job.count({ where: filters }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        jobs,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
      "Jobs fetched successfully"
    )
  );
});

// GET /jobs/:id — single job
export const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await db.job.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          name: true,
          logoUrl: true,
          website: true,
          description: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job fetched successfully"));
});

// PUT /jobs/:id — update job (owner only)
export const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    requirements,
    location,
    salaryRange,
    jobType,
    experienceLevel,
    deadline,
    status,
  } = req.body;

  const job = await db.job.findUnique({ where: { id } });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.companyId !== req.company.id) {
    throw new ApiError(403, "You are not authorized to update this job");
  }

  const updated = await db.job.update({
    where: { id },
    data: {
      title: title || job.title,
      description: description || job.description,
      requirements: requirements || job.requirements,
      location: location || job.location,
      salaryRange: salaryRange !== undefined ? salaryRange : job.salaryRange,
      jobType: jobType || job.jobType,
      experienceLevel: experienceLevel || job.experienceLevel,
      deadline: deadline ? new Date(deadline) : job.deadline,
      status: status || job.status,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Job updated successfully"));
});

// DELETE /jobs/:id — delete job (owner only)
export const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await db.job.findUnique({ where: { id } });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.companyId !== req.company.id) {
    throw new ApiError(403, "You are not authorized to delete this job");
  }

  await db.job.delete({ where: { id } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Job deleted successfully"));
});

// GET /company/jobs — company sees their own jobs
export const getCompanyJobs = asyncHandler(async (req, res) => {
  const jobs = await db.job.findMany({
    where: { companyId: req.company.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Company jobs fetched successfully"));
});
