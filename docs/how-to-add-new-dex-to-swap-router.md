You will need those 2 repos:

- [swap-router-sdk](https://github.com/madfish-solutions/swap-router-sdk)
- [tezos-dexes-api](https://github.com/madfish-solutions/tezos-dexes-api) (You can use [Smart Websocket Client](https://chrome.google.com/webstore/detail/smart-websocket-client/omalebghpgejjiaoknljcfmglgbpocdp) for debug)

plus:

- website of the Dex that you want to add
- [block explorer](https://tzkt.io/)

1. Open dex, connect Temple Wallet and try to make test swap (you don't need to confirm the operation).
2. On Confirm operation page choose Raw payload and copy it.
   You will get something like this :

```bash
{
  "branch";
:
  "BL5Z4AmZp9cMPttRQXuJDbsz2uHMRrKGZHoCvh5Kr9mr7ccpGwH", "contents";
:
  [{
    "kind": "transaction",
    "source": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL",
    "fee": "661",
    "counter": "18761477",
    "gas_limit": "2918",
    "storage_limit": "0",
    "amount": "0",
    "destination": "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
    "parameters": {
      "entrypoint": "update_operators",
      "value": [{
        "prim": "Left",
        "args": [{
          "prim": "Pair",
          "args": [{ "string": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL" }, {
            "prim": "Pair",
            "args": [{ "string": "KT1VNEzpf631BLsdPJjt2ZhgUitR392x6cSi" }, { "int": "1" }]
          }]
        }]
      }]
    }
  }, {
    "kind": "transaction",
    "source": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL",
    "fee": "1153",
    "counter": "18761478",
    "gas_limit": "7845",
    "storage_limit": "0",
    "amount": "1000000",
    "destination": "KT1UMAE2PBskeQayP5f2ZbGiVYF7h8bZ2gyp",
    "parameters": {
      "entrypoint": "tezToTokenPayment",
      "value": {
        "prim": "Pair",
        "args": [{ "int": "2222572041392285577" }, { "string": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL" }]
      }
    }
  }, {
    "kind": "transaction",
    "source": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL",
    "fee": "2319",
    "counter": "18761479",
    "gas_limit": "19503",
    "storage_limit": "1000",
    "amount": "0",
    "destination": "KT1VNEzpf631BLsdPJjt2ZhgUitR392x6cSi",
    "parameters": {
      "entrypoint": "swap",
      "value": {
        "prim": "Pair",
        "args": [[{
          "prim": "Pair",
          "args": [{ "prim": "Left", "args": [{ "prim": "Unit" }] }, { "int": "36" }]
        }], {
          "prim": "Pair",
          "args": [{ "int": "2222572041392285577" }, {
            "prim": "Pair",
            "args": [{ "int": "1883320" }, {
              "prim": "Pair",
              "args": [{ "string": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL" }, { "string": "1652193014" }]
            }]
          }]
        }]
      }
    }
  }, {
    "kind": "transaction",
    "source": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL",
    "fee": "658",
    "counter": "18761480",
    "gas_limit": "2888",
    "storage_limit": "0",
    "amount": "0",
    "destination": "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
    "parameters": {
      "entrypoint": "update_operators",
      "value": [{
        "prim": "Right",
        "args": [{
          "prim": "Pair",
          "args": [{ "string": "tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL" }, {
            "prim": "Pair",
            "args": [{ "string": "KT1VNEzpf631BLsdPJjt2ZhgUitR392x6cSi" }, { "int": "1" }]
          }]
        }]
      }]
    }
  }];
}

```

3. Find object with entrypoint property set to "tezos_to_token" or "token_to_tezos"(it could also be something like "
   tezToTokenPayment", like in example above). You need the "destination" property of this object. Copy it.
4. Go to block explorer and search for this string.

5. If contract was created by factory(skip if no):
    1. Click on factory contract.
    2. Open Storage page
    3. Open tezos-dexes-api
    4. Open src/dexes folder and create new folder for new dex.
    5. Copy files from vortex folder to yours.
    6. Add env variables to .env.dist and src/config.ts by analogy.
    7. Use this variables in src/dexes/new_dex_name/dex-pair.utils.ts
    8. Open src/dexes/new_dex_name/shared/dex-pair.utils.ts
    9. Replace VortexFactoryStorage interface with new interface. (look at contract storage info at block explorer)
    10. Go to src/dexes/new_dex_name/shared/route-pair.utils.ts
    11. Replace VortexDexStorageInterface (also look at storage info)
    12. Fix ts errors (its just variable naming)
    13. Add new dex to src/enums/dex-type.enum.ts, src/utils/dex-pairs.utils.ts and src/utils/route-pair.utils.ts
    14. Go to src/dexes/vortex/shared/dex-pair.utils.ts and log "dexAddresses" variable.
    15. Copy and paste to the same folder .env.dist and rename it to just .env
    16. Enter contract addresses to the variables that you created and change 
    ```bash
    RPC_URL=https://mainnet-node.madfish.solutions
    PORT=3001.
    ```
    18. Run
    ```bash
   yarn start
    ```
    19. Look at dexAddresses items in console and change dexAddresses variable type in src/dexes/vortex/shared/dex-pair.utils.ts.
    20. Fix ts and remove logs
    21. Don't forget to change the names of all functions and variables by analogy.
    22. Update Readme file.

6. If contract wasn't create by factory:
    1. Try to make swap with all pairs that you need to add and copy all dex contact addresses ('destinations')
    2. Open Storage page of any dex contract
    3. Open tezos-dexes-api
    4. Open src/dexes folder and create new folder for new dex.
    5. Copy files from youves folder to yours.
    6. Add env variable to .env.dist and src/config.ts by analogy.
    7. Use this variable in src/dexes/new_dex_name/dex-pair.utils.ts
    9. Replace YouvesDexStorageInterface interface with new interface. (look at contract storage info at block explorer)
    10. Go to src/dexes/new_dex_name/route-pair.utils.ts and fix ts errors.
    11. Add new dex to src/enums/dex-type.enum.ts, src/utils/dex-pairs.utils.ts and src/utils/route-pair.utils.ts
    12. Copy and paste to the same folder .env.dist and rename it to just .env
    13. Enter contract addresses to the variables that you created and change
    ```bash
   RPC_URL=https://mainnet-node.madfish.solutions
   PORT=3001.
    ```
    14. Run 
    ```bash
   yarn start
    ```
    15. Don't forget to change the names of all functions and variables by analogy.
    16. Update Readme file.

8. Open "entrypoints" page of contract address on block explorer.
9. Open swap-router-sdk.
10. Create folder for new dex here src/dexes/
11. Copy files from vortex folder to yours.

12. Look at entrypoints of the contract and change
    src/dexes/new_dex_name/interfaces/new_dex_name.contract-abstraction.interface.ts
13. Replace VortexContractAbstraction in src/dexes/new_dex_name/utils/transfer-params.utils.ts with your new interface.
14. fix ts errors.
15. add new dex to src/enum/dex-type.enum.ts and src/utils/op-params.utils.ts by analogy.
16. Change package version on package.json.
17. Update readme file.

Don't forget to add new dex to main project (Temple wallet extension/mobile) list of dexes and new dex icon.
