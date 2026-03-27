#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="copy"
DRY_RUN="false"
INCLUDE_SETTINGS="false"
VSCODE_USER_DIR="${VSCODE_USER_DIR:-$HOME/Library/Application Support/Code/User}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/.vscode-dotfiles-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

usage() {
  cat <<'EOF'
Usage: scripts/bootstrap-vscode.sh [--mode copy|symlink] [--include-settings] [--dry-run]

Options:
  --mode      Deployment mode. Default is copy.
  --include-settings  Also deploy vscode/settings.json into VS Code user settings.
  --dry-run   Print actions without changing files.
  -h, --help  Show this help.

Environment overrides:
  VSCODE_USER_DIR   Custom VS Code User directory.
  BACKUP_ROOT       Custom backup root directory.
EOF
}

log() {
  printf '[bootstrap] %s\n' "$1"
}

run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log "DRY RUN: $*"
  else
    "$@"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --mode" >&2
        exit 1
      fi
      MODE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --include-settings)
      INCLUDE_SETTINGS="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "copy" && "$MODE" != "symlink" ]]; then
  echo "Invalid mode: $MODE (expected copy or symlink)" >&2
  exit 1
fi

SRC_SETTINGS="$ROOT_DIR/vscode/settings.json"
SRC_JSX="$ROOT_DIR/vscode/snippets/javascriptreact.json"
SRC_TSX="$ROOT_DIR/vscode/snippets/typescriptreact.json"

DEST_SETTINGS="$VSCODE_USER_DIR/settings.json"
DEST_SNIPPETS_DIR="$VSCODE_USER_DIR/snippets"
DEST_JSX="$DEST_SNIPPETS_DIR/javascriptreact.json"
DEST_TSX="$DEST_SNIPPETS_DIR/typescriptreact.json"

ensure_dir() {
  run_cmd mkdir -p "$1"
}

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" || -L "$path" ]]; then
    local rel="${path#$HOME/}"
    local backup_path="$BACKUP_DIR/$rel"
    run_cmd mkdir -p "$(dirname "$backup_path")"
    run_cmd cp -a "$path" "$backup_path"
    log "Backed up: $path -> $backup_path"
  fi
}

deploy_copy() {
  local src="$1"
  local dest="$2"

  if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
    log "No change: $dest"
    return
  fi

  backup_if_exists "$dest"
  run_cmd mkdir -p "$(dirname "$dest")"
  run_cmd cp "$src" "$dest"
  log "Copied: $src -> $dest"
}

deploy_symlink() {
  local src="$1"
  local dest="$2"

  if [[ -L "$dest" ]] && [[ "$(readlink "$dest")" == "$src" ]]; then
    log "No change: $dest"
    return
  fi

  backup_if_exists "$dest"
  run_cmd mkdir -p "$(dirname "$dest")"
  run_cmd rm -rf "$dest"
  run_cmd ln -s "$src" "$dest"
  log "Linked: $dest -> $src"
}

deploy() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "$src" ]]; then
    echo "Missing source file: $src" >&2
    exit 1
  fi

  if [[ "$MODE" == "copy" ]]; then
    deploy_copy "$src" "$dest"
  else
    deploy_symlink "$src" "$dest"
  fi
}

log "Mode: $MODE"
log "VS Code user dir: $VSCODE_USER_DIR"
if [[ "$INCLUDE_SETTINGS" == "true" ]]; then
  log "Settings deployment: enabled"
else
  log "Settings deployment: disabled (use --include-settings to enable)"
fi

ensure_dir "$VSCODE_USER_DIR"
ensure_dir "$DEST_SNIPPETS_DIR"

if [[ "$DRY_RUN" == "false" ]]; then
  mkdir -p "$BACKUP_DIR"
fi

if [[ "$INCLUDE_SETTINGS" == "true" ]]; then
  deploy "$SRC_SETTINGS" "$DEST_SETTINGS"
else
  log "Skipping settings deployment: $DEST_SETTINGS"
fi
deploy "$SRC_JSX" "$DEST_JSX"
deploy "$SRC_TSX" "$DEST_TSX"

log "Completed successfully."
if [[ "$DRY_RUN" == "false" ]]; then
  log "Backups (if any) stored in: $BACKUP_DIR"
fi
