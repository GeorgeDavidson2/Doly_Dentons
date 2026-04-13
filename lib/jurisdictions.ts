const JURISDICTION_NAMES: Record<string, string> = {
  AE: "United Arab Emirates",
  AR: "Argentina",
  AT: "Austria",
  AU: "Australia",
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  CO: "Colombia",
  DE: "Germany",
  ES: "Spain",
  EU: "European Union",
  FR: "France",
  GB: "United Kingdom",
  HK: "Hong Kong",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  MY: "Malaysia",
  NL: "Netherlands",
  PE: "Peru",
  SA: "Saudi Arabia",
  SG: "Singapore",
  US: "United States",
  ZA: "South Africa",
};

export function getJurisdictionName(code: string): string {
  return JURISDICTION_NAMES[code.toUpperCase()] ?? code;
}
