#!/bin/sh

set -e

cd storefront
npm install

NODE_PATH=node_modules node /action/lib/run.js
