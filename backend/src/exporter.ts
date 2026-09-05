import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { StockResult } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.resolve(__dirname, "../exports");
const ROOT_DIR = path.resolve(__dirname, "../../");

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export async function generateExcelWorkbook(
  sheet1Data: StockResult[],
  sheet2Data: StockResult[],
  sheet5Data: StockResult[],
  syncToRoot: boolean = true
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NSE Momentum Screener";
  workbook.lastModifiedBy = "NSE Momentum Screener";
  workbook.created = new Date();

  const baseColumns = [
    { header: "Symbol", key: "Symbol", width: 14 },
    { header: "Current Price", key: "Current Price", width: 16 },
    { header: "Price 6M Ago", key: "Price 6M Ago", width: 16 },
    { header: "Price 12M Ago", key: "Price 12M Ago", width: 16 },
    { header: "6M Return (%)", key: "6M Return (%)", width: 16 },
    { header: "12M Return (%)", key: "12M Return (%)", width: 16 },
    { header: "Std Dev", key: "Std Dev", width: 16 },
    { header: "Momentum Score", key: "Momentum Score", width: 18 },
    { header: "Market Cap (Cr)", key: "Market Cap (Cr)", width: 18 }
  ];

  const rankedColumns = [
    ...baseColumns,
    { header: "Rank", key: "Rank", width: 12 }
  ];

  function styleSheet(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" } // Dark Slate
      };
      cell.font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" }
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF334155" } }
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFF1F5F9" } }
        };
        // Numbers right aligned
        if (typeof cell.value === "number") {
          cell.alignment = { vertical: "middle", horizontal: "right" };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });
  }

  // 1. Sheet1 (All stocks raw order)
  const ws1 = workbook.addWorksheet("Sheet1");
  ws1.columns = baseColumns;
  sheet1Data.forEach(row => ws1.addRow(row));
  styleSheet(ws1);

  // 2. Sheet2 (Ranked stocks)
  const ws2 = workbook.addWorksheet("Sheet2");
  ws2.columns = rankedColumns;
  sheet2Data.forEach(row => ws2.addRow(row));
  styleSheet(ws2);

  // 3. Sheet5 (Top 60 basket)
  const ws5 = workbook.addWorksheet("Sheet5");
  ws5.columns = rankedColumns;
  sheet5Data.forEach(row => ws5.addRow(row));
  styleSheet(ws5);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileBuffer = Buffer.from(buffer);

  // Save to backend/exports/Momentum_Rank.xlsx
  const exportPath = path.join(EXPORTS_DIR, "Momentum_Rank.xlsx");
  fs.writeFileSync(exportPath, fileBuffer);

  // Sync to root Momentum_Rank.xlsx
  if (syncToRoot) {
    try {
      const rootPath = path.join(ROOT_DIR, "Momentum_Rank.xlsx");
      fs.writeFileSync(rootPath, fileBuffer);
    } catch (e) {
      console.warn("Could not sync to root Momentum_Rank.xlsx:", e);
    }
  }

  return fileBuffer;
}
