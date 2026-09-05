import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { computeStockMetrics, calculateScore, calculateBaseScore } from "./formulaEngine.js";
import { getCachedCloses, saveCachedCloses } from "./cache.js";
import { getSymbolsForUniverse } from "./universes.js";
import { FormulaConfig, ScanProgress, StockMetrics, StockResult } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");
const SHARES_CACHE_FILE = path.join(DATA_DIR, "shares_cache.json");

let sharesCache: Record<string, number> = {};
try {
  if (fs.existsSync(SHARES_CACHE_FILE)) {
    sharesCache = JSON.parse(fs.readFileSync(SHARES_CACHE_FILE, "utf-8"));
  }
} catch (e) {
  sharesCache = {};
}

function saveSharesCache(symbol: string, shares: number) {
  sharesCache[symbol] = shares;
  try {
    fs.writeFileSync(SHARES_CACHE_FILE, JSON.stringify(sharesCache), "utf-8");
  } catch (e) {
    // ignore
  }
}

export function getCapCategory(mcapCr?: number): string {
  if (!mcapCr || mcapCr <= 0) return 'Small/Micro';
  if (mcapCr >= 20000) return 'Large Cap';
  if (mcapCr >= 5000) return 'Mid Cap';
  if (mcapCr >= 500) return 'Small Cap';
  return 'Micro Cap';
}

