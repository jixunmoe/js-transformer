#!/bin/sh

set -ex

rm -rf dist
cp -r src dist

find dist -type d -name '__test__' -exec rm -rf {} +

sed 's#src/##' < package.json > dist/package.json
cp LICENSE dist
cp README.md dist

(cd dist; npm publish "$@")
