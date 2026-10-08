#!/bin/sh
set -eu
DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR"
# Railway volumes are often root-owned; when the container is started as root,
# chown the data dir then drop to `node`. Default image user is already `node`.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_DIR"
  exec runuser -u node -- "$@"
fi
exec "$@"
