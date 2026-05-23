#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
	echo "Usage: $0 <new-version>" >&2
	echo "Example: $0 1.1.13" >&2
	exit 1
fi

NEW_VERSION="$1"

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo "Error: version must be in the form X.Y.Z (got '$NEW_VERSION')" >&2
	exit 1
fi

cd "$(dirname "$0")/.."

MIN_APP_VERSION=$(sed -n 's/.*"minAppVersion": *"\([^"]*\)".*/\1/p' manifest.json)
if [ -z "$MIN_APP_VERSION" ]; then
	echo "Error: could not read minAppVersion from manifest.json" >&2
	exit 1
fi

# manifest.json
sed -i.bak -E 's/("version": *")[^"]+(")/\1'"$NEW_VERSION"'\2/' manifest.json
rm manifest.json.bak

# package.json + package-lock.json (npm rewrites both)
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version >/dev/null

# versions.json — insert new entry right after the opening brace, preserving tab indent
awk -v ver="$NEW_VERSION" -v minv="$MIN_APP_VERSION" '
	!inserted && /^\{/ {
		print
		printf "\t\"%s\": \"%s\",\n", ver, minv
		inserted = 1
		next
	}
	{ print }
' versions.json > versions.json.tmp && mv versions.json.tmp versions.json

echo "Bumped to $NEW_VERSION (minAppVersion: $MIN_APP_VERSION)"
