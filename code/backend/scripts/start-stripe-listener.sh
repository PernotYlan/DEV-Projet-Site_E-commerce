#!/bin/sh
set -eu

mkdir -p /tmp/stripe

while ! nc -z backend 3000; do
  echo "[stripe-cli] waiting for backend..."
  sleep 2
done

echo "[stripe-cli] starting stripe listen"

stripe listen --api-key "$STRIPE_API_KEY" --forward-to http://backend:3000/api/paiement/webhook --skip-verify --format json 2>&1 | while IFS= read -r line; do
  echo "$line"
  secret=$(printf '%s
' "$line" | grep -o 'whsec_[A-Za-z0-9]*' | tail -1 || true)
  if [ -n "$secret" ]; then
    printf '%s\n' "$secret" > /tmp/stripe/webhook_secret.txt
    echo "[stripe-cli] webhook secret saved"
  fi
done
