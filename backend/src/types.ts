export interface StockResult {
  Symbol: string;
  "Current Price": number;
  "Price 6M Ago": number;
  "Price 12M Ago": number;
  "6M Return (%)": number;
  "12M Return (%)": number;
  "Std Dev": number;
  "Momentum Score": number;
  "Market Cap (Cr)"?: number;
  "Cap Category"?: string;
  Rank?: number;
}

export interface StockMetrics {
  currentPrice: number;
  price1m: number;
  price3m: number;
  price6m: number;
  price12m: number;
  ret1m: number;
  ret3m: number;
  ret6m: number;
  ret12m: number;
  std3m: number;
  std6m: number;
  std12m: number;
  sma50: number;
  sma200: number;
  marketCapCr?: number;
  capCategory?: string;
}

export type FormulaMode = "base" | "custom_params" | "custom_expression";

export interface FormulaConfig {
  id: string;
  name: string;
  description: string;
  isBase: boolean;
  isLocked?: boolean;
  mode: FormulaMode;
  weight6m: number;
  weight12m: number;
  weight3m: number;
  adjustByVolatility: boolean;
  customExpression: string;
  topBasketSize: number;
  minPrice: number;
}

export interface UniverseInfo {
  id: string;
  name: string;
  description: string;
  count: number;
  recommended: boolean;
}

export interface ScanProgress {
  scanId: string;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  universeId: string;
  total: number;
  processed: number;
  successCount: number;
  currentSymbol: string;
  percentage: number;
  elapsedSeconds: number;
  etaSeconds: number;
  formulaName: string;
  errorsCount: number;
}
