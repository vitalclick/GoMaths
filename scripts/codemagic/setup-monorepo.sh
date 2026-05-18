#!/usr/bin/env bash
# Install pnpm and resolve workspace dependencies for the GoMaths monorepo.
# Codemagic invokes this once at the start of every workflow.
set -euo pipefail

echo "==> Node version"
node --version

echo "==> Enabling corepack and pinning pnpm 9.12.0 (matches package.json packageManager)"
corepack enable
corepack prepare pnpm@9.12.0 --activate

echo "==> pnpm version"
pnpm --version

echo "==> Installing workspace dependencies (frozen lockfile)"
cd "$CM_BUILD_DIR"
pnpm install --frozen-lockfile
