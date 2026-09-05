import yfinance as yf

ticker = yf.Ticker("RELIANCE.NS")

hist = ticker.history(period="1mo")

print(hist.tail())