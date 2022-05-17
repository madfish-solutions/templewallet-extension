#!/bin/sh
gpg --quiet --batch --yes --decrypt --passphrase="$APPSTORE_AUTHKEY" --output authkey.json authkey.json.gpg
