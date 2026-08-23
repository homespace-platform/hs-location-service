import express from "express";
import { locationRouter } from "./controller/location.controller.js";

const app = express();
const PORT = Number(process.env.PORT ?? 9999);

app.disable("x-powered-by");

// Enable CORS for frontend applications (hs-web-app, hs-admin-portal, etc.)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "UP" });
});

app.use("/api/v1", locationRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Location service listening on port ${PORT}`);
});
