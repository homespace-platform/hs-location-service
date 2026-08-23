import { Router } from "express";
import { locationService } from "../service/location.service.js";

export const locationRouter = Router();

locationRouter.get("/provinces", (_req, res) => {
  res.json(locationService.getProvinces());
});

locationRouter.get("/provinces/:code", (req, res) => {
  const province = locationService.getProvince(req.params.code);

  if (!province) {
    return res.status(404).json({ message: "Province not found" });
  }

  return res.json(province);
});

locationRouter.get("/provinces/:code/wards", (req, res) => {
  const province = locationService.getProvince(req.params.code);

  if (!province) {
    return res.status(404).json({ message: "Province not found" });
  }

  return res.json(locationService.getWardsByProvince(req.params.code));
});

locationRouter.get("/wards/:code", (req, res) => {
  const ward = locationService.getWard(req.params.code);

  if (!ward) {
    return res.status(404).json({ message: "Ward not found" });
  }

  return res.json(ward);
});
