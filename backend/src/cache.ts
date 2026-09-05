import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FormulaConfig, StockResult } from "./types.js";
import { DEFAULT_PRESETS } from "./formulaEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CACHE_FILE = path.join(DATA_DIR, "price_cache.json");
const PRESETS_FILE = path.join(DATA_DIR, "presets.json");
const SCANS_FILE = path.join(DATA_DIR, "scans.json");

export interface PriceCacheEntry {
  symbol: string;
  lastUpdated: string;
  closes: number[];
  timestamps: number[];
}

let inMemoryPriceCache: Record<string, PriceCacheEntry> = {};

// Load price cache from disk
try {
  if (fs.existsSync(CACHE_FILE)) {
    inMemoryPriceCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
} catch (e) {
  console.warn("Could not read price cache file:", e);
  inMemoryPriceCache = {};
}

export function getCachedCloses(symbol: string): { closes: number[]; timestamps: number[] } | null {
  const entry = inMemoryPriceCache[symbol];
  if (!entry || !entry.closes || entry.closes.length < 252) {
    return null;
  }
  // Check if updated within 18 hours
  const ageHours = (Date.now() - new Date(entry.lastUpdated).getTime()) / (1000 * 60 * 60);
  if (ageHours > 18) {
    return null; // Stale, refresh
  }
  return {
    closes: entry.closes,
    timestamps: entry.timestamps || []
  };
}

let saveTimeout: NodeJS.Timeout | null = null;
export function saveCachedCloses(symbol: string, closes: number[], timestamps: number[] = []): void {
  if (closes.length < 252) return;
  inMemoryPriceCache[symbol] = {
    symbol,
    lastUpdated: new Date().toISOString(),
    closes,
    timestamps
  };

  // Debounced write to disk
  if (!saveTimeout) {
    saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(inMemoryPriceCache), "utf-8");
      } catch (err) {
        console.error("Failed to write price cache:", err);
      }
      saveTimeout = null;
    }, 2000);
  }
}

export function getSavedPresets(): FormulaConfig[] {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const custom = JSON.parse(fs.readFileSync(PRESETS_FILE, "utf-8")) as FormulaConfig[];
      // Always ensure default base preset is first and locked
      const basePreset = DEFAULT_PRESETS[0];
      const otherBuiltins = DEFAULT_PRESETS.slice(1);
      const customMap = new Map<string, FormulaConfig>();
      
      otherBuiltins.forEach(p => customMap.set(p.id, p));
      custom.forEach(p => {
        if (p.id !== basePreset.id) {
          customMap.set(p.id, p);
        }
      });

      return [basePreset, ...Array.from(customMap.values())];
    }
  } catch (err) {
    console.error("Error reading presets file:", err);
  }
  return DEFAULT_PRESETS;
}

export function savePreset(preset: FormulaConfig): FormulaConfig {
  if (preset.id === "base_nse_dual" || preset.isBase) {
    throw new Error("The Base Formula is immutable and cannot be overwritten.");
  }

  const presets = getSavedPresets();
  const existingIdx = presets.findIndex(p => p.id === preset.id);
  
  if (existingIdx >= 0) {
    presets[existingIdx] = preset;
  } else {
    presets.push(preset);
  }

  const toSave = presets.filter(p => !p.isLocked);
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  return preset;
}

export function deletePreset(presetId: string): boolean {
  if (presetId === "base_nse_dual") {
    throw new Error("Cannot delete base preset");
  }
  const presets = getSavedPresets();
  const filtered = presets.filter(p => p.id !== presetId);
  const toSave = filtered.filter(p => !p.isLocked);
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  return true;
}
