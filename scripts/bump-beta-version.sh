#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
	echo "Usage: $0 <new-beta-version>" >&2
	echo "Example: $0 1.4.1-beta.1" >&2
	exit 1
fi

NEW_VERSION="$1"

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+-[0-9A-Za-z][0-9A-Za-z.-]*$ ]]; then
	echo "Error: beta version must be a SemVer prerelease like X.Y.Z-beta.N (got '$NEW_VERSION')" >&2
	exit 1
fi

cd "$(dirname "$0")/.."

# manifest.json
sed -i.bak -E 's/("version": *")[^"]+(")/\1'"$NEW_VERSION"'\2/' manifest.json
rm manifest.json.bak

# package.json + package-lock.json (npm rewrites both)
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version >/dev/null

echo "Bumped beta to $NEW_VERSION"
echo "Note: versions.json is intentionally unchanged for beta/prerelease builds."
