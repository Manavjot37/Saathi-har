export type DistrictData = {
  district: string;
  totalCases: number;
  urgentCases: number;
  lastUpdated: string;
};

/**
 * Fetch recent district data from the NCRB API.
 * Placeholder implementation – replace the URL with the actual endpoint.
 */
export async function fetchDistrictData(district: string): Promise<DistrictData[]> {
  const endpoint = `https://api.ncrb.gov.in/v1/districts/${encodeURIComponent(district)}/stats`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for district ${district}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as DistrictData[];
  } catch (err) {
    console.warn('Fetching real API failed, attempting static dataset:', err);
    // Try static real-world data
    try {
      const { districtCrimeData } = await import('@/lib/districtCrimeData');
      const staticData = districtCrimeData[district];
      if (staticData) {
        return [staticData];
      }
    } catch (e) {
      // ignore import errors
    }
    // Fallback mock data
    const mock: DistrictData[] = [
      { district, totalCases: 120, urgentCases: 15, lastUpdated: new Date().toISOString() },
      { district: `${district} Subarea`, totalCases: 45, urgentCases: 5, lastUpdated: new Date().toISOString() },
    ];
    return mock;
  }
}

/**
 * Send an interaction (e.g., chatbot message) to the backend.
 * This is a placeholder implementation; adjust endpoint and payload as needed.
 */
export async function sendInteraction(params: { victimId: string; channel: string; payload: any }): Promise<void> {
  const endpoint = `/api/interactions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to send interaction: ${response.statusText}`);
  }
}
