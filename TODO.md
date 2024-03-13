## TODO:

- Reform `lib/temple`
- - `lib/temple/back` -> `background`
- -
- Make sure RPC can be changed, when chainId not available
- - Move `<WithDataLoading>` to PageLayout
- - Not depend on useChainId suspensed
- CustomRpcContext now only passes Tezos RPC URL - accommodate for EVM RPC too
- Get rid of redundant `addLocalOperation` & `lib/temple/activity(-new)` -> `temple/history`
- Memoize `loadTezosChainId()` @ BG
- Rework analytics (properties) - breaking change
- - Category separation
- Contacts to Redux
- - See `useFilteredContacts`
-


## DONE

- TempleAccount -> StoredAccount
- useTezos${Network | Account | ...} hooks
- Started reforming `lib/temple`
- `TEZOS_BLOCK_DURATION`
-
