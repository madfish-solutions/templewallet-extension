export const erc1155SeaCreateCloneAbi = {
  inputs: [
    { internalType: 'string', name: 'name', type: 'string' },
    { internalType: 'string', name: 'symbol', type: 'string' },
    { internalType: 'bytes32', name: 'salt', type: 'bytes32' }
  ],
  name: 'createClone',
  outputs: [{ internalType: 'address', name: 'instance', type: 'address' }],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;

export const erc1155SeaMultiConfigureAbi = {
  inputs: [
    { internalType: 'address', name: 'token', type: 'address' },
    {
      components: [
        { internalType: 'uint256[]', name: 'maxSupplyTokenIds', type: 'uint256[]' },
        { internalType: 'uint256[]', name: 'maxSupplyAmounts', type: 'uint256[]' },
        { internalType: 'string', name: 'baseURI', type: 'string' },
        { internalType: 'string', name: 'contractURI', type: 'string' },
        {
          components: [
            { internalType: 'uint80', name: 'startPrice', type: 'uint80' },
            { internalType: 'uint80', name: 'endPrice', type: 'uint80' },
            { internalType: 'uint40', name: 'startTime', type: 'uint40' },
            { internalType: 'uint40', name: 'endTime', type: 'uint40' },
            { internalType: 'bool', name: 'restrictFeeRecipients', type: 'bool' },
            { internalType: 'address', name: 'paymentToken', type: 'address' },
            { internalType: 'uint24', name: 'fromTokenId', type: 'uint24' },
            { internalType: 'uint24', name: 'toTokenId', type: 'uint24' },
            { internalType: 'uint16', name: 'maxTotalMintableByWallet', type: 'uint16' },
            { internalType: 'uint16', name: 'maxTotalMintableByWalletPerToken', type: 'uint16' },
            { internalType: 'uint16', name: 'feeBps', type: 'uint16' }
          ],
          internalType: 'struct PublicDrop[]',
          name: 'publicDrops',
          type: 'tuple[]'
        },
        { internalType: 'uint256[]', name: 'publicDropsIndexes', type: 'uint256[]' },
        { internalType: 'string', name: 'dropURI', type: 'string' },
        {
          components: [
            { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
            { internalType: 'string[]', name: 'publicKeyURIs', type: 'string[]' },
            { internalType: 'string', name: 'allowListURI', type: 'string' }
          ],
          internalType: 'struct AllowListData',
          name: 'allowListData',
          type: 'tuple'
        },
        {
          components: [
            { internalType: 'address', name: 'payoutAddress', type: 'address' },
            { internalType: 'uint16', name: 'basisPoints', type: 'uint16' }
          ],
          internalType: 'struct CreatorPayout[]',
          name: 'creatorPayouts',
          type: 'tuple[]'
        },
        { internalType: 'bytes32', name: 'provenanceHash', type: 'bytes32' },
        { internalType: 'address[]', name: 'allowedFeeRecipients', type: 'address[]' },
        { internalType: 'address[]', name: 'disallowedFeeRecipients', type: 'address[]' },
        { internalType: 'address[]', name: 'allowedPayers', type: 'address[]' },
        { internalType: 'address[]', name: 'disallowedPayers', type: 'address[]' },
        { internalType: 'address[]', name: 'allowedSigners', type: 'address[]' },
        { internalType: 'address[]', name: 'disallowedSigners', type: 'address[]' },
        { internalType: 'address', name: 'royaltyReceiver', type: 'address' },
        { internalType: 'uint96', name: 'royaltyBps', type: 'uint96' },
        { internalType: 'address', name: 'mintRecipient', type: 'address' },
        { internalType: 'uint256[]', name: 'mintTokenIds', type: 'uint256[]' },
        { internalType: 'uint256[]', name: 'mintAmounts', type: 'uint256[]' }
      ],
      internalType: 'struct MultiConfigureStruct',
      name: 'config',
      type: 'tuple'
    }
  ],
  name: 'multiConfigure',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;

export const erc721SeaCreateCloneAbi = {
  inputs: [
    { internalType: 'string', name: 'name', type: 'string' },
    { internalType: 'string', name: 'symbol', type: 'string' },
    { internalType: 'bytes32', name: 'salt', type: 'bytes32' }
  ],
  name: 'createClone',
  outputs: [{ internalType: 'address', name: '', type: 'address' }],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;

export const erc721SeaMultiConfigureAbi = {
  inputs: [
    {
      components: [
        { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
        { internalType: 'string', name: 'baseURI', type: 'string' },
        { internalType: 'string', name: 'contractURI', type: 'string' },
        { internalType: 'address', name: 'seaDropImpl', type: 'address' },
        {
          components: [
            { internalType: 'uint80', name: 'mintPrice', type: 'uint80' },
            { internalType: 'uint48', name: 'startTime', type: 'uint48' },
            { internalType: 'uint48', name: 'endTime', type: 'uint48' },
            { internalType: 'uint16', name: 'maxTotalMintableByWallet', type: 'uint16' },
            { internalType: 'uint16', name: 'feeBps', type: 'uint16' },
            { internalType: 'bool', name: 'restrictFeeRecipients', type: 'bool' }
          ],
          internalType: 'struct PublicDrop',
          name: 'publicDrop',
          type: 'tuple'
        },
        { internalType: 'string', name: 'dropURI', type: 'string' },
        {
          components: [
            { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
            { internalType: 'string[]', name: 'publicKeyURIs', type: 'string[]' },
            { internalType: 'string', name: 'allowListURI', type: 'string' }
          ],
          internalType: 'struct AllowListData',
          name: 'allowListData',
          type: 'tuple'
        },
        { internalType: 'address', name: 'creatorPayoutAddress', type: 'address' },
        { internalType: 'bytes32', name: 'provenanceHash', type: 'bytes32' },
        { internalType: 'address[]', name: 'allowedFeeRecipients', type: 'address[]' },
        { internalType: 'address[]', name: 'disallowedFeeRecipients', type: 'address[]' },
        { internalType: 'address[]', name: 'allowedPayers', type: 'address[]' },
        { internalType: 'address[]', name: 'disallowedPayers', type: 'address[]' },
        { internalType: 'address[]', name: 'tokenGatedAllowedNftTokens', type: 'address[]' },
        {
          components: [
            { internalType: 'uint80', name: 'mintPrice', type: 'uint80' },
            { internalType: 'uint16', name: 'maxTotalMintableByWallet', type: 'uint16' },
            { internalType: 'uint48', name: 'startTime', type: 'uint48' },
            { internalType: 'uint48', name: 'endTime', type: 'uint48' },
            { internalType: 'uint8', name: 'dropStageIndex', type: 'uint8' },
            { internalType: 'uint32', name: 'maxTokenSupplyForStage', type: 'uint32' },
            { internalType: 'uint16', name: 'feeBps', type: 'uint16' },
            { internalType: 'bool', name: 'restrictFeeRecipients', type: 'bool' }
          ],
          internalType: 'struct TokenGatedDropStage[]',
          name: 'tokenGatedDropStages',
          type: 'tuple[]'
        },
        { internalType: 'address[]', name: 'disallowedTokenGatedAllowedNftTokens', type: 'address[]' },
        { internalType: 'address[]', name: 'signers', type: 'address[]' },
        {
          components: [
            { internalType: 'uint80', name: 'minMintPrice', type: 'uint80' },
            { internalType: 'uint24', name: 'maxMaxTotalMintableByWallet', type: 'uint24' },
            { internalType: 'uint40', name: 'minStartTime', type: 'uint40' },
            { internalType: 'uint40', name: 'maxEndTime', type: 'uint40' },
            { internalType: 'uint40', name: 'maxMaxTokenSupplyForStage', type: 'uint40' },
            { internalType: 'uint16', name: 'minFeeBps', type: 'uint16' },
            { internalType: 'uint16', name: 'maxFeeBps', type: 'uint16' }
          ],
          internalType: 'struct SignedMintValidationParams[]',
          name: 'signedMintValidationParams',
          type: 'tuple[]'
        },
        { internalType: 'address[]', name: 'disallowedSigners', type: 'address[]' }
      ],
      internalType: 'struct ERC721SeaDropStructsErrorsAndEvents.MultiConfigureStruct',
      name: 'config',
      type: 'tuple'
    }
  ],
  name: 'multiConfigure',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;
