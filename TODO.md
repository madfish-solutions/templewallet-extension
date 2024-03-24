## TODO:

- Branch for current epic
- - Code quality checks for targetting /TW-(d+)-epic-/
- Import watch-only EVM account
- Move `useAccountForChain()` under `constate`
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
- Remove Vault legacy code if versions usage stats allows
- [E2E] Picking accounts by `...setAnotherSelector('hash',` - accomodate to EVM
- Multilanguage support
- Collect all storage keys in a single record
- Move deps-less callbacks out of `lib/temple/client.ts` to a module ?
-


## DONE

- Installed `viem`
- - Had to update TS & some other deps
- Derivation for EVM: `addressIndex` instead of `accountIndex`
- `getTezosAccountAddressForAdsImpressions()`
- '(Internal) Confirm' pages
- Change of logic in `Vault.createHDAccount()`
-


## NOTES

- Import by mnemonic
- - Old accounts are Tezos only
- - New will be Tezos + EVM
- - - Make sure, they are Tezos + EVM + any other new chain
- Watch-only accounts' addresses in ads' analytics
- Selected account will reset to 1st after update
- Creating account when imported exists is allowed. Reverse is not.
-

## QUESTIONS

-
- Is `nanoid()` good enough to id accounts ?
- `bip39` -> `@scure/bip39` ?
- `loadContract('', FALSE)` - why?
-

## TO QA
- Dapps connection, switching account in Confirm window & reflection in other TW pages
- Removing account in 1 window, observing another
- Import Tezos accounts by revealed Private Key
-

## SUB-TASKS FOR THIS EPIC
- Import by mnemonic
- Networks for EVM
- Assets & Balances
- Address Book (Contacts)
- Analytics ?
-
