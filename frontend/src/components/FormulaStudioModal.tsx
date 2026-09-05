import React, { useState } from 'react';
import { X, Shield, Sliders, Code, Play, RotateCcw, Save, Check, AlertCircle } from 'lucide-react';
import { FormulaConfig } from '../types.js';
import { testFormulaCalculation, saveCustomFormula } from '../services/api.js';

interface FormulaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFormula: FormulaConfig;
  allPresets: FormulaConfig[];
  onSelectFormula: (formula: FormulaConfig) => void;
  onRefreshPresets: () => void;
}

export const FormulaStudioModal: React.FC<FormulaStudioModalProps> = ({
  isOpen,
  onClose,
  activeFormula,
  allPresets,
  onSelectFormula,
  onRefreshPresets
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'params' | 'expression'>('base');
  
  // Working draft state
  const [draftConfig, setDraftConfig] = useState<FormulaConfig>({ ...activeFormula });
  
  // Sandbox test state
  const [testSymbol, setTestSymbol] = useState('RELIANCE');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Save preset name
  const [presetName, setPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const basePreset = allPresets.find(p => p.isBase) || allPresets[0];

  const handleResetToBase = () => {
    setDraftConfig({ ...basePreset });
    onSelectFormula(basePreset);
    setActiveTab('base');
    setTestResult(null);
  };

  const handleRunSandboxTest = async () => {
    if (!testSymbol) return;
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await testFormulaCalculation(testSymbol, draftConfig);
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.message || 'Testing failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleApplyDraft = () => {
    onSelectFormula(draftConfig);
    onClose();
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      const toSave: FormulaConfig = {
        ...draftConfig,
        id: `custom_${Date.now()}`,
        name: presetName.trim(),
        description: `Custom formula created on ${new Date().toLocaleDateString()}`,
        isBase: false,
        isLocked: false
      };
      await saveCustomFormula(toSave);
      onRefreshPresets();
      onSelectFormula(toSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setPresetName('');
    } catch (err: any) {
      alert(err.message || 'Could not save preset');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090d16]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Formula Studio & Customizer</h2>
              <p className="text-xs text-slate-400">Preserve base formulas or tailor parameters for your trading strategy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('base')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === 'base'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Base Formula (Default)
            </button>

            <button
              onClick={() => setActiveTab('params')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === 'params'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Visual Parameters
            </button>

            <button
              onClick={() => setActiveTab('expression')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === 'expression'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Custom Math Expression
            </button>
          </div>

          {/* Quick Reset to Base Button */}
          <button
            onClick={handleResetToBase}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition py-1 px-2.5 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60"
            title="Revert all changes to original base formula"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to Base Formula
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: Base Formula */}
          {activeTab === 'base' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3.5">
                <Shield className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-emerald-300">Base Formula Protection Active</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-medium uppercase">
                      Immutable
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This is the original, verified formula from <code className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">momentum_rank.py</code>. 
                    It is protected and cannot be altered or overwritten. You can copy it to custom mode whenever you wish to experiment.
                  </p>
                </div>
              </div>

              {/* Formula Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold">Mathematical Definition</span>
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 text-sm overflow-x-auto">
                  Score = ( (Return_6M / StdDev_12M) + (Return_12M / StdDev_12M) ) / 2
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block mb-1 font-semibold">6-Month Component:</span>
                    <span className="text-slate-200">Price 126 trading days ago vs Current Price, normalized by 252-day daily volatility.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block mb-1 font-semibold">12-Month Component:</span>
                    <span className="text-slate-200">Price 252 trading days ago vs Current Price, normalized by 252-day daily volatility.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setDraftConfig({
                      ...basePreset,
                      id: `custom_${Date.now()}`,
                      name: 'Custom Parameterized Momentum',
                      mode: 'custom_params',
                      isBase: false,
                      isLocked: false
                    });
                    setActiveTab('params');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-500/20"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize Formula Parameters
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Visual Parameters */}
          {activeTab === 'params' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200">
                Adjust horizon weights and volatility parameters. The base formula remains safe and can be restored anytime.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 6M Weight */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">6-Month Return Weight</label>
                    <span className="text-xs font-mono text-sky-400 font-bold">{Math.round(draftConfig.weight6m * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draftConfig.weight6m}
                    onChange={(e) => setDraftConfig({ ...draftConfig, mode: 'custom_params', weight6m: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 block">Default: 50%</span>
                </div>

                {/* 12M Weight */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">12-Month Return Weight</label>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{Math.round(draftConfig.weight12m * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draftConfig.weight12m}
                    onChange={(e) => setDraftConfig({ ...draftConfig, mode: 'custom_params', weight12m: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 block">Default: 50%</span>
                </div>

                {/* 3M Weight */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">3-Month Short-Term Weight (Optional)</label>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{Math.round((draftConfig.weight3m || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draftConfig.weight3m || 0}
                    onChange={(e) => setDraftConfig({ ...draftConfig, mode: 'custom_params', weight3m: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 block">Adds fast-trend sensitivity</span>
                </div>

                {/* Volatility Toggle */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Volatility Normalization</label>
                    <input
                      type="checkbox"
                      checked={draftConfig.adjustByVolatility}
                      onChange={(e) => setDraftConfig({ ...draftConfig, mode: 'custom_params', adjustByVolatility: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {draftConfig.adjustByVolatility ? 'Enabled (Divide by 12M Daily Std Dev - Sharpe Mode)' : 'Disabled (Pure Return Mode)'}
                  </span>
                </div>

                {/* Min Price Filter */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Minimum Price Filter (Penny Stock Filter)</label>
                    <span className="text-xs font-mono text-amber-400 font-bold">₹{draftConfig.minPrice || 0}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={draftConfig.minPrice || 0}
                    onChange={(e) => setDraftConfig({ ...draftConfig, minPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-sky-500 focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-400 block">Excludes stocks priced below this cutoff</span>
                </div>

                {/* Sheet 5 Basket Size */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Sheet5 Basket Allocation Size</label>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{draftConfig.topBasketSize || 60} stocks</span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={draftConfig.topBasketSize || 60}
                    onChange={(e) => setDraftConfig({ ...draftConfig, topBasketSize: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-sky-500 focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-400 block">Default: Top 60 stocks (Sheet5 in Excel)</span>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Advanced Math Expression */}
          {activeTab === 'expression' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                Write a mathematical expression to calculate custom alpha scores. Supports arithmetic operators, parentheses, and built-in functions.
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Formula Expression</label>
                <textarea
                  rows={3}
                  value={draftConfig.customExpression}
                  onChange={(e) => setDraftConfig({ ...draftConfig, mode: 'custom_expression', customExpression: e.target.value })}
                  className="w-full font-mono text-xs p-3 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 focus:ring-sky-500 focus:border-sky-500 focus:outline-none"
                  placeholder="((ret_6m / std_12m) + (ret_12m / std_12m)) / 2"
                />
              </div>

              {/* Variables Cheatsheet */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Available Variables</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700">ret_1m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700">ret_3m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700">ret_6m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700">ret_12m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 border border-slate-700">std_3m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 border border-slate-700">std_6m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 border border-slate-700">std_12m</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 border border-slate-700">current_price</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300 border border-slate-700">sma_50</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300 border border-slate-700">sma_200</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Live Sandbox Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Formula Sandbox & Ticker Test</span>
              <span className="text-[11px] text-slate-400">Verify output before full scan</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={testSymbol}
                onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE, TCS, INFY"
                className="w-48 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono uppercase focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={handleRunSandboxTest}
                disabled={testLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <Play className="w-3 h-3 fill-current text-sky-400" />
                {testLoading ? 'Calculating...' : 'Test Calculation'}
              </button>
            </div>

            {testError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                {testError}
              </div>
            )}

            {testResult && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">{testResult.symbol}.NS Test Output:</span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Base Score: <b className="text-slate-200">{testResult.baseDefaultScore}</b></span>
                    <span className="text-sky-400">Custom Score: <b className="text-sky-300">{testResult.calculatedScore}</b></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <div>Price: <span className="text-slate-200">₹{testResult.metrics.currentPrice}</span></div>
                  <div>6M Return: <span className={testResult.metrics.ret6m >= 0 ? "text-emerald-400" : "text-rose-400"}>{(testResult.metrics.ret6m * 100).toFixed(2)}%</span></div>
                  <div>12M Return: <span className={testResult.metrics.ret12m >= 0 ? "text-emerald-400" : "text-rose-400"}>{(testResult.metrics.ret12m * 100).toFixed(2)}%</span></div>
                  <div>12M Std Dev: <span className="text-indigo-300">{testResult.metrics.std12m.toFixed(5)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Save Preset Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Save preset name (e.g. My Momentum)"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 w-full sm:w-64 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-slate-300 border border-slate-700 transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Preset
              </button>
            </div>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Preset Saved Successfully!
              </span>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#090d16]/60">
          <button
            onClick={handleResetToBase}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Revert to Base Preset
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyDraft}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-500/20"
            >
              Apply Active Formula
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
