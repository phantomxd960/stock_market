import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, ArrowUpDown, ChevronDown, ChevronUp, FileSpreadsheet, Eye, Info } from 'lucide-react';
import { StockResult } from '../types.js';
import { getExcelDownloadUrl } from '../services/api.js';

interface ScreenerTableProps {
  sheet1: StockResult[];
  sheet2: StockResult[];
  sheet5: StockResult[];
  scanId: string | null;
  onSelectStock: (stock: StockResult) => void;
}

type TabType = 'sheet2' | 'sheet5' | 'sheet1';
type SortField = 'Rank' | 'Symbol' | 'Current Price' | '6M Return (%)' | '12M Return (%)' | 'Std Dev' | 'Momentum Score' | 'Market Cap (Cr)';

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  sheet1,
  sheet2,
  sheet5,
  scanId,
  onSelectStock
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('sheet2');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [capFilter, setCapFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('Rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Whenever tab changes, set intuitive default sorting
  useEffect(() => {
    if (activeTab === 'sheet1') {
      setSortField('Symbol');
      setSortAsc(true);
    } else {
      setSortField('Rank');
      setSortAsc(true);
    }
    setPage(1);
  }, [activeTab]);

  // Active dataset according to tab
  const rawData = useMemo(() => {
    if (activeTab === 'sheet2') return sheet2;
    if (activeTab === 'sheet5') return sheet5;
    return sheet1;
  }, [activeTab, sheet1, sheet2, sheet5]);

  // Filtered and sorted dataset
  const processedData = useMemo(() => {
    let result = rawData.filter(stock => {
      const matchesSearch = stock.Symbol.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesPrice = stock["Current Price"] >= minPrice;
      const matchesCap = capFilter === 'all' || stock["Cap Category"]?.toLowerCase().includes(capFilter.toLowerCase());
      return matchesSearch && matchesPrice && matchesCap;
    });

    result.sort((a, b) => {
      let valA = a[sortField] ?? (sortAsc ? Infinity : -Infinity);
      let valB = b[sortField] ?? (sortAsc ? Infinity : -Infinity);

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [rawData, searchQuery, minPrice, capFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = processedData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'Rank' || field === 'Symbol');
    }
    setPage(1);
  };

  const handleDownloadExcel = () => {
    if (!scanId) {
      alert("Please run a scan first to download the Excel sheet.");
      return;
    }
    window.open(getExcelDownloadUrl(scanId), '_blank');
  };

  const handleExportCSV = () => {
    if (processedData.length === 0) return;
    const headers = Object.keys(processedData[0]).join(',');
    const rows = processedData.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Momentum_Rank_${activeTab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatMarketCap = (mcapCr?: number) => {
    if (!mcapCr || mcapCr <= 0) return '-';
    if (mcapCr >= 100000) {
      return `₹${(mcapCr / 100000).toFixed(2)}L Cr`;
    }
    return `₹${mcapCr.toLocaleString('en-IN')} Cr`;
  };

  const getCapBadgeStyle = (category?: string) => {
    if (!category) return 'bg-slate-800 text-slate-400';
    if (category.includes('Large')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (category.includes('Mid')) return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    if (category.includes('Small')) return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-12">
      
      {/* Top Bar: Tabs & Actions */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0c1220]/60">
        
        {/* Spreadsheet Sheet Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
          <button
            onClick={() => { setActiveTab('sheet2'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sheet2'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Sheet 2 (Ranked Leaderboard)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20">{sheet2.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('sheet5'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sheet5'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Sheet 5 (Top 60 Basket)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20">{sheet5.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('sheet1'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sheet1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Sheet 1 (Raw Universe)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20">{sheet1.length}</span>
          </button>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2.5 self-end">
          <button
            onClick={handleExportCSV}
            disabled={processedData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={!scanId}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20"
            title="Download Momentum_Rank.xlsx with Sheet1, Sheet2, Sheet5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Momentum_Rank.xlsx
          </button>
        </div>

      </div>

      {/* Sheet Context Explainer Pill */}
      <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          {activeTab === 'sheet2' && (
            <span><b>Sheet 2:</b> Stocks ranked from #1 to #{sheet2.length} by <b>Momentum Score</b> descending.</span>
          )}
          {activeTab === 'sheet5' && (
            <span><b>Sheet 5:</b> The <b>Top {sheet5.length}</b> momentum basket for portfolio allocation.</span>
          )}
          {activeTab === 'sheet1' && (
            <span><b>Sheet 1:</b> Raw unranked universe in original evaluation order (without Rank column, matching original Python script).</span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock symbol..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Min Price Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Min Price:</span>
          <select
            value={minPrice}
            onChange={(e) => { setMinPrice(Number(e.target.value)); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="0">All Prices</option>
            <option value="20">₹20+</option>
            <option value="50">₹50+</option>
            <option value="100">₹100+</option>
            <option value="500">₹500+</option>
          </select>
        </div>

        {/* Market Cap Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Market Cap:</span>
          <select
            value={capFilter}
            onChange={(e) => { setCapFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Caps</option>
            <option value="large">Large Cap (₹20,000 Cr+)</option>
            <option value="mid">Mid Cap (₹5,000 - ₹20,000 Cr)</option>
            <option value="small">Small Cap (₹500 - ₹5,000 Cr)</option>
            <option value="micro">Micro Cap (&lt; ₹500 Cr)</option>
          </select>
        </div>

        {/* Count Summary */}
        <div className="text-xs text-slate-400">
          Showing <span className="text-slate-200 font-semibold">{processedData.length}</span> stocks
        </div>

      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#090d16]/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              
              {/* Rank column (shown only in Sheet2 and Sheet5) */}
              {activeTab !== 'sheet1' ? (
                <th onClick={() => handleSort('Rank')} className="py-3 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    {sortField === 'Rank' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
              ) : (
                <th className="py-3 px-4 text-slate-500">#</th>
              )}

              <th onClick={() => handleSort('Symbol')} className="py-3 px-4 cursor-pointer hover:text-white transition">
                <div className="flex items-center gap-1">
                  <span>Symbol</span>
                  {sortField === 'Symbol' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th onClick={() => handleSort('Current Price')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>Current Price</span>
                  {sortField === 'Current Price' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th onClick={() => handleSort('Market Cap (Cr)')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>Market Cap</span>
                  {sortField === 'Market Cap (Cr)' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th className="py-3 px-4 text-right">Price 6M Ago</th>
              <th className="py-3 px-4 text-right">Price 12M Ago</th>

              <th onClick={() => handleSort('6M Return (%)')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>6M Return</span>
                  {sortField === '6M Return (%)' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th onClick={() => handleSort('12M Return (%)')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>12M Return</span>
                  {sortField === '12M Return (%)' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th onClick={() => handleSort('Std Dev')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>Daily Volatility (Std)</span>
                  {sortField === 'Std Dev' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th onClick={() => handleSort('Momentum Score')} className="py-3 px-4 text-right cursor-pointer hover:text-white transition">
                <div className="flex items-center justify-end gap-1">
                  <span>Momentum Score</span>
                  {sortField === 'Momentum Score' ? (sortAsc ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </div>
              </th>

              <th className="py-3 px-4 text-center">Inspect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 font-sans">
                  No stocks match your search or filter criteria. Click "Run Momentum Scan" above to scan.
                </td>
              </tr>
            ) : (
              paginatedData.map((stock, idx) => {
                const is6mPos = stock["6M Return (%)"] >= 0;
                const is12mPos = stock["12M Return (%)"] >= 0;
                const rowIndex = (page - 1) * pageSize + idx + 1;

                return (
                  <tr
                    key={stock.Symbol}
                    onClick={() => onSelectStock(stock)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    {/* Rank / Index */}
                    <td className="py-3 px-4">
                      {activeTab !== 'sheet1' ? (
                        stock.Rank ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                            stock.Rank === 1 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                            stock.Rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/30' :
                            stock.Rank === 3 ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
                            'text-slate-400'
                          }`}>
                            {stock.Rank}
                          </span>
                        ) : <span className="text-slate-600">-</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">{rowIndex}</span>
                      )}
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4 font-bold text-white group-hover:text-sky-400 transition">
                      {stock.Symbol}
                    </td>

                    {/* Current Price */}
                    <td className="py-3 px-4 text-right text-slate-200 font-semibold">
                      ₹{stock["Current Price"].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-slate-200 font-medium">
                          {formatMarketCap(stock["Market Cap (Cr)"])}
                        </span>
                        {stock["Cap Category"] && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${getCapBadgeStyle(stock["Cap Category"])}`}>
                            {stock["Cap Category"]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price 6M */}
                    <td className="py-3 px-4 text-right text-slate-400">
                      ₹{stock["Price 6M Ago"].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Price 12M */}
                    <td className="py-3 px-4 text-right text-slate-400">
                      ₹{stock["Price 12M Ago"].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 6M Return */}
                    <td className={`py-3 px-4 text-right font-semibold ${is6mPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {is6mPos ? `+${stock["6M Return (%)"]}%` : `${stock["6M Return (%)"]}%`}
                    </td>

                    {/* 12M Return */}
                    <td className={`py-3 px-4 text-right font-semibold ${is12mPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {is12mPos ? `+${stock["12M Return (%)"]}%` : `${stock["12M Return (%)"]}%`}
                    </td>

                    {/* Volatility */}
                    <td className="py-3 px-4 text-right text-indigo-300">
                      {stock["Std Dev"].toFixed(5)}
                    </td>

                    {/* Momentum Score */}
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                        {stock["Momentum Score"]}
                      </span>
                    </td>

                    {/* Inspect Trigger */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-[#090d16]/40">
        <div>
          Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};
