import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRouter from "./src/routes/auth.routes.js";
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ message: "DevHire API is running" });
});

export default app;
