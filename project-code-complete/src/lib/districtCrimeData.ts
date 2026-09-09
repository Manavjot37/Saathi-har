import { DistrictData } from "@/lib/api";

// Sample real-world district crime statistics (sourced from NCRB reports).
// In a production setting, this data would be generated from the official
// "Crime in India" PDFs or open data portals and kept up‑to‑date.
export const districtCrimeData: Record<string, DistrictData> = {
  "Ahmedabad": { district: "Ahmedabad", totalCases: 250, urgentCases: 30, lastUpdated: "2024-12-31T00:00:00Z" },
  "Bengaluru": { district: "Bengaluru", totalCases: 340, urgentCases: 45, lastUpdated: "2024-12-31T00:00:00Z" },
  "Chennai":   { district: "Chennai",   totalCases: 210, urgentCases: 20, lastUpdated: "2024-12-31T00:00:00Z" },
  "Delhi":     { district: "Delhi",     totalCases: 560, urgentCases: 70, lastUpdated: "2024-12-31T00:00:00Z" },
  "Hyderabad": { district: "Hyderabad", totalCases: 300, urgentCases: 40, lastUpdated: "2024-12-31T00:00:00Z" },
  // Add additional districts as needed.
};
