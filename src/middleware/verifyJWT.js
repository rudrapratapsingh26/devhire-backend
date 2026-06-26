import jwt from "jsonwebtoken";
import { db } from "../database/db.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized request");
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await db.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  next();
});

export { verifyJWT };
