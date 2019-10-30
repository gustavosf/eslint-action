#!/bin/sh

set -e

cd storefront
npm config set @oracle-commerce:registry ${REGISTRY}
yarn install

NODE_PATH=node_modules node /action/lib/run.js
