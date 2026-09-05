import pandas as pd

url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

df = pd.read_csv(url)

symbols = df["SYMBOL"].dropna().unique()

pd.DataFrame({"Symbol": symbols}).to_csv(
    "symbols.csv",
    index=False
)

print(f"Saved {len(symbols)} symbols to symbols.csv")