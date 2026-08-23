import fs from "node:fs";
import path from "node:path";
import { Province, Ward } from "../types/location.type.js";

const DATA_DIR = path.resolve(process.cwd(), "data");

function loadJson<T>(fileName: string): T {
  const filePath = path.join(DATA_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

const provinces = loadJson<Province[]>("provinces.json");
const wards = loadJson<Ward[]>("wards.json");

const provinceByCode = new Map(provinces.map((item) => [item.code, item]));
const wardByCode = new Map(wards.map((item) => [item.code, item]));

const wardsByProvince = new Map<string, Ward[]>();
for (const ward of wards) {
  const list = wardsByProvince.get(ward.province_code) ?? [];
  list.push(ward);
  wardsByProvince.set(ward.province_code, list);
}

export const locationService = {
  getProvinces(): Province[] {
    return provinces;
  },

  getProvince(code: string): Province | undefined {
    return provinceByCode.get(code);
  },

  getWardsByProvince(provinceCode: string): Ward[] {
    return wardsByProvince.get(provinceCode) ?? [];
  },

  getWard(code: string): Ward | undefined {
    return wardByCode.get(code);
  },
};
