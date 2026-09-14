# OMONUX Security

- Never commit `.env`, exchange secrets, OpenAI keys, Gemini keys, or Telegram tokens.
- Live trading is disabled by default and requires an explicit server flag plus an account arming phrase.
- Use exchange API keys with trading permission only; keep withdrawals disabled.
- Start with paper trading and exchange testnet before real funds.
- AI output never directly bypasses deterministic signal/risk gates.
- Credentials entered by authenticated users are encrypted at rest with AES-256-GCM.
- Passwords are hashed with scrypt and sessions are signed JWTs.
- Rotate credentials immediately if exposed.
