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

// GET /admin/companies — all companies
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
