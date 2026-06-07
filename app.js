import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./src/routes/auth.routes.js";
import session from "express-session";
import passport from "./src/utils/passport.js";
import companyRoutes from "./src/routes/company.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import jobRoutes from "./src/routes/job.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/jobs", jobRoutes);

app.get("/", (req, res) => {
  res.json({ message: "DevHire API is running" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

export default app;
