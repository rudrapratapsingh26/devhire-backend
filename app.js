import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./src/routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);

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
