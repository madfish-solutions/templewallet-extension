## TODO:

- Branch for current epic
- Import watch-only EVM account
- TempleContact. See: `useFilteredContacts()`
- - Migrate
- - To Redux ?
- Tezos Chain ID
- - Not depend on useChainId suspensed
- - Deal with 'MondayNet' & 'DailyNet' (Chain ID)
- - Make sure RPC can be changed, when chainId not available
- - Cache `loadTezosChainId()` @ BG
- - Value when sending analytics
- - Migration ?
- - Move `<WithDataLoading>` to PageLayout ?
- -
- Reform `lib/temple`
- - `lib/temple/back` -> `background`
- -
- CustomRpcContext now only passes Tezos RPC URL - accommodate for EVM RPC too
- Get rid of redundant `addLocalOperation` & `lib/temple/activity(-new)` -> `temple/history`
- Rework analytics (properties) - breaking change
- - EVM creds (chain ID, address ...)
- - Category separation
- Check usage of `useAllAccounts()`
- Remove Vault legacy code if versions usage stats allows
- [E2E] Picking accounts by `...setAnotherSelector('hash',` - accomodate to EVM
-


## DONE

- Installed `viem`
- - Had to update TS & some other deps
- Derivation for EVM: `addressIndex` instead of `accountIndex`
- `getTezosAccountAddressForAdsImpressions()`
- '(Internal) Confirm' pages
- Change of logic in `Vault.createHDAccount()`
-


## NOTES:

- Import by mnemonic
- - Old accounts are Tezos only
- - New will be Tezos + EVM
- - - Make sure, they are Tezos + EVM + any other new chain
- Watch-only accounts' addresses in ads' analytics
- Selected account will reset to 1st after update
- Creating account when imported exists is now allowed. Reverse is not.
-

## QUESTIONS

-
- Is `nanoid()` good enough to id accounts ?
- `bip39` -> `@scure/bip39` ?
-

## TO QA
- Dapps connection, switching account in Confirm window & reflection in other TW pages
- Removing account in 1 window, observing another
- Import Tezos accounts by revealed Private Key
-

## TASKS
- Import by mnemonic
- Networks
- Assets & Balances
- Analytics
-
