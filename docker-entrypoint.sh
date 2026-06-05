#!/bin/sh
set -e
# run migrations
npx prisma migrate deploy
# start application
exec "$@"