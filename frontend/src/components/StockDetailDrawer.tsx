import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Award, Building2, ShieldCheck } from 'lucide-react';
import { StockResult } from '../types.js';
import { fetchStockHistory } from '../services/api.js';

interface StockDetailDrawerProps {
  stock: StockResult | null;
  onClose: () => void;
}

export const StockDetailDrawer: React.FC<StockDetailDrawerProps> = ({ stock, onClose }) => {
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;
    setLoading(true);
    fetchStockHistory(stock.Symbol)
      .then(data => {
        setHistoryData(data);
      })
      .catch(err => {
        console.error("Error loading stock history:", err);
      })
      .finally(() => setLoading(false));
  }, [stock?.Symbol]);

  if (!stock) return null;

  const is6mPos = stock["6M Return (%)"] >= 0;
  const is12mPos = stock["12M Return (%)"] >= 0;

  const marketCapCr = historyData?.marketCapCr ?? stock["Market Cap (Cr)"];
  const capCategory = historyData?.capCategory ?? stock["Cap Category"] ?? 'Equities';

  const formatMarketCap = (cr?: number) => {
    if (!cr || cr <= 0) return 'Analyzing...';
    if (cr >= 100000) {
      return `₹${(cr / 100000).toFixed(2)} Lakh Crores`;
    }
    return `₹${cr.toLocaleString('en-IN')} Crores`;
  };

  const getCapColor = (category: string) => {
    if (category.includes('Large')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (category.includes('Mid')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (category.includes('Small')) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#0f172a] border-l border-slate-700/80 w-full max-w-xl h-full flex flex-col shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#090d16]/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-lg font-mono">
              {stock.Symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-mono">{stock.Symbol}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">NSE</span>
                {stock.Rank && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3" /> Rank #{stock.Rank}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">National Stock Exchange of India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Market Cap & Classification Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#131d33] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Market Capitalization</span>
                <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                  {formatMarketCap(marketCapCr)}
                </span>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getCapColor(capCategory)}`}>
              {capCategory}
            </span>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Current Price</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">₹{stock["Current Price"]}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Momentum Score</span>
              <span className="text-xl font-bold text-sky-400 font-mono mt-1 block">{stock["Momentum Score"]}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">12M Return</span>
              <span className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${is12mPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {is12mPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stock["12M Return (%)"]}%
              </span>
            </div>
          </div>

          {/* Multi-Horizon Performance Grid */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Multi-Timeframe Returns
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">1-Month</span>
                <span className={`text-sm font-bold font-mono ${historyData?.metrics?.ret1m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {historyData?.metrics?.ret1m != null ? `${(historyData.metrics.ret1m * 100).toFixed(2)}%` : '-'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">3-Month</span>
                <span className={`text-sm font-bold font-mono ${historyData?.metrics?.ret3m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {historyData?.metrics?.ret3m != null ? `${(historyData.metrics.ret3m * 100).toFixed(2)}%` : '-'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">6-Month</span>
                <span className={`text-sm font-bold font-mono ${is6mPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {is6mPos ? `+${stock["6M Return (%)"]}%` : `${stock["6M Return (%)"]}%`}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">12-Month</span>
                <span className={`text-sm font-bold font-mono ${is12mPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {is12mPos ? `+${stock["12M Return (%)"]}%` : `${stock["12M Return (%)"]}%`}
                </span>
              </div>

            </div>
          </div>

          {/* Technical Moving Averages & Volatility */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Moving Averages & Risk Parameters
            </span>
            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">50-Day Moving Average</span>
                <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                  {historyData?.metrics?.sma50 ? `₹${historyData.metrics.sma50.toFixed(2)}` : 'Calculating...'}
                </span>
                {historyData?.metrics?.sma50 && (
                  <span className={`text-[10px] block mt-1 ${stock["Current Price"] >= historyData.metrics.sma50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stock["Current Price"] >= historyData.metrics.sma50 ? '▲ Above 50 SMA (Bullish)' : '▼ Below 50 SMA (Bearish)'}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">200-Day Moving Average</span>
                <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                  {historyData?.metrics?.sma200 ? `₹${historyData.metrics.sma200.toFixed(2)}` : 'Calculating...'}
                </span>
                {historyData?.metrics?.sma200 && (
                  <span className={`text-[10px] block mt-1 ${stock["Current Price"] >= historyData.metrics.sma200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stock["Current Price"] >= historyData.metrics.sma200 ? '▲ Above 200 SMA (Long Trend)' : '▼ Below 200 SMA (Downtrend)'}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Detailed Historical Reference Points */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Formula Breakdown Details
            </span>
            
            <div className="divide-y divide-slate-800 text-xs font-mono">
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-sans">Price 6 Months Ago (t-126):</span>
                <span className="text-slate-200">₹{stock["Price 6M Ago"]}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-sans">Price 12 Months Ago (t-252):</span>
                <span className="text-slate-200">₹{stock["Price 12M Ago"]}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-sans">Daily Return Volatility (Std Dev):</span>
                <span className="text-indigo-300 font-bold">{stock["Std Dev"]}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-sans">Annualized Volatility (approx):</span>
                <span className="text-indigo-300 font-bold">{(stock["Std Dev"] * Math.sqrt(252) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
