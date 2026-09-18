#!/bin/sh
set -eu
DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR"
# Railway volumes are often root-owned; the app runs as `node`.
chown -R node:node "$DATA_DIR"
exec runuser -u node -- "$@"
