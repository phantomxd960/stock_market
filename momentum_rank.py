import pandas as pd
import yfinance as yf
from tqdm import tqdm

# Load NSE universe
symbols = pd.read_csv("symbols.csv")["Symbol"].tolist()
results = []

for symbol in tqdm(symbols):

    try:
        ticker = f"{symbol}.NS"

        df = yf.download(
            ticker,
            period="18mo",
            auto_adjust=True,
            progress=False
        )

        if len(df) < 252:
            continue

        # Fix MultiIndex issue
        close = df["Close"].squeeze().dropna()

        if len(close) < 252:
            continue

        current_price = float(close.iloc[-1])

        price_6m = float(close.iloc[-126])
        price_12m = float(close.iloc[-252])

        ret_6m = (current_price / price_6m) - 1
        ret_12m = (current_price / price_12m) - 1

        daily_returns = close.pct_change().dropna()

        std_12m = float(daily_returns.tail(252).std())

        if std_12m <= 0:
            continue

        momentum_score = (
            (ret_6m / std_12m)
            + (ret_12m / std_12m)
        ) / 2

        results.append({
            "Symbol": symbol,
            "Current Price": round(current_price, 2),
            "Price 6M Ago": round(price_6m, 2),
            "Price 12M Ago": round(price_12m, 2),
            "6M Return (%)": round(ret_6m * 100, 2),
            "12M Return (%)": round(ret_12m * 100, 2),
            "Std Dev": round(std_12m, 6),
            "Momentum Score": round(momentum_score, 4)
        })

    except Exception as e:
        print(f"{symbol}: {e}")

print(f"\nSuccessfully processed {len(results)} stocks")

if len(results) == 0:
    raise Exception("No stocks processed")

sheet1 = pd.DataFrame(results)

sheet2 = (
    sheet1
    .sort_values("Momentum Score", ascending=False)
    .reset_index(drop=True)
)

sheet2["Rank"] = range(1, len(sheet2) + 1)

sheet5 = sheet2.head(60)

with pd.ExcelWriter(
    "Momentum_Rank.xlsx",
    engine="openpyxl"
) as writer:

    sheet1.to_excel(
        writer,
        sheet_name="Sheet1",
        index=False
    )

    sheet2.to_excel(
        writer,
        sheet_name="Sheet2",
        index=False
    )

    sheet5.to_excel(
        writer,
        sheet_name="Sheet5",
        index=False
    )

print("\nMomentum_Rank.xlsx generated successfully")