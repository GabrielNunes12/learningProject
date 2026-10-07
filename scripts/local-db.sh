#!/bin/sh
# Starts a local Postgres for development in ./data/pg (git-ignored) on port 5433 and creates the
# "projectlearn" database. Safe to run again: it only starts what isn't running yet.
# Then put this in .env:  DATABASE_URL=postgres://localhost:5433/projectlearn
set -e
cd "$(dirname "$0")/.."
# macOS Postgres refuses to start without a valid locale in the environment ("postmaster became multithreaded").
export LC_ALL=C
DIR=data/pg
PORT=5433
if [ ! -f "$DIR/PG_VERSION" ]; then
  mkdir -p data
  initdb -D "$DIR" -U "$(whoami)" --auth=trust --encoding=UTF8 --locale=C >/dev/null
  echo "Created a Postgres cluster in $DIR"
fi
if ! pg_ctl -D "$DIR" status >/dev/null 2>&1; then
  pg_ctl -D "$DIR" -o "-p $PORT -k /tmp" -l "$DIR/server.log" -w start >/dev/null
  echo "Started Postgres on port $PORT"
fi
psql -h localhost -p $PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'projectlearn'" | grep -q 1 \
  || { createdb -h localhost -p $PORT projectlearn && echo 'Created database "projectlearn"'; }
echo "Ready: DATABASE_URL=postgres://localhost:$PORT/projectlearn"
