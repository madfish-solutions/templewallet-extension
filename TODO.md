## TODO:

- `settings.customNetworks` => `customNetworks: { tezos: {}[], evm: {}[] }`
- Unit tests for EVM accounts in the Vault
- TempleContact. See: `useFilteredContacts()`
- - Migrate
- - To Redux ?
- Tezos Chain ID
- - Warning for incorrect Chain ID value. Require action!
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
- `BG_State.defaultNetworks` to FG
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
- Networks (& contacts) stored in Vault ?
- Block explorers
- Adding localhost RPC
- - What native currency?
-

## TO QA
- Dapps connection, switching account in Confirm window & reflection in other TW pages
- Removing account in 1 window, observing another
- Import Tezos accounts by revealed Private Key
- Search field in account dropdown
-

## SUB-TASKS FOR THIS EPIC
- Import by mnemonic
- Networks for EVM
- Assets & Balances
- Address Book (Contacts)
- Analytics ?
-
