import React from 'react';
import { TrendingUp, Award, BarChart3, Layers } from 'lucide-react';
import { StockResult } from '../types.js';

interface DashboardStatsProps {
  sheet2: StockResult[];
  sheet5: StockResult[];
  universeName: string;
  totalProcessed: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  sheet2,
  sheet5,
  universeName,
  totalProcessed
}) => {
  const topStock = sheet2.length > 0 ? sheet2[0] : null;

  // Calculate average returns for top basket
  const avg6m = sheet5.length > 0
    ? (sheet5.reduce((sum, s) => sum + s["6M Return (%)"], 0) / sheet5.length).toFixed(1)
    : "0.0";

  const avg12m = sheet5.length > 0
    ? (sheet5.reduce((sum, s) => sum + s["12M Return (%)"], 0) / sheet5.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      
      {/* 1. Analyzed Universe */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Universe Scanned</span>
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalProcessed} <span className="text-xs font-normal text-slate-400">stocks</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">Target: {universeName}</p>
        </div>
      </div>

      {/* 2. Top Momentum Leader */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rank #1 Leader</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {topStock ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-300 font-mono tracking-tight">{topStock.Symbol}</span>
                <span className="text-xs text-slate-400">₹{topStock["Current Price"]}</span>
              </div>
              <p className="text-xs text-emerald-400 font-medium mt-1">
                Score: {topStock["Momentum Score"]} | 12M: +{topStock["12M Return (%)"]}%
              </p>
            </div>
          ) : (
            <div className="text-slate-500 text-sm py-1">Run scan to view</div>
          )}
        </div>
      </div>

      {/* 3. Top Basket Avg 6M Return */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Basket Avg 6M Return</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{avg6m}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Top {sheet5.length} allocation stocks</p>
        </div>
      </div>

      {/* 4. Top Basket Avg 12M Return */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Basket Avg 12M Return</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-indigo-300 tracking-tight">
            +{avg12m}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Annualized momentum basket</p>
        </div>
      </div>

    </div>
  );
};
