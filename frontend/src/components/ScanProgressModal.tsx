import React from 'react';
import { Loader2, XCircle, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { ScanProgress } from '../types.js';

interface ScanProgressModalProps {
  progress: ScanProgress | null;
  isOpen: boolean;
  onCancel: () => void;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  progress,
  isOpen,
  onCancel
}) => {
  if (!isOpen || !progress) return null;

  const isFinished = progress.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isFinished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
              {isFinished ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {isFinished ? 'Scan Completed Successfully' : 'Executing Dual-Horizon Momentum Scan'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{progress.formulaName}</p>
            </div>
          </div>
        </div>

        {/* Big Progress Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Progress</span>
            <span className="font-mono text-sky-400 font-bold text-lg">{progress.percentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
        </div>

        {/* Scanning Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Currently Scanning</span>
            <span className="text-sky-300 font-mono font-bold text-sm truncate block mt-0.5">
              {progress.currentSymbol ? `${progress.currentSymbol}.NS` : 'Resolving batch...'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Stocks Analyzed</span>
            <span className="text-white font-mono font-bold text-sm block mt-0.5">
              {progress.processed} / {progress.total}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px]">Elapsed Time</span>
              <span className="text-slate-200 font-mono font-bold text-xs">{progress.elapsedSeconds}s</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px]">Estimated ETA</span>
              <span className="text-amber-300 font-mono font-bold text-xs">{progress.etaSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isFinished && (
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Scan
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
