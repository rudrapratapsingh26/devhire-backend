import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import cloudinary from "../utils/cloudinary.js";

// POST /company/register
export const registerCompany = asyncHandler(async (req, res) => {
  const { companyName, description, website } = req.body;

  if (req.user.role !== "COMPANY") {
    throw new ApiError(
      403,
      "Only company accounts can register a company profile"
    );
  }

  if (!companyName || !description) {
    throw new ApiError(400, "Company name and description are required");
  }

  const existing = await db.company.findUnique({
    where: { userId: req.user.id },
  });

  if (existing) {
    throw new ApiError(409, "Company profile already exists");
  }

  let logoUrl = null;

  if (req.file) {
    logoUrl = req.file.path; // Cloudinary URL
  }

  const company = await db.company.create({
    data: {
      userId: req.user.id,
      companyName,
      description,
      website: website || null,
      logoUrl,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        company,
        "Company registered. Awaiting admin approval."
      )
    );
});

// GET /company/profile
export const getCompanyProfile = asyncHandler(async (req, res) => {
  const company = await db.company.findUnique({
    where: { userId: req.user.id },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, company, "Company profile fetched"));
});

// PUT /company/update
export const updateCompanyProfile = asyncHandler(async (req, res) => {
  const { companyName, description, website } = req.body;

  const company = await db.company.findUnique({
    where: { userId: req.user.id },
  });

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  let logoUrl = company.logoUrl;

  if (req.file) {
    // Delete old logo from Cloudinary if exists
    if (company.logoUrl) {
      const publicId = company.logoUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`devhire/company-logos/${publicId}`);
    }
    logoUrl = req.file.path;
  }

  const updated = await db.company.update({
    where: { userId: req.user.id },
    data: {
      companyName: companyName || company.companyName,
      description: description || company.description,
      website: website !== undefined ? website : company.website,
      logoUrl,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Company profile updated"));
});

// DELETE /company/delete
export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await db.company.findUnique({
    where: { userId: req.user.id },
  });

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  if (company.logoUrl) {
    const publicId = company.logoUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`devhire/company-logos/${publicId}`);
  }

  await db.company.delete({
    where: { userId: req.user.id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Company profile deleted"));
});
