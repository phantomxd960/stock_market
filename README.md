# NSE Dual-Horizon Momentum Screener & Formula Studio 🚀

A modern full-stack institutional-grade stock momentum screener designed for the National Stock Exchange of India (NSE). It transforms historical Python spreadsheet scripts into a high-performance web platform built with **TypeScript**, **Node.js/Express**, **JSON**, and **React**.

---

## 📁 Project Architecture & Clean Folder Separation

The project is cleanly split into independent, dedicated folders:

```
NSE_Momentum/
│
├── 📂 backend/                      # Complete TypeScript Node.js Backend API
│   ├── src/
│   │   ├── index.ts                # Express API entry point & routing
│   │   ├── formulaEngine.ts        # Base formula & custom expression evaluator
│   │   ├── scanner.ts              # Parallel Yahoo Finance fetcher & Market Cap engine
│   │   ├── cache.ts                # Daily price cache & preset storage (JSON)
│   │   ├── exporter.ts             # Excel multi-sheet generator (exceljs)
│   │   ├── universes.ts            # Nifty 50, Nifty 100, All NSE loaders
│   │   └── types.ts                # TypeScript interfaces & types
│   ├── data/                       # Local JSON price & preset storage
│   ├── package.json
│   └── tsconfig.json
│
├── 📂 frontend/                     # Modern React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Top navigation, market status, scan triggers
│   │   │   ├── DashboardStats.tsx  # Metrics HUD (Rank #1, Avg returns, universe)
│   │   │   ├── ScreenerTable.tsx   # Interactive tabs for Sheet1, Sheet2, Sheet5 + Market Cap
│   │   │   ├── FormulaStudioModal.tsx # Formula customizer & live sandbox
│   │   │   ├── StockDetailDrawer.tsx  # Market Cap valuation & technical breakdown
│   │   │   └── ScanProgressModal.tsx  # Real-time scan telemetry & progress bar
│   │   ├── services/
│   │   │   └── api.ts              # API client service
│   │   ├── App.tsx                 # Core UI state orchestration
│   │   ├── index.css               # Tailwind CSS & fintech styling
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── 📄 run_app.bat                   # Single-click launcher for Windows
├── 📄 symbols.csv                   # Original NSE equities universe (2,500+ symbols)
├── 📄 momentum_rank.py              # Original Python script (preserved intact)
├── 📄 Momentum_Rank.xlsx            # Generated multi-sheet Excel spreadsheet
└── 📄 README.md
```

---

## ⚡ Quick Start: How to Clone and Run

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/phantomxd960/stock_market.git
cd stock_market
```

### 2. Install Dependencies

You can install dependencies for both frontend and backend with these commands:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Run the Application

#### Option A: One-Click Launcher (Windows)
Double-click **`run_app.bat`** in the root directory. It automatically starts both backend and frontend servers and opens your default browser at `http://localhost:5173`.

#### Option B: Run in Separate Terminals

**Terminal 1 (Backend API)**:
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend UI)**:
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Open **`http://localhost:5173`** in your browser!

---

## 🔒 Base Formula Protection Guarantee

The original mathematical formula from `momentum_rank.py` is preserved as the immutable default:

$$\text{Score} = \frac{1}{2} \left( \frac{\text{Return}_{6M}}{\text{StdDev}_{12M}} + \frac{\text{Return}_{12M}}{\text{StdDev}_{12M}} \right)$$

- **Protected by Default**: Marked **Immutable** with a verified shield. It cannot be accidentally deleted or overwritten.
- **Visual Parameter Customizer**: Tweak 6M/12M weights, add 3M short-term momentum, toggle volatility normalization, or set penny stock cutoffs.
- **Advanced Math Expression Mode**: Write custom mathematical formulas with variables like `ret_6m`, `ret_12m`, `std_12m`, `current_price`, `sma_50`, `sma_200`.
- **Live Sandbox**: Test any formula on any live NSE ticker (e.g. `RELIANCE`, `TCS`, `INFY`) to preview intermediate metrics and scores before scanning.
- **Instant Reset**: One-click **"Reset to Base Formula"** button restores defaults anytime.

---

## 📊 Exact Spreadsheet Parity & Market Cap Integration

The platform retains exact compatibility with the original spreadsheet output:
- **Sheet 2 (Ranked Leaderboard)**: All stocks ranked by Momentum Score descending with `Rank` badges (#1, #2, #3).
- **Sheet 5 (Top 60 Basket)**: Focused portfolio basket with average returns telemetry.
- **Sheet 1 (Raw Universe)**: Full list of processed stocks in raw unranked universe order.
- **Market Capitalization Column**: Displays values in Crores with category badges (**Large Cap**, **Mid Cap**, **Small Cap**, **Micro Cap**).
- **One-Click Download**: Click **"Download Momentum_Rank.xlsx"** to get the styled workbook with all 3 sheets.
