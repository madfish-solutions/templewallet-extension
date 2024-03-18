## TODO:

- Import watch-only EVM account
- Usage of `useAccount().publicKeyHash`
- - With `useTezosAccount` hook
- Tezos Chain ID
- - Deal with 'MondayNet' & 'DailyNet' (Chain ID)
- - Make sure RPC can be changed, when chainId not available
- - Cache `loadTezosChainId()` @ BG
- - Value when sending analytics
- - Migration ?
- -
- Reform `lib/temple`
- - `lib/temple/back` -> `background`
- -
- - Move `<WithDataLoading>` to PageLayout
- - Not depend on useChainId suspensed
- CustomRpcContext now only passes Tezos RPC URL - accommodate for EVM RPC too
- Get rid of redundant `addLocalOperation` & `lib/temple/activity(-new)` -> `temple/history`
- Rework analytics (properties) - breaking change
- - EVM creds (chain ID, address ...)
- - Category separation
- Contacts to Redux
- - See `useFilteredContacts`
- Finalize `useAccount` hooks
- `StoredAccount['publicKeyHash' -> 'tezAddress']`
- - Current by index ?
- - `StoredWatchOnlyAccount.address`
- Remove Vault legacy code if versions usage stats allows
-


## DONE

- Installed `viem`
- - Had to update TS & some other deps
-


## NOTES:

- Import by mnemonic
- - Old accounts are Tezos only
- - New will be Tezos + EVM
- - - Make sure, they are Tezos + EVM + any other new chain
- Watch-only accounts' addresses in ads' analytics
-

## QUESTIONS

- Do we id selected account by Tezos PKH ?
- `bip39` -> `@scure/bip39` ?
-
