export type Jurisdiction = { code: string; name: string; flag: string };

// Regional indicator emoji from ISO 3166-1 alpha-2 code
function flag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6))
    .join("");
}

const RAW: [string, string][] = [
  // Americas
  ["US", "United States"],
  ["CA", "Canada"],
  ["BR", "Brazil"],
  ["MX", "Mexico"],
  ["CO", "Colombia"],
  ["AR", "Argentina"],
  ["PE", "Peru"],
  ["CL", "Chile"],
  ["EC", "Ecuador"],
  ["VE", "Venezuela"],
  ["PA", "Panama"],
  ["CR", "Costa Rica"],
  ["DO", "Dominican Republic"],
  // Supranational
  ["EU", "European Union"],
  // Europe
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["PL", "Poland"],
  ["SE", "Sweden"],
  ["NO", "Norway"],
  ["DK", "Denmark"],
  ["FI", "Finland"],
  ["CH", "Switzerland"],
  ["AT", "Austria"],
  ["PT", "Portugal"],
  ["RO", "Romania"],
  ["CZ", "Czech Republic"],
  ["HU", "Hungary"],
  ["IE", "Ireland"],
  ["GR", "Greece"],
  ["UA", "Ukraine"],
  ["RU", "Russia"],
  ["LU", "Luxembourg"],
  // Middle East & Africa
  ["AE", "United Arab Emirates"],
  ["SA", "Saudi Arabia"],
  ["QA", "Qatar"],
  ["KW", "Kuwait"],
  ["BH", "Bahrain"],
  ["OM", "Oman"],
  ["JO", "Jordan"],
  ["LB", "Lebanon"],
  ["IL", "Israel"],
  ["TR", "Turkey"],
  ["ZA", "South Africa"],
  ["NG", "Nigeria"],
  ["EG", "Egypt"],
  ["KE", "Kenya"],
  ["GH", "Ghana"],
  ["MA", "Morocco"],
  ["TN", "Tunisia"],
  ["ET", "Ethiopia"],
  ["TZ", "Tanzania"],
  // Asia Pacific
  ["CN", "China"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["SG", "Singapore"],
  ["IN", "India"],
  ["HK", "Hong Kong"],
  ["TH", "Thailand"],
  ["VN", "Vietnam"],
  ["MY", "Malaysia"],
  ["ID", "Indonesia"],
  ["PH", "Philippines"],
  ["TW", "Taiwan"],
  ["PK", "Pakistan"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
];

export const JURISDICTIONS: Jurisdiction[] = RAW.map(([code, name]) => ({
  code,
  name,
  flag: flag(code),
}));

export function getJurisdictionName(code: string): string {
  const normalized = code.trim().toUpperCase();
  return JURISDICTIONS.find((j) => j.code === normalized)?.name ?? normalized;
}
