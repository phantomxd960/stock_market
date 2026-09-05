import * as math from "mathjs";
import { FormulaConfig, StockMetrics } from "./types.js";

/**
 * Calculates sample standard deviation (ddof = 1) matching Pandas Series.std()
 */
export function sampleStdDev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
}

/**
 * Computes all stock metrics from an array of historical daily closing prices.
 * Minimum 252 closing prices required.
 */
export function computeStockMetrics(closes: number[]): StockMetrics {
  const n = closes.length;
  if (n < 252) {
    throw new Error(`Insufficient price history: ${n} days (minimum 252 required)`);
  }

  const currentPrice = closes[n - 1];
  const price1m = n >= 21 ? closes[n - 21] : currentPrice;
  const price3m = n >= 63 ? closes[n - 63] : currentPrice;
  const price6m = closes[n - 126];
  const price12m = closes[n - 252];

  // Simple returns matching momentum_rank.py: (current / historical) - 1
  const ret1m = price1m > 0 ? (currentPrice / price1m) - 1 : 0;
  const ret3m = price3m > 0 ? (currentPrice / price3m) - 1 : 0;
  const ret6m = price6m > 0 ? (currentPrice / price6m) - 1 : 0;
  const ret12m = price12m > 0 ? (currentPrice / price12m) - 1 : 0;

  // Calculate daily returns for volatility matching Pandas pct_change().dropna()
  const dailyReturns: number[] = [];
  for (let i = 1; i < n; i++) {
    if (closes[i - 1] > 0) {
      dailyReturns.push((closes[i] / closes[i - 1]) - 1);
    }
  }

  // Standard deviation of last 252, 126, and 63 daily returns (ddof=1)
  const last252Returns = dailyReturns.slice(-252);
  const last126Returns = dailyReturns.slice(-126);
  const last63Returns = dailyReturns.slice(-63);

  const std12m = sampleStdDev(last252Returns);
  const std6m = sampleStdDev(last126Returns);
  const std3m = sampleStdDev(last63Returns);

  // Simple Moving Averages
  const slice50 = closes.slice(-50);
  const slice200 = closes.slice(-200);
  const sma50 = slice50.reduce((a, b) => a + b, 0) / slice50.length;
  const sma200 = slice200.reduce((a, b) => a + b, 0) / slice200.length;

  return {
    currentPrice,
    price1m,
    price3m,
    price6m,
    price12m,
    ret1m,
    ret3m,
    ret6m,
    ret12m,
    std3m,
    std6m,
    std12m,
    sma50,
    sma200
  };
}

/**
 * BASE FORMULA from momentum_rank.py:
 * momentum_score = ((ret_6m / std_12m) + (ret_12m / std_12m)) / 2
 */
export function calculateBaseScore(metrics: StockMetrics): number {
  if (metrics.std12m <= 0) return 0;
  return ((metrics.ret6m / metrics.std12m) + (metrics.ret12m / metrics.std12m)) / 2.0;
}

/**
 * Calculate momentum score using either base formula, custom parameters, or custom expression.
 */
export function calculateScore(metrics: StockMetrics, config?: FormulaConfig): number {
  if (!config || config.mode === "base" || config.isBase) {
    return calculateBaseScore(metrics);
  }

  if (config.mode === "custom_params") {
    const w6m = config.weight6m ?? 0.5;
    const w12m = config.weight12m ?? 0.5;
    const w3m = config.weight3m ?? 0.0;
    const adjustVol = config.adjustByVolatility ?? true;
    const divisor = adjustVol ? metrics.std12m : 1.0;

    if (divisor <= 0) return 0;

    const weightedReturn = (metrics.ret6m * w6m) + (metrics.ret12m * w12m) + (metrics.ret3m * w3m);
    return weightedReturn / divisor;
  }

  if (config.mode === "custom_expression" && config.customExpression) {
    try {
      const scope = {
        ret_1m: metrics.ret1m,
        ret_3m: metrics.ret3m,
        ret_6m: metrics.ret6m,
        ret_12m: metrics.ret12m,
        std_3m: metrics.std3m,
        std_6m: metrics.std6m,
        std_12m: metrics.std12m,
        current_price: metrics.currentPrice,
        price_1m: metrics.price1m,
        price_3m: metrics.price3m,
        price_6m: metrics.price6m,
        price_12m: metrics.price12m,
        sma_50: metrics.sma50,
        sma_200: metrics.sma200
      };
      const result = math.evaluate(config.customExpression, scope);
      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        return result;
      }
      return 0;
    } catch (e) {
      console.error("Custom formula evaluation error:", e);
      return calculateBaseScore(metrics);
    }
  }

  return calculateBaseScore(metrics);
}

// Built-in formula presets with immutable Base Formula
export const DEFAULT_PRESETS: FormulaConfig[] = [
  {
    id: "base_nse_dual",
    name: "NSE Dual Momentum (Base Default)",
    description: "Original formula: 50% 6M Return + 50% 12M Return normalized by 12M Volatility. Unaltered default.",
    isBase: true,
    isLocked: true,
    mode: "base",
    weight6m: 0.5,
    weight12m: 0.5,
    weight3m: 0.0,
    adjustByVolatility: true,
    customExpression: "((ret_6m / std_12m) + (ret_12m / std_12m)) / 2",
    topBasketSize: 60,
    minPrice: 0.0
  },
  {
    id: "pure_12m_return",
    name: "Pure 12M Momentum (Unadjusted)",
    description: "Pure 1-year total percentage return without volatility penalty.",
    isBase: false,
    isLocked: false,
    mode: "custom_expression",
    weight6m: 0.0,
    weight12m: 1.0,
    weight3m: 0.0,
    adjustByVolatility: false,
    customExpression: "ret_12m * 100",
    topBasketSize: 60,
    minPrice: 20.0
  },
  {
    id: "tri_horizon_sharpe",
    name: "Tri-Horizon Sharpe (3M + 6M + 12M)",
    description: "Multi-timeframe momentum: 20% 3M, 30% 6M, and 50% 12M divided by 12M Volatility.",
    isBase: false,
    isLocked: false,
    mode: "custom_params",
    weight6m: 0.3,
    weight12m: 0.5,
    weight3m: 0.2,
    adjustByVolatility: true,
    customExpression: "((0.2 * ret_3m + 0.3 * ret_6m + 0.5 * ret_12m) / std_12m)",
    topBasketSize: 60,
    minPrice: 10.0
  },
  {
    id: "low_vol_momentum",
    name: "Low-Volatility Quality Momentum",
    description: "Favors steady trending stocks with higher penalization on turbulent volatility.",
    isBase: false,
    isLocked: false,
    mode: "custom_expression",
    weight6m: 0.5,
    weight12m: 0.5,
    weight3m: 0.0,
    adjustByVolatility: true,
    customExpression: "((ret_6m + ret_12m) / 2) / (std_12m ^ 1.5)",
    topBasketSize: 60,
    minPrice: 50.0
  }
];
