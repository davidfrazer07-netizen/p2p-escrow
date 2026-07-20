# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Model routing for this project

Per `/Users/mac/CLAUDE.md`: all drafting/coding for this project is done by the OpenRouter free tier (`tencent/hy3:free` by explicit request), routed via `mcp__openrouter__openrouter_chat`. Claude verifies HY3's output against the task, fixes only what's wrong, and does not redraft from scratch.

# What this project is

A P2P USD/INR-vs-crypto escrow marketplace (classifieds/order-book style, no market price — buyer and seller each state their own price). No on-platform wallet/custody: the platform is a reputation + manual-approval layer, not a funds custodian. Every completed trade requires sign-off from one of five admin approvers. All escrow chats are visible to admins. KYC (email, phone, ID proof) is required to register.

Regulatory note: this touches money-transmission/exchange regulation in India (RBI/FEMA/PMLA). The Terms/Privacy pages in this repo are drafts, not legal advice — do not treat them as sufficient without an actual lawyer's review before handling real transactions.
