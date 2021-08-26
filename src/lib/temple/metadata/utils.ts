import { formatImgUri, sanitizeImgUri } from "lib/image-uri";

import { AssetMetadata } from "./types";

export function getAssetSymbol(metadata: AssetMetadata | null, short = false) {
  if (!metadata) return "???";
  if (!short) return metadata.symbol;
  return metadata.symbol === "tez" ? "ꜩ" : metadata.symbol.substr(0, 5);
}

export function getAssetName(metadata: AssetMetadata | null) {
  return metadata ? metadata.name : "Unknown Token";
}

export function getThumbnailUri(metadata: AssetMetadata | null) {
  return (
    metadata &&
    metadata.thumbnailUri &&
    sanitizeImgUri(formatImgUri(metadata.thumbnailUri))
  );
}
