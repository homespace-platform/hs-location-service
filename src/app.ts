import express from "express";
import { locationRouter } from "./controller/location.controller.js";

const app = express();
const PORT = Number(process.env.PORT ?? 9999);

app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({ status: "UP" });
});

app.use("/api/v1", locationRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Location service listening on port ${PORT}`);
});
