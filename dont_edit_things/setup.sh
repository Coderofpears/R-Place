#!/usr/bin/env bash
set -euo pipefail

# Cloud‑ready bootstrap for running the custom Gimkit stack.
# Adjust the ports and paths below if your provider exposes different endpoints.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT/repo_server"
CLIENT_DIR="$ROOT/repo_bundle_tracker"

install_bun() {
  if command -v bun >/dev/null; then
    echo "Bun already installed"
    return
  fi

  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
}

prepare_repo() {
  cd "$ROOT"
  git fetch origin main >/dev/null 2>&1 || true
  git checkout production
  git pull origin production
}

start_services() {
  install_bun

  (
    cd "$SERVER_DIR"
    bun install
    bun run start &
    echo "Server running on http://localhost:5923 / 5924"
  )

  (
    cd "$CLIENT_DIR"
    bun install
    bun run start &
    echo "Client proxy running on http://localhost:4173"
  )
}

main() {
  prepare_repo
  start_services
  echo "HA setup complete; use bun logs at /tmp/*.log to monitor."
}

main "$@"
