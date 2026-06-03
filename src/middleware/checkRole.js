import { ApiError } from "../utils/api-errors.js";

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, "You are not allowed to perform this action");
  }
  next();
};

export { checkRole };
