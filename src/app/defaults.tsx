import * as React from "react";

export const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{3,14}$/;

// TODO: Write really pattern
export const ACCOUNT_ADDRESS_PATTERN = /^[a-zA-Z0-9 _-]{3,14}$/;

export const PASSWORD_PATTERN = new RegExp(
  [
    "^",
    "(?=.*[a-z])", // Must contain at least 1 lowercase alphabetical character
    "(?=.*[A-Z])", // Must contain at least 1 uppercase alphabetical character
    "(?=.*[0-9])", // Must contain at least 1 numeric character
    "(?=.{8,})" // Must be eight characters or longer
  ].join("")
);

export const PASSWORD_ERROR_CAPTION = (
  <ul className="list-disc list-inside">
    <li>Required</li>
    <li>At least 8 characters</li>
    <li>At least 1 number</li>
    <li>At least 1 lowercase letter</li>
    <li>At least 1 uppercase letter</li>
  </ul>
);

export const MNEMONIC_ERROR_CAPTION = (
  <ul className="list-disc list-inside">
    <li>Required</li>
    <li>12, 15, 18, 21 or 24 words on English</li>
    <li>Each word separated with a single space</li>
    <li>Just valid pre-generated mnemonic</li>
  </ul>
);