export async function fetchStockShares(symbol: string): Promise<number | null> {
  const cleanSym = symbol.trim().toUpperCase().replace(".NS", "");
  if (sharesCache[cleanSym]) {
    return sharesCache[cleanSym];
  }

  const url = `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${cleanSym}.NS?symbol=${cleanSym}.NS&type=shares_out&period1=1700000000&period2=1800000000`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const sharesList = data?.timeseries?.result?.[0]?.shares_out;
    if (Array.isArray(sharesList) && sharesList.length > 0) {
      const latestShares = sharesList[sharesList.length - 1];
      if (typeof latestShares === "number" && latestShares > 0) {
        saveSharesCache(cleanSym, latestShares);
        return latestShares;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export interface ScanSession {
  scanId: string;
  universeId: string;
  formulaConfig: FormulaConfig;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  total: number;
  processed: number;
  successCount: number;
  currentSymbol: string;
  startTime: number;
  endTime?: number;
  isCancelled: boolean;
  sheet1: StockResult[]; // Raw unranked universe order (without Rank)
  sheet2: StockResult[]; // Sorted by Momentum Score descending with Rank
  sheet5: StockResult[]; // Top N basket (default 60)
  errors: string[];
}

export const activeScans = new Map<string, ScanSession>();
export let lastCompletedScan: ScanSession | null = null;

// Helper to fetch close prices and timestamps for an NSE ticker
export async function fetchStockCloses(
  symbol: string,
  forceRefresh: boolean = false
): Promise<{ closes: number[]; timestamps: number[] } | null> {
  const cleanSym = symbol.trim().toUpperCase().replace(".NS", "");

  if (!forceRefresh) {
    const cached = getCachedCloses(cleanSym);
    if (cached && cached.closes.length >= 252) {
      let ts = cached.timestamps;
      if (!ts || ts.length < cached.closes.length) {
        const now = Math.floor(Date.now() / 1000);
        ts = cached.closes.map((_, i) => now - (cached.closes.length - 1 - i) * 86400);
      }
      return { closes: cached.closes, timestamps: ts };
    }
  }

  const ticker = `${cleanSym}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=18mo&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const rawTimestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    const adjCloses = result.indicators?.adjclose?.[0]?.adjclose;

    const rawCloses: (number | null)[] = adjCloses || quotes?.close || [];
    const validCloses: number[] = [];
    const validTimestamps: number[] = [];

    for (let i = 0; i < rawCloses.length; i++) {
      const c = rawCloses[i];
      if (typeof c === "number" && !isNaN(c) && isFinite(c) && c > 0) {
        validCloses.push(c);
        if (rawTimestamps[i]) {
          validTimestamps.push(rawTimestamps[i]);
        }
      }
    }

    if (validCloses.length < 252) {
      return null;
    }

    let finalTimestamps = validTimestamps;
    if (finalTimestamps.length < validCloses.length) {
      const now = Math.floor(Date.now() / 1000);
      finalTimestamps = validCloses.map((_, i) => now - (validCloses.length - 1 - i) * 86400);
    }

    saveCachedCloses(cleanSym, validCloses, finalTimestamps);
    return { closes: validCloses, timestamps: finalTimestamps };
  } catch (err) {
    return null;
  }
}

export function createScanProgress(session: ScanSession): ScanProgress {
  const now = session.endTime || Date.now();
  const elapsed = (now - session.startTime) / 1000;
  const rate = session.processed / (elapsed || 1);
  const remaining = Math.max(0, session.total - session.processed);
  const eta = rate > 0 ? remaining / rate : 0;

  return {
    scanId: session.scanId,
    status: session.status,
    universeId: session.universeId,
    total: session.total,
    processed: session.processed,
    successCount: session.successCount,
    currentSymbol: session.currentSymbol,
    percentage: session.total > 0 ? Math.round((session.processed / session.total) * 1000) / 10 : 0,
    elapsedSeconds: Math.round(elapsed * 10) / 10,
    etaSeconds: Math.round(eta * 10) / 10,
    formulaName: session.formulaConfig.name,
    errorsCount: session.errors.length
  };
}

export async function runScan(session: ScanSession): Promise<void> {
  const symbols = getSymbolsForUniverse(session.universeId);
  session.total = symbols.length;
  session.status = "running";

  const CONCURRENCY = 6;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < symbols.length && !session.isCancelled) {
      const index = currentIndex++;
      const sym = symbols[index];
      session.currentSymbol = sym;

      try {
        const [data, shares] = await Promise.all([
          fetchStockCloses(sym),
          fetchStockShares(sym)
        ]);

        if (!data || data.closes.length < 252) {
          session.processed++;
          continue;
        }

        const metrics = computeStockMetrics(data.closes);
        
        // Min price filter
        const minPrice = session.formulaConfig.minPrice || 0;
        if (metrics.currentPrice < minPrice || metrics.std12m <= 0) {
          session.processed++;
          continue;
        }

        const momentumScore = calculateScore(metrics, session.formulaConfig);

        // Calculate Market Cap in ₹ Crores (1 Cr = 10,000,000)
        let marketCapCr: number | undefined = undefined;
        if (shares && shares > 0) {
          marketCapCr = Math.round((shares * metrics.currentPrice) / 10000000);
        }

        // Sheet 1 gets the raw result WITHOUT Rank (matching momentum_rank.py)
        const rawResult: StockResult = {
          Symbol: sym,
          "Current Price": Math.round(metrics.currentPrice * 100) / 100,
          "Price 6M Ago": Math.round(metrics.price6m * 100) / 100,
          "Price 12M Ago": Math.round(metrics.price12m * 100) / 100,
          "6M Return (%)": Math.round(metrics.ret6m * 10000) / 100,
          "12M Return (%)": Math.round(metrics.ret12m * 10000) / 100,
          "Std Dev": Math.round(metrics.std12m * 1000000) / 1000000,
          "Momentum Score": Math.round(momentumScore * 10000) / 10000,
          "Market Cap (Cr)": marketCapCr,
          "Cap Category": getCapCategory(marketCapCr)
        };

        session.sheet1.push(rawResult);
        session.successCount++;
      } catch (err: any) {
        session.errors.push(`${sym}: ${err?.message || err}`);
      } finally {
        session.processed++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  session.endTime = Date.now();

  if (session.isCancelled) {
    session.status = "cancelled";
    return;
  }

  if (session.sheet1.length === 0) {
    session.status = "failed";
    session.errors.push("No stocks met history requirements or filter parameters");
    return;
  }

  // Deep clone Sheet1 to generate Sheet2: sorted by Momentum Score descending WITH Rank
  const sorted = session.sheet1
    .map(item => ({ ...item }))
    .sort((a, b) => b["Momentum Score"] - a["Momentum Score"]);
    
  sorted.forEach((item, idx) => {
    item.Rank = idx + 1;
  });
  session.sheet2 = sorted;

  // Sheet5 is top N basket (default 60 stocks from Sheet 2)
  const basketSize = session.formulaConfig.topBasketSize || 60;
  session.sheet5 = sorted.slice(0, basketSize).map(item => ({ ...item }));

  session.status = "completed";
  lastCompletedScan = session;
}

export async function testSingleSymbol(symbol: string, config?: FormulaConfig): Promise<{
  symbol: string;
  metrics: StockMetrics;
  calculatedScore: number;
  baseDefaultScore: number;
  historyPoints: number;
  marketCapCr?: number;
  capCategory?: string;
  dates: string[];
  closes: number[];
}> {
  const [data, shares] = await Promise.all([
    fetchStockCloses(symbol),
    fetchStockShares(symbol)
  ]);

  if (!data || data.closes.length < 252) {
    throw new Error(`Insufficient historical data for ${symbol} (minimum 252 daily closes required)`);
  }

  const metrics = computeStockMetrics(data.closes);
  const calculatedScore = calculateScore(metrics, config);
  const baseDefaultScore = calculateBaseScore(metrics);

  const last252Closes = data.closes.slice(-252);
  const last252Timestamps = data.timestamps.slice(-252);
  const dates = last252Timestamps.map(ts => {
    const d = new Date(ts * 1000);
    return d.toISOString().split("T")[0];
  });

  let marketCapCr: number | undefined = undefined;
  if (shares && shares > 0) {
    marketCapCr = Math.round((shares * metrics.currentPrice) / 10000000);
  }

  return {
    symbol: symbol.trim().toUpperCase().replace(".NS", ""),
    metrics,
    calculatedScore: Math.round(calculatedScore * 10000) / 10000,
    baseDefaultScore: Math.round(baseDefaultScore * 10000) / 10000,
    historyPoints: data.closes.length,
    marketCapCr,
    capCategory: getCapCategory(marketCapCr),
    closes: last252Closes,
    dates: dates
  };
}
