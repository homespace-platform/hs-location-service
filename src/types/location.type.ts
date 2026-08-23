export type ProvinceType = "city" | "province" | "unknown";
export type WardType = "ward" | "commune" | "special_zone" | "unknown";

export interface Province {
  code: string;
  name: string;
  full_name: string;
  type: ProvinceType;
  type_name: string;
  postal_code_prefixes: string[];
}

export interface Ward {
  code: string;
  name: string;
  full_name: string;
  type: WardType;
  type_name: string;
  province_code: string;
  postal_code: string | null;
}
