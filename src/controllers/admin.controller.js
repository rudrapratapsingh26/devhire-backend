import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// GET /admin/companies/pending
export const getPendingCompanies = asyncHandler(async (req, res) => {
  const companies = await db.company.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, companies, "Pending companies fetched"));
});

// PATCH /admin/companies/:id/approve
export const approveCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await db.company.findUnique({ where: { id } });

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  if (company.status === "APPROVED") {
    throw new ApiError(400, "Company is already approved");
  }

  const updated = await db.company.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Company approved"));
});

// PATCH /admin/companies/:id/reject
export const rejectCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await db.company.findUnique({ where: { id } });

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  if (company.status === "REJECTED") {
    throw new ApiError(400, "Company is already rejected");
  }

  const updated = await db.company.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Company rejected"));
});

// GET /admin/companies
export const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await db.company.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
      _count: {
        select: { jobs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, companies, "All companies fetched"));
});

// GET /admin/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCompanies,
    totalJobs,
    totalApplications,
    pendingCompanies,
    activeJobs,
    recentApplications,
  ] = await Promise.all([
    db.user.count(),
    db.company.count(),
    db.job.count(),
    db.application.count(),
    db.company.count({ where: { status: "PENDING" } }),
    db.job.count({ where: { status: "ACTIVE" } }),
    db.application.findMany({
      take: 5,
      orderBy: { appliedAt: "desc" },
      include: {
        candidate: { select: { name: true, email: true } },
        job: { select: { title: true } },
      },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        pendingCompanies,
        activeJobs,
        recentApplications,
      },
      "Dashboard stats fetched"
    )
  );
});

// GET /admin/candidates
export const getAllCandidates = asyncHandler(async (req, res) => {
  const candidates = await db.user.findMany({
    where: { role: "CANDIDATE" },
    select: {
      id: true,
      name: true,
      email: true,
      googleAuth: true,
      createdAt: true,
      candidateProfile: {
        select: {
          skills: true,
          experience: true,
          education: true,
          resumeUrl: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, candidates, "All candidates fetched"));
});

// GET /admin/jobs
export const getAllJobsAdmin = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (type) filters.type = type;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where: filters,
      include: {
        company: {
          select: { companyName: true, logoUrl: true },
        },
        _count: {
          select: { applications: true },
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
      "All jobs fetched"
    )
  );
});
