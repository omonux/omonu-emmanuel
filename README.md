# OMONUX — Real Auto-Trading Engine

OMONUX is an AutoTrade-first crypto spot trading application: **real market data → deterministic signal engine → optional OpenAI/Gemini analysis → risk gate → paper/live execution → position monitoring → audit trail**.

## What is real
- Real Binance public OHLCV market data and closed 30-minute candles.
- Binance Spot and Bybit Spot signed REST execution adapters.
- Paper ledger with risk-based sizing, P/L and SL/TP monitoring.
- Live trading safety gate: disabled by default, explicit confirmation, exchange credentials required.
- OpenAI Responses API and Google Gemini `generateContent` chart/signal analysis when keys are configured.
- AES-256-GCM encrypted per-user credentials, scrypt password hashing, signed sessions, rate limiting and security headers.
- Telegram notifications through the Bot API.

## Safety
Keep `LIVE_TRADING_ENABLED=false` until paper trading and exchange testnet checks pass. Use API keys with trading permission only and withdrawals disabled. AI output never bypasses deterministic risk/execution gates.

## Run
```bash
cp .env.example .env
npm install
npm start
```
Open `http://localhost:4000`.

## AI keys
Set `OPENAI_API_KEY` and/or `GEMINI_API_KEY` in `.env`, or connect provider keys from OMONUX Settings. **Never commit `.env`.**

## Live trading
Live trading requires all of:
1. `LIVE_TRADING_ENABLED=true` on the server.
2. A supported exchange credential connected.
3. AutoTrade mode set to Live.
4. The exact confirmation phrase entered to arm the account.
5. Risk gates still passing every cycle.

OMONUX is spot-only in this version: live entries are BUY orders; SELL orders are used to close owned spot inventory.

## Tests
```bash
npm test
```

Trading involves real financial risk. No strategy or AI model can guarantee profit.