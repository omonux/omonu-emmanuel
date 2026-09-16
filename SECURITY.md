# OMONUX Security

- Never commit `.env`, exchange API secrets, OpenAI keys, Gemini keys, or Telegram bot tokens.
- Live trading is disabled unless the server explicitly enables it.
- Use exchange keys with trading-only permissions and withdrawals disabled.
- Start with paper trading and exchange testnet before real funds.
- OMONUX never sends AI output directly to an exchange. AI suggestions must pass the deterministic signal and risk gates.
- API credentials entered in Settings are encrypted at rest with AES-256-GCM.
- Passwords are hashed with Node.js scrypt; sessions are signed JWTs.
- Rotate credentials immediately if they are ever exposed.