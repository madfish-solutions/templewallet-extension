export type AssetMetadata = {
  // Common
  decimals: number;
  symbol: string;
  name: string;

  // [default: false]
  // Allows wallets to decide whether or not a symbol should be displayed
  // in place of a name.
  shouldPreferSymbol?: boolean;

  // [format: uri-reference]
  // A URI to an image of the asset for wallets and client applications
  // to have a scaled down image to present to end-users.
  // Recommend maximum size of 350x350px.
  thumbnailUri?: string;

  // [format: uri-reference]
  // A URI to an image of the asset.
  // Used for display purposes.
  displayUri?: string;

  // [format: uri-reference]
  // A URI to the asset.
  artifactUri?: string;
};

export type DetailedAssetMetdata = AssetMetadata &
  Partial<{
    // General notes, abstracts, or summaries about the contents of an asset.
    description: string;

    // The tz address responsible for minting the asset.
    minter: string;

    // The primary person, people, or organization(s) responsible
    // for creating the intellectual content of the asset.
    creators: string[];

    // The person, people, or organization(s)
    // that have made substantial creative contributions to the asset.
    contributors: string[];

    // The person, people, or organization(s) primarily responsible for
    // distributing or making the asset available to others in its present form.
    publishers: string[];

    // [format: date-time]
    // A date associated with the creation or availability of the asset.
    date: string;

    // Chain block level associated with the creation or availability of the asset.
    blockLevel: number;

    // A broad definition of the type of content of the asset.
    type: string;

    // A list of tags that describe the subject or content of the asset.
    tags: string[];

    // A list of genres that describe the subject or content of the asset.
    genres: string[];

    // [format: RFC 1776]
    // The language of the intellectual content of the asset.
    language: string;

    // A string or number used to uniquely identify the asset.
    // Ex. URL, URN, UUID, ISBN, etc.
    identifier: string;

    // A statement about the asset rights.
    rights: string;

    // [format: uri-reference]
    // A URI to a statement of rights.
    rightUri: string;

    // [format: uri-reference]
    // A URI with additional information
    // about the subject or content of the asset.
    externalUri: string;

    // [default: true]
    // All tokens will be transferable by default to allow end-users
    // to send them to other end-users.
    // However, this field exists to serve in special cases where
    // owners will not be able to transfer the token.
    isTransferable: boolean;

    // [default: false]
    // Describes whether an account can have an amount of exactly 0 or 1.
    // The purpose of this field is for wallets to determine whether or not
    // to display balance information and an amount field when transferring.
    isBooleanAmount: boolean;

    // The object is an array with all elements.
    formats: AssetMetadataFormat[];

    // Custom attributes about the subject or content of the asset.
    attributes: AssetMetadataAttribute[];
  }>;

export type AssetMetadataFormat = Partial<{
  // [format: uri-reference]
  // A URI to the asset represented in this format.
  uri: string;

  // A checksum hash of the content of the asset in this format.
  hash: string;

  // Media (MIME) type of the format.
  mimeType: string;

  // Size in bytes of the content of the asset in this format.
  fileSize: number;

  // Filename for the asset in this format. For display purposes.
  fileName: string;

  // [format: time]
  // Time duration of the content of the asset in this format.
  duration: string;

  // Dimensions of the content of the asset in this format.
  dimensions: {
    value: string;
    unit: string;
  };

  // Data rate which the content of the asset in this format was captured at.
  dataRate: {
    value: number;
    unit: string;
  };
}>;

export type AssetMetadataAttribute = {
  // Name of the attribute.
  name: string;

  // Value of the attribute.
  value: string;

  // Type of the value. To be used for display purposes.
  type?: string;

  // Data rate which the content of the asset in this format was captured at.
  dataRate: {
    value: number;
    unit: string;
  };

  // Dimensions of the content of the asset in this format.
  dimensions: {
    value: string;
    unit: string;
  };
};
