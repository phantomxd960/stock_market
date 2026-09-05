import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { getAvailableUniverses } from "./universes.js";
import { getSavedPresets, savePreset, deletePreset } from "./cache.js";
import {
  activeScans,
  lastCompletedScan,
  runScan,
  createScanProgress,
  testSingleSymbol,
  fetchStockCloses,
  ScanSession
} from "./scanner.js";
import { generateExcelWorkbook } from "./exporter.js";
import { DEFAULT_PRESETS } from "./formulaEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
const FRONTEND_DIST = path.resolve(ROOT_DIR, "frontend/dist");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Get Universes
app.get("/api/universes", (req: Request, res: Response) => {
  const universes = getAvailableUniverses();
  res.json(universes);
});

// 2. Get Formulas (Base formula always first & immutable)
app.get("/api/formulas", (req: Request, res: Response) => {
  const presets = getSavedPresets();
  res.json(presets);
});

// 3. Save Custom Formula
app.post("/api/formulas", (req: Request, res: Response) => {
  try {
    const config = req.body;
    if (!config.id) {
      config.id = `custom_${Date.now()}`;
    }
    config.isBase = false;
    config.isLocked = false;
    const saved = savePreset(config);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to save formula" });
  }
});

// 4. Delete Custom Formula
app.delete("/api/formulas/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    deletePreset(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Test formula on single ticker (Sandbox)
app.post("/api/formulas/test", async (req: Request, res: Response) => {
  try {
    const { symbol, formulaConfig } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }
    const result = await testSingleSymbol(symbol, formulaConfig);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Calculation failed" });
  }
});

// 6. Start Scan
app.post("/api/scan/start", async (req: Request, res: Response) => {
  try {
    const { universeId = "nifty_50", formulaConfig } = req.body;
    
    // Resolve formula config: default to base preset if not specified
    const activeConfig = formulaConfig || DEFAULT_PRESETS[0];
    const scanId = `scan_${Date.now()}`;

    const session: ScanSession = {
      scanId,
      universeId,
      formulaConfig: activeConfig,
      status: "running",
      total: 0,
      processed: 0,
      successCount: 0,
      currentSymbol: "",
      startTime: Date.now(),
      isCancelled: false,
      sheet1: [],
      sheet2: [],
      sheet5: [],
      errors: []
    };

    activeScans.set(scanId, session);

    // Launch scan in background
    runScan(session).catch(err => {
      console.error(`Scan ${scanId} failed:`, err);
      session.status = "failed";
      session.errors.push(String(err));
    });

    res.json({ scanId, status: "started" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Scan Progress (Polling & SSE support)
app.get("/api/scan/progress/:scanId", (req: Request, res: Response) => {
  const { scanId } = req.params;
  const session = activeScans.get(scanId) || (lastCompletedScan?.scanId === scanId ? lastCompletedScan : null);

  if (!session) {
    return res.status(404).json({ error: "Scan session not found" });
  }

  // Check if SSE requested
  if (req.headers.accept === "text/event-stream") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const interval = setInterval(() => {
      const progress = createScanProgress(session);
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      if (session.status !== "running") {
        clearInterval(interval);
        res.end();
      }
    }, 400);

    req.on("close", () => clearInterval(interval));
  } else {
    res.json(createScanProgress(session));
  }
});

// 8. Cancel Scan
app.post("/api/scan/:scanId/cancel", (req: Request, res: Response) => {
  const { scanId } = req.params;
  const session = activeScans.get(scanId);
  if (session) {
    session.isCancelled = true;
    session.status = "cancelled";
    res.json({ status: "cancelled" });
  } else {
    res.status(404).json({ error: "Scan not found" });
  }
});

// 9. Get Scan Results
app.get("/api/scan/:scanId/results", (req: Request, res: Response) => {
  const { scanId } = req.params;
  const session = activeScans.get(scanId) || (lastCompletedScan?.scanId === scanId ? lastCompletedScan : null);

  if (!session) {
    return res.status(404).json({ error: "Scan results not found" });
  }

  res.json({
    scanId: session.scanId,
    status: session.status,
    formulaName: session.formulaConfig.name,
    universeId: session.universeId,
    totalProcessed: session.sheet1.length,
    sheet1: session.sheet1,
    sheet2: session.sheet2,
    sheet5: session.sheet5
  });
});

// 10. Get Latest Scan Results (if available)
app.get("/api/scan/latest/results", (req: Request, res: Response) => {
  if (!lastCompletedScan) {
    return res.status(404).json({ error: "No completed scans yet" });
  }
  res.json({
    scanId: lastCompletedScan.scanId,
    status: lastCompletedScan.status,
    formulaName: lastCompletedScan.formulaConfig.name,
    universeId: lastCompletedScan.universeId,
    totalProcessed: lastCompletedScan.sheet1.length,
    sheet1: lastCompletedScan.sheet1,
    sheet2: lastCompletedScan.sheet2,
    sheet5: lastCompletedScan.sheet5
  });
});

// 11. Download Excel Workbook (Momentum_Rank.xlsx with Sheet1, Sheet2, Sheet5)
app.get("/api/scan/:scanId/export/excel", async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const session = activeScans.get(scanId) || (lastCompletedScan?.scanId === scanId ? lastCompletedScan : null);

    if (!session || session.sheet1.length === 0) {
      return res.status(404).json({ error: "No scan data available to export" });
    }

    const buffer = await generateExcelWorkbook(session.sheet1, session.sheet2, session.sheet5);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Momentum_Rank.xlsx");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Stock History for Chart Drawer
app.get("/api/stock/:symbol/history", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const result = await testSingleSymbol(symbol);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend production build if available
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 NSE Momentum Backend running on http://localhost:${PORT}`);
});
