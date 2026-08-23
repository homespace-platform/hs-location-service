import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");

// Current maintained dataset, generated from Vietnam administrative-unit data.
// Runtime of your API does NOT depend on this URL; this script is only for manual/CI sync.
const SOURCE_URL =
  "https://raw.githubusercontent.com/ThangLeQuoc/vietnamese-provinces-database/master/json/vn_only_simplified_json_generated_data_vn_units.json";

function parseProvince(fullName) {
  if (fullName.startsWith("Thành phố ")) {
    return {
      name: fullName.slice("Thành phố ".length),
      type: "city",
      type_name: "Thành phố",
    };
  }

  if (fullName.startsWith("Tỉnh ")) {
    return {
      name: fullName.slice("Tỉnh ".length),
      type: "province",
      type_name: "Tỉnh",
    };
  }

  return {
    name: fullName,
    type: "unknown",
    type_name: "",
  };
}

function parseWard(fullName) {
  const mappings = [
    ["Phường ", "ward", "Phường"],
    ["Xã ", "commune", "Xã"],
    ["Đặc khu ", "special_zone", "Đặc khu"],
  ];

  for (const [prefix, type, typeName] of mappings) {
    if (fullName.startsWith(prefix)) {
      return {
        name: fullName.slice(prefix.length),
        type,
        type_name: typeName,
      };
    }
  }

  return {
    name: fullName,
    type: "unknown",
    type_name: "",
  };
}

function parsePostalPrefixes(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  console.log(`Fetching administrative data from:\n${SOURCE_URL}\n`);

  const response = await fetch(SOURCE_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "location-service-data-sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source dataset: ${response.status} ${response.statusText}`,
    );
  }

  const source = await response.json();

  if (!Array.isArray(source)) {
    throw new Error("Unexpected source format: root must be an array");
  }

  const provinces = [];
  const wards = [];

  for (const item of source) {
    const provinceInfo = parseProvince(item.FullName);

    provinces.push({
      code: String(item.Code),
      name: provinceInfo.name,
      full_name: item.FullName,
      type: provinceInfo.type,
      type_name: provinceInfo.type_name,
      postal_code_prefixes: parsePostalPrefixes(item.PostalCodePrefix),
    });

    if (!Array.isArray(item.Wards)) {
      throw new Error(`Province ${item.Code} does not contain Wards[]`);
    }

    for (const ward of item.Wards) {
      const wardInfo = parseWard(ward.FullName);

      wards.push({
        code: String(ward.Code),
        name: wardInfo.name,
        full_name: ward.FullName,
        type: wardInfo.type,
        type_name: wardInfo.type_name,
        province_code: String(ward.ProvinceCode),
        postal_code: ward.PostalCode ? String(ward.PostalCode) : null,
      });
    }
  }

  // Defensive validation against accidental old/broken data.
  if (provinces.length !== 34) {
    throw new Error(
      `Validation failed: expected 34 provinces/cities, got ${provinces.length}`,
    );
  }

  if (wards.length !== 3321) {
    throw new Error(
      `Validation failed: expected 3321 commune-level units, got ${wards.length}`,
    );
  }

  const provinceCodes = new Set(provinces.map((p) => p.code));
  const uniqueProvinceCodes = provinceCodes.size;
  const uniqueWardCodes = new Set(wards.map((w) => w.code)).size;

  if (uniqueProvinceCodes !== provinces.length) {
    throw new Error("Validation failed: duplicate province code detected");
  }

  if (uniqueWardCodes !== wards.length) {
    throw new Error("Validation failed: duplicate ward code detected");
  }

  for (const ward of wards) {
    if (!provinceCodes.has(ward.province_code)) {
      throw new Error(
        `Validation failed: ward ${ward.code} references unknown province ${ward.province_code}`,
      );
    }
  }

  // Important 2026 check:
  // 30/2026/QH16 changed Đồng Nai from a province to a centrally governed city.
  const dongNai = provinces.find((p) => p.code === "75");
  if (!dongNai || dongNai.full_name !== "Thành phố Đồng Nai") {
    throw new Error(
      'Validation failed: dataset does not contain code 75 as "Thành phố Đồng Nai". ' +
      "The source may be older than the 2026 administrative update.",
    );
  }

  provinces.sort((a, b) => a.code.localeCompare(b.code, "vi"));
  wards.sort((a, b) => {
    const provinceCompare = a.province_code.localeCompare(b.province_code, "vi");
    return provinceCompare || a.code.localeCompare(b.code, "vi");
  });

  await mkdir(DATA_DIR, { recursive: true });

  await Promise.all([
    writeFile(
      path.join(DATA_DIR, "provinces.json"),
      JSON.stringify(provinces, null, 2) + "\n",
      "utf8",
    ),
    writeFile(
      path.join(DATA_DIR, "wards.json"),
      JSON.stringify(wards, null, 2) + "\n",
      "utf8",
    ),
  ]);

  console.log("Done.");
  console.log(`- Provinces/cities: ${provinces.length}`);
  console.log(`- Wards/communes/special zones: ${wards.length}`);
  console.log(`- Output: ${path.join(DATA_DIR, "provinces.json")}`);
  console.log(`- Output: ${path.join(DATA_DIR, "wards.json")}`);
  console.log(`- 2026 check: ${dongNai.full_name} (${dongNai.code})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
