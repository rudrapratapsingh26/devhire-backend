import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";

export const isApprovedCompany = asyncHandler(async (req, res, next) => {
  const company = await db.company.findUnique({
    where: { userId: req.user.id },
  });

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  if (company.status !== "APPROVED") {
    throw new ApiError(403, "Your company is not approved yet");
  }

  req.company = company;
  next();
});
