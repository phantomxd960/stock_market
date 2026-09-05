import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.js';
import { DashboardStats } from './components/DashboardStats.js';
import { ScreenerTable } from './components/ScreenerTable.js';
import { FormulaStudioModal } from './components/FormulaStudioModal.js';
import { StockDetailDrawer } from './components/StockDetailDrawer.js';
import { ScanProgressModal } from './components/ScanProgressModal.js';
import { FormulaConfig, ScanProgress, StockResult, UniverseInfo } from './types.js';
import {
  fetchUniverses,
  fetchFormulas,
  startStockScan,
  getScanProgress,
  fetchScanResults,
  fetchLatestScanResults,
  cancelScan
} from './services/api.js';

export const App: React.FC = () => {
  // Universes & Formulas
  const [universes, setUniverses] = useState<UniverseInfo[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('nifty_50');
  const [allFormulas, setAllFormulas] = useState<FormulaConfig[]>([]);
  const [activeFormula, setActiveFormula] = useState<FormulaConfig | null>(null);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Results state
  const [sheet1, setSheet1] = useState<StockResult[]>([]);
  const [sheet2, setSheet2] = useState<StockResult[]>([]);
  const [sheet5, setSheet5] = useState<StockResult[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);

  // Modals & Drawers
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState<StockResult | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Load initial data
  useEffect(() => {
    // 1. Fetch Universes
    fetchUniverses().then(data => {
      setUniverses(data);
      if (data.length > 0) {
        setSelectedUniverseId(data[0].id);
      }
    }).catch(err => console.error("Error fetching universes:", err));

    // 2. Fetch Formulas & set Base Formula default
    fetchFormulas().then(data => {
      setAllFormulas(data);
      const base = data.find(f => f.isBase) || data[0];
      setActiveFormula(base);
    }).catch(err => console.error("Error fetching formulas:", err));

    // 3. Load latest scan if already executed
    fetchLatestScanResults().then(res => {
      if (res) {
        setCurrentScanId(res.scanId);
        setSheet1(res.sheet1 || []);
        setSheet2(res.sheet2 || []);
        setSheet5(res.sheet5 || []);
        setTotalProcessed(res.totalProcessed || 0);
      }
    }).catch(() => {});
  }, []);

  const refreshPresets = () => {
    fetchFormulas().then(setAllFormulas).catch(console.error);
  };

  // Start new scan
  const handleStartScan = async () => {
    if (!activeFormula) return;
    setIsScanning(true);
    setShowProgressModal(true);

    try {
      const { scanId } = await startStockScan(selectedUniverseId, activeFormula);
      setCurrentScanId(scanId);

      // Poll progress every 500ms
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const progress = await getScanProgress(scanId);
          setScanProgress(progress);

          if (progress.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setIsScanning(false);
            
            // Fetch final results
            const results = await fetchScanResults(scanId);
            setSheet1(results.sheet1);
            setSheet2(results.sheet2);
            setSheet5(results.sheet5);
            setTotalProcessed(results.totalProcessed);

            setTimeout(() => {
              setShowProgressModal(false);
            }, 1000);
          } else if (progress.status === 'failed' || progress.status === 'cancelled') {
            clearInterval(pollIntervalRef.current);
            setIsScanning(false);
            setTimeout(() => setShowProgressModal(false), 1200);
          }
        } catch (e) {
          console.error("Progress check error:", e);
        }
      }, 500);

    } catch (err: any) {
      alert(err.message || "Failed to initiate scan");
      setIsScanning(false);
      setShowProgressModal(false);
    }
  };

  const handleCancelScan = async () => {
    if (currentScanId) {
      await cancelScan(currentScanId);
    }
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsScanning(false);
    setShowProgressModal(false);
  };

  const currentUniverseName = universes.find(u => u.id === selectedUniverseId)?.name || 'Nifty 50';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* Navbar */}
      {activeFormula && (
        <Navbar
          universes={universes}
          selectedUniverseId={selectedUniverseId}
          onSelectUniverse={setSelectedUniverseId}
          activeFormula={activeFormula}
          onOpenFormulaStudio={() => setIsFormulaModalOpen(true)}
          onStartScan={handleStartScan}
          isScanning={isScanning}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* Dashboard Stats */}
        <DashboardStats
          sheet2={sheet2}
          sheet5={sheet5}
          universeName={currentUniverseName}
          totalProcessed={totalProcessed}
        />

        {/* Screener Tables (Sheet1, Sheet2, Sheet5) */}
        <ScreenerTable
          sheet1={sheet1}
          sheet2={sheet2}
          sheet5={sheet5}
          scanId={currentScanId}
          onSelectStock={(stock) => setSelectedStockForDetail(stock)}
        />

      </main>

      {/* Formula Studio Modal */}
      {activeFormula && (
        <FormulaStudioModal
          isOpen={isFormulaModalOpen}
          onClose={() => setIsFormulaModalOpen(false)}
          activeFormula={activeFormula}
          allPresets={allFormulas}
          onSelectFormula={(f) => setActiveFormula(f)}
          onRefreshPresets={refreshPresets}
        />
      )}

      {/* Stock Detail & Chart Drawer */}
      <StockDetailDrawer
        stock={selectedStockForDetail}
        onClose={() => setSelectedStockForDetail(null)}
      />

      {/* Real-time Scan Progress Modal */}
      <ScanProgressModal
        isOpen={showProgressModal}
        progress={scanProgress}
        onCancel={handleCancelScan}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#070a10]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NSE Momentum Screener Full-Stack Edition &bull; Protected Dual-Horizon Algorithm</span>
          <span>Exports exact multi-sheet format: Sheet1 (Raw), Sheet2 (Ranked), Sheet5 (Top 60)</span>
        </div>
      </footer>

    </div>
  );
};

export default App;
