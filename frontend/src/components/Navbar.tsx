import React from 'react';
import { Play, Sliders, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { FormulaConfig, UniverseInfo } from '../types.js';

interface NavbarProps {
  universes: UniverseInfo[];
  selectedUniverseId: string;
  onSelectUniverse: (id: string) => void;
  activeFormula: FormulaConfig;
  onOpenFormulaStudio: () => void;
  onStartScan: () => void;
  isScanning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  universes,
  selectedUniverseId,
  onSelectUniverse,
  activeFormula,
  onOpenFormulaStudio,
  onStartScan,
  isScanning
}) => {
  const currentUniverse = universes.find(u => u.id === selectedUniverseId);

  return (
    <header className="sticky top-0 z-40 bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Market Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  NSE <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">Momentum</span>
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Dual-Horizon Screener</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            NSE Market Open
          </div>
        </div>

        {/* Center: Universe Selector & Formula Indicator */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          
          {/* Universe Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-300 text-xs font-medium hover:border-slate-600 transition">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={selectedUniverseId}
                onChange={(e) => onSelectUniverse(e.target.value)}
                disabled={isScanning}
                className="bg-transparent border-none text-slate-200 text-xs focus:ring-0 focus:outline-none cursor-pointer pr-1"
              >
                {universes.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                    {u.name} ({u.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Formula Pill */}
          <button
            onClick={onOpenFormulaStudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 text-xs font-medium text-slate-200 transition group"
            title="Click to view or customize formula"
          >
            {activeFormula.isBase ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="max-w-[150px] truncate">{activeFormula.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 group-hover:text-sky-300">
              {activeFormula.isBase ? 'Base' : 'Custom'}
            </span>
          </button>

          {/* Formula Studio Trigger Button */}
          <button
            onClick={onOpenFormulaStudio}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition"
            title="Open Formula Studio"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Run Scan Button */}
          <button
            onClick={onStartScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs transition shadow-lg ${
              isScanning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20 active:scale-95'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Scanning {currentUniverse?.name}...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Momentum Scan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
