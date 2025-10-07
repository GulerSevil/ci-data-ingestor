#!/usr/bin/env bash
set -euo pipefail

echo "Setting up local development environment..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Please install Node 22+ and re-run." >&2
  exit 1
fi

if [ ! -f package-lock.json ]; then
  echo "Installing dependencies (with lockfile creation)..."
  npm install
else
  echo "Installing dependencies from lockfile..."
  npm ci || npm install
fi

echo "Running typecheck..."
npm run typecheck || true

echo "Building TypeScript..."
npm run build

echo "Setup complete. Start the server with: npm run dev"