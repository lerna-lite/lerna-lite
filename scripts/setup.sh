#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
  local type=$1
  local message=$2
  local icon
  local color

  case $type in
        "task")     icon="📦 "; color=$YELLOW ;;
        "error")    icon="❌ "; color=$RED ;;
        "success")  icon="✅ "; color=$GREEN ;;
        "warning")  icon="⚠️ "; color=$YELLOW ;;
        "info")     icon="ℹ️ "; color=$BLUE ;;
        *)          icon="📦 "; color=$YELLOW ;;
    esac

  echo -e "\n$icon ${color}$message${NC} ..."
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check/Install NVM
if [ ! -d "$HOME/.nvm" ]; then
  print_status "warning" "NVM not found - we recommend using NVM"
  exit 1
else
  # Source NVM to make it available in this script
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    \. "$NVM_DIR/nvm.sh"
    print_status "info" "Found .nvmrc file - using specified node version"
    nvm install
    print_status "success" "Node installed successfully"
  else
    print_status "error" "NVM directory exists but nvm.sh not found"
    exit 1
  fi
fi

# Enable Corepack and install PNPM
if ! command_exists corepack; then
  print_status "task" "Enabling Corepack"
  corepack enable
  print_status "success" "Corepack enabled successfully"
else
  print_status "success" "Corepack already available"
fi

if ! command_exists pnpm; then
  print_status "task" "Installing PNPM via Corepack"
  corepack prepare pnpm@10.10.0 --activate
  print_status "success" "PNPM installed via Corepack successfully"
else
  print_status "success" "PNPM already installed"
fi

# Run project setup scripts

print_status "task" "Installing project dependencies"
pnpm install
print_status "success" "Project dependencies installed successfully"

print_status "task" "Running initial lint"
pnpm lint
print_status "success" "Initial lint finished"

print_status "task" "Running OXC formatter script"
pnpm format
print_status "success" "OXC formatter finished"

print_status "task" "Running initial TypeScript build"
pnpm build
print_status "success" "Initial TypeScript build finished"

print_status "task" "Setting up lint-type for tests"
pnpm lint-type
print_status "success" "Lint-type setup complete"

print_status "task" "Running initial tests"
pnpm test
print_status "success" "Initial tests finished"
print_status "success" "Setup complete! You're ready for development."
