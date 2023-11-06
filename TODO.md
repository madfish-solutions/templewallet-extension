- `TokenMetadata.slug: string`
- TTL for metadata (only NFTs but permanent for tokens) ?
- `string` type for assets IDs
- `name` & `symbol` separate from the list ?
- - `decimals` in `StoredCollectible` (`StoredAsset`) ?
- `state.assets.(tokens | collectibles)` -> `state.(tokens | collectibles).list`
- Metadata of `KT1EJ1KpvY1oVQVE5fw2W3JjsDWTkEhbYbwm_0` NFT in `tz1Up3Uyj6PR3AkdsaXouhhetS3VdaTkW2Ro` not loaded first in a grid
- Metadata not saved:
- -
```
[
    {
        "token_id": "60647227302664615325913119628031559479582655750948523112727551013755190398655",
        "artifactUri": "ipfs://QmSqNK77X9RVdKnbQUBs1uV6UDf7DjBqAZFQWiTSgJGfuM",
        "attributes": [
            {
                "name": "Hat",
                "value": "🔥"
            },
            {
                "name": "Glasses",
                "value": "🙀"
            },
            {
                "name": "Body",
                "value": "🍎"
            },
            {
                "name": "Arm",
                "value": "📺"
            },
            {
                "name": "Hand",
                "value": "🎳"
            },
            {
                "name": "Bottom",
                "value": "🟦"
            },
            {
                "name": "Top",
                "value": "🌫"
            },
            {
                "name": "Background",
                "value": "🌸"
            }
        ],
        "creators": [
            "tz1iZ2TPEShFC8TqHsXLA9RXdV7tSv8E3aLe"
        ],
        "decimals": 0,
        "description": "randomly generated skeleton .gif by john karel.\ncoding by objkt.com",
        "displayUri": "ipfs://QmSqNK77X9RVdKnbQUBs1uV6UDf7DjBqAZFQWiTSgJGfuM",
        "formats": [
            {
                "dimensions": {
                    "unit": "px",
                    "value": "500x500"
                },
                "fileSize": 3892085,
                "mimeType": "image/gif",
                "uri": "ipfs://QmSqNK77X9RVdKnbQUBs1uV6UDf7DjBqAZFQWiTSgJGfuM"
            },
            {
                "dimensions": {
                    "unit": "px",
                    "value": "350x350"
                },
                "fileSize": 68330,
                "mimeType": "image/gif",
                "uri": "ipfs://QmRPKXVXNQ9yePokGL7ondbdebXaP931bEjChX5P5gTsEV"
            }
        ],
        "isBooleanAmount": true,
        "name": "🔥🙀🍎📺🎳🟦🌫🌸",
        "rights": "(c) John Karel. All rights reserved",
        "royalties": {
            "decimals": 2,
            "shares": {
                "tz1iZ2TPEShFC8TqHsXLA9RXdV7tSv8E3aLe": 5
            }
        },
        "symbol": "SKELE",
        "tags": [
            "common",
            "skele",
            "jjjjjohn",
            "gif"
        ],
        "thumbnailUri": "ipfs://QmRPKXVXNQ9yePokGL7ondbdebXaP931bEjChX5P5gTsEV",
        "standard": "fa2"
    },
    {
        "token_id": "23297919753282847535541606718792103475841791340440509726905358144380284981051",
        "artifactUri": "ipfs://QmbRgbT7YrNQcSZf1RSuXGmostriPJtc8mFr9MdbxbQzhm",
        "attributes": [
            {
                "name": "Hat",
                "value": "🗑"
            },
            {
                "name": "Glasses",
                "value": "💚"
            },
            {
                "name": "Body",
                "value": "☠"
            },
            {
                "name": "Arm",
                "value": "🥚"
            },
            {
                "name": "Hand",
                "value": "📞"
            },
            {
                "name": "Bottom",
                "value": "🥜"
            },
            {
                "name": "Top",
                "value": "🍍"
            },
            {
                "name": "Background",
                "value": "🐨"
            }
        ],
        "creators": [
            "tz1iZ2TPEShFC8TqHsXLA9RXdV7tSv8E3aLe"
        ],
        "decimals": 0,
        "description": "randomly generated skeleton .gif by john karel.\ncoding by objkt.com",
        "displayUri": "ipfs://QmbRgbT7YrNQcSZf1RSuXGmostriPJtc8mFr9MdbxbQzhm",
        "formats": [
            {
                "dimensions": {
                    "unit": "px",
                    "value": "500x500"
                },
                "fileSize": 6511087,
                "mimeType": "image/gif",
                "uri": "ipfs://QmbRgbT7YrNQcSZf1RSuXGmostriPJtc8mFr9MdbxbQzhm"
            },
            {
                "dimensions": {
                    "unit": "px",
                    "value": "350x350"
                },
                "fileSize": 86309,
                "mimeType": "image/gif",
                "uri": "ipfs://QmdTdaayW8ipPrXLACC6v2bewsrt8fvbWV6KbuhUbDZiEr"
            }
        ],
        "isBooleanAmount": true,
        "name": "🗑💚☠🥚📞🥜🍍🐨",
        "rights": "(c) John Karel. All rights reserved",
        "royalties": {
            "decimals": 2,
            "shares": {
                "tz1iZ2TPEShFC8TqHsXLA9RXdV7tSv8E3aLe": 5
            }
        },
        "symbol": "SKELE",
        "tags": [
            "common",
            "skele",
            "jjjjjohn",
            "gif"
        ],
        "thumbnailUri": "ipfs://QmdTdaayW8ipPrXLACC6v2bewsrt8fvbWV6KbuhUbDZiEr",
        "standard": "fa2"
    }
]
```
--
--
--
