import { FormulaConfig, ScanProgress, ScanResultsResponse, UniverseInfo } from "../types.js";

const API_BASE = "/api";

export async function fetchUniverses(): Promise<UniverseInfo[]> {
  const res = await fetch(`${API_BASE}/universes`);
  if (!res.ok) throw new Error("Failed to fetch universes");
  return res.json();
}

export async function fetchFormulas(): Promise<FormulaConfig[]> {
  const res = await fetch(`${API_BASE}/formulas`);
  if (!res.ok) throw new Error("Failed to fetch formulas");
  return res.json();
}

export async function saveCustomFormula(config: FormulaConfig): Promise<FormulaConfig> {
  const res = await fetch(`${API_BASE}/formulas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save formula");
  }
  return res.json();
}

export async function deleteCustomFormula(presetId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/formulas/${presetId}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete preset");
  }
}

export async function testFormulaCalculation(symbol: string, formulaConfig: FormulaConfig): Promise<any> {
  const res = await fetch(`${API_BASE}/formulas/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, formulaConfig })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to test formula");
  }
  return res.json();
}

export async function startStockScan(universeId: string, formulaConfig: FormulaConfig): Promise<{ scanId: string }> {
  const res = await fetch(`${API_BASE}/scan/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ universeId, formulaConfig })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start scan");
  }
  return res.json();
}

export async function getScanProgress(scanId: string): Promise<ScanProgress> {
  const res = await fetch(`${API_BASE}/scan/progress/${scanId}`);
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function cancelScan(scanId: string): Promise<void> {
  await fetch(`${API_BASE}/scan/${scanId}/cancel`, { method: "POST" });
}

export async function fetchScanResults(scanId: string): Promise<ScanResultsResponse> {
  const res = await fetch(`${API_BASE}/scan/${scanId}/results`);
  if (!res.ok) throw new Error("Failed to fetch scan results");
  return res.json();
}

export async function fetchLatestScanResults(): Promise<ScanResultsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/scan/latest/results`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchStockHistory(symbol: string): Promise<any> {
  const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/history`);
  if (!res.ok) throw new Error("Failed to load stock history");
  return res.json();
}

export function getExcelDownloadUrl(scanId: string): string {
  return `${API_BASE}/scan/${scanId}/export/excel`;
}
