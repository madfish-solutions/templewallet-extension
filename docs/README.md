# Documentation

These docs relate to how Thanos Wallet works.

## Architecture

Application has three sides: UI scripts, one Background script and Content script that injected in every user page.

![Highlevel architecture](highlevel-architecture.jpeg)

All communications in the application work through the internal `Intercom` module. It's a wrapper over native means of communication in the browser extension.

### Background Script

- Only one per application. It starts as soon as the browser is started and runs until the browser closes.
- Listenes requests from UI scripts and Content script. Can broadcast messages to them and also notify directly.

### Actions

- Top-level function set.
- Works with Store, browser API and can call the methods of the current Vault instance.

### Store

- Very simple in-memory store by [Effector](https://github.com/zerobias/effector). Aims at displaying of current state of the wallet.
- Has a public version of its state, which Front-End can request at any time.
- Events: `inited`, `locked`, `unlocked`, `accountsUpdated`, `settingsUpdated`.

### Vault

- A class describing general wallet behavior.
- A instance of it creates during initialization, and stored in the state of `Store`. One instance per one wallet (one seed-phrase etc).
- Contains only one property: `passKey` - private, typeof CryptoKey, byte projection of the user's password.
- Manages all sensitive data: encrypts/decrypts, stores, deletes.
- Methods that require a mandatory password are static so that they don't have access to an already existing key from the context.
- Also implements migrations because works with the storage.

## DApps

To communicate with DApps, the wallet inherits the behavior of the [tzip10](https://gitlab.com/tzip/tzip/-/blob/master/proposals/tzip-10/tzip-10.md) standard: first - permissions, then - transaction requests.

## Transaction flow

The image below shows how DApp transactions are processed.

![Transaction flow](transaction-flow.jpeg)

Internal transactions (inside wallet) works by the same way, but with minimal technical differences.
