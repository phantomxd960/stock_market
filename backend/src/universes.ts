import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { UniverseInfo } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
const SYMBOLS_CSV_PATH = path.join(ROOT_DIR, "symbols.csv");

export const NIFTY_50 = [
  "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK",
  "BAJAJ-AUTO", "BAJFINANCE", "BAJAJFINSV", "BEL", "BPCL",
  "BHARTIARTL", "BRITANNIA", "CIPLA", "COALINDIA", "DRREDDY",
  "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE",
  "HEROMOTOCO", "HINDALCO", "HINDUNILVR", "ICICIBANK", "INDUSINDBK",
  "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT",
  "M&M", "MARUTI", "NESTLEIND", "NTPC", "ONGC",
  "POWERGRID", "RELIANCE", "SBILIFE", "SHRIRAMFIN", "SBIN",
  "SUNPHARMA", "TCS", "TATACONSUM", "TATAMOTORS", "TATASTEEL",
  "TECHM", "TITAN", "TRENT", "ULTRACEMCO", "WIPRO"
];

export const NIFTY_NEXT_50 = [
  "ABB", "AMBUJACEM", "BANKBARODA", "BERGEPAINT", "BOSCHLTD",
  "CANBK", "CHOLAFIN", "COLPAL", "DABUR", "DIVISLAB",
  "DLF", "GAIL", "GODREJCP", "HAL", "HAVELLS",
  "ICICIGI", "ICICIPRULI", "IOC", "IRCTC", "IRFC",
  "JINDALSTEL", "JIOFIN", "LICI", "LTIM", "MARICO",
  "MOTHERSON", "NAUKRI", "PIDILITIND", "PFC", "PNB",
  "RECLTD", "SBICARD", "SIEMENS", "SRF", "TVSMOTOR",
  "UNITDSPR", "VBL", "VEDL", "ZYDUSLIFE", "BHEL",
  "TORNTPHARM", "INDIGO", "POLYCAB", "PERSISTENT", "CUMMINSIND",
  "PRESTIGE", "DIXON", "MAXHEALTH", "OBEROIRLTY", "SOLARINDS"
];

export const NIFTY_100 = Array.from(new Set([...NIFTY_50, ...NIFTY_NEXT_50])).sort();

export function getAllNseSymbols(): string[] {
  try {
    if (fs.existsSync(SYMBOLS_CSV_PATH)) {
      const content = fs.readFileSync(SYMBOLS_CSV_PATH, "utf-8");
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // Skip header if 'Symbol'
      const startIndex = lines[0]?.toLowerCase() === "symbol" ? 1 : 0;
      const symbols: string[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const sym = lines[i].replace(/[",]/g, "").trim().toUpperCase();
        if (sym) symbols.push(sym);
      }
      return Array.from(new Set(symbols));
    }
  } catch (err) {
    console.error("Error reading symbols.csv:", err);
  }
  return NIFTY_100;
}

export function getAvailableUniverses(): UniverseInfo[] {
  const allSymbols = getAllNseSymbols();
  return [
    {
      id: "nifty_50",
      name: "Nifty 50 (Bluechips)",
      description: "Top 50 high-liquidity large caps. Super fast scan (~10-15 seconds).",
      count: NIFTY_50.length,
      recommended: true
    },
    {
      id: "nifty_100",
      name: "Nifty 100",
      description: "Top 100 benchmark constituents.",
      count: NIFTY_100.length,
      recommended: false
    },
    {
      id: "all_nse",
      name: "Full NSE Universe",
      description: "Complete universe from symbols.csv (2,500+ active equities).",
      count: allSymbols.length,
      recommended: false
    },
    {
      id: "custom",
      name: "Custom Symbol Basket",
      description: "Paste your custom stock tickers or upload a CSV.",
      count: 0,
      recommended: false
    }
  ];
}

export function getSymbolsForUniverse(universeId: string, customSymbols?: string[]): string[] {
  if (universeId === "nifty_50") return NIFTY_50;
  if (universeId === "nifty_100") return NIFTY_100;
  if (universeId === "all_nse") return getAllNseSymbols();
  if (universeId === "custom" && customSymbols && customSymbols.length > 0) {
    return Array.from(new Set(customSymbols.map(s => s.trim().toUpperCase().replace(".NS", "")).filter(Boolean)));
  }
  return NIFTY_50;
}
