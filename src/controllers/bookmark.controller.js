import prisma from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// POST /bookmarks/:jobId
export const addBookmark = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const existing = await prisma.bookmarkedJob.findUnique({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId,
      },
    },
  });

  if (existing) {
    throw new ApiError(409, "Job already bookmarked");
  }

  const bookmark = await prisma.bookmarkedJob.create({
    data: {
      userId: req.user.id,
      jobId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, bookmark, "Job bookmarked successfully"));
});

// DELETE /bookmarks/:jobId
export const removeBookmark = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const bookmark = await prisma.bookmarkedJob.findUnique({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId,
      },
    },
  });

  if (!bookmark) {
    throw new ApiError(404, "Bookmark not found");
  }

  await prisma.bookmarkedJob.delete({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId,
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Bookmark removed successfully"));
});

// GET /bookmarks
export const getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await prisma.bookmarkedJob.findMany({
    where: { userId: req.user.id },
    include: {
      job: {
        include: {
          company: {
            select: { companyName: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, bookmarks, "Bookmarks fetched successfully"));
});
