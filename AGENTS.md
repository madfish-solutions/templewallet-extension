# AGENTS.md - Working Effectively In This Repo

This repository is the Temple Wallet browser extension codebase. Temple Wallet is an open-source multichain wallet for Tezos & EVM-compatible blockchains, focusing on security and seamless UX. Optimize for clarity, polish, and performance in every change.

## Core Tenets (Do Not Violate)
1. Polish is a feature. Visual and interaction quality matter as much as correctness.
2. Performance is a feature. Avoid UI hitches, excessive main-thread work and unnecessary re-rendering.
3. Stay aligned with the existing architecture. Prefer small, targeted improvements over new abstractions.
4. Do not quietly change security-sensitive behavior. Call it out.

## Tech Stack
- React 19
- TypeScript
- Redux Toolkit
- Tailwind CSS 4
- Webpack 5

## Commands
- `yarn start`: Dev build / watch
- `yarn build`: Production build (zips output)
- `yarn test`: Run unit tests (prefer single test files for speed)
- `yarn ts`: Run the typechecker
- `yarn lint`: Run the linter

## Code Style
- See `src/app/atoms/IconBase.tsx` for canonical component structure
- Avoid repetitive code (DRY principle)
- Break down large components into smaller, focused sub-components
- Use early returns to reduce nesting
- Add comments for complex logic only

## TypeScript
- Enforce proper typing (avoid `any` unless absolutely necessary)
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Use type aliases for complex types
- Leverage union types and discriminated unions

## State Management
- Migrations are mandatory for persisted state changes

## A Note To The Agent
We are building this together. When you learn something non-obvious, add it here so future changes go faster.
