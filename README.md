# VS Code React JSX Dotfiles

This repository provides a reusable, version-controlled VS Code snippet setup for React JSX/TSX with Flutter-like flow:

- Type trigger, press Enter, then Tab through placeholders.
- Dual prefixes for each snippet (long trigger + short alias).
- Double-quote attribute placeholders by default.
- Broad HTML tag coverage for React work.

## Repository Layout

- `vscode/settings.json` - VS Code user settings overrides (snippet ranking and snippet acceptance behavior).
- `vscode/snippets/javascriptreact.json` - Global React JSX snippets.
- `vscode/snippets/typescriptreact.json` - TSX parity snippets.
- `scripts/bootstrap-vscode.sh` - Safe and idempotent macOS bootstrap script.

## Initial Install (macOS)

1. Clone this repo on your machine.
2. From repo root, run:

   ./scripts/bootstrap-vscode.sh --mode copy

Default destination paths:

- `~/Library/Application Support/Code/User/settings.json`
- `~/Library/Application Support/Code/User/snippets/javascriptreact.json`
- `~/Library/Application Support/Code/User/snippets/typescriptreact.json`

Backups are stored under:

- `~/.vscode-dotfiles-backups/<timestamp>/...`

## Update / Sync On Another Machine

1. Pull latest changes in this repository.
2. Re-run bootstrap:

   ./scripts/bootstrap-vscode.sh --mode copy

The script is idempotent:

- Unchanged files are skipped.
- Changed files are backed up before replacement.

## Rollback Using Backups

1. Identify your backup folder:

   ls -1 ~/.vscode-dotfiles-backups

2. Restore desired files manually from a timestamped snapshot. Example:

   cp "$HOME/.vscode-dotfiles-backups/20260327-120000/Library/Application Support/Code/User/settings.json" "$HOME/Library/Application Support/Code/User/settings.json"

   cp "$HOME/.vscode-dotfiles-backups/20260327-120000/Library/Application Support/Code/User/snippets/javascriptreact.json" "$HOME/Library/Application Support/Code/User/snippets/javascriptreact.json"

   cp "$HOME/.vscode-dotfiles-backups/20260327-120000/Library/Application Support/Code/User/snippets/typescriptreact.json" "$HOME/Library/Application Support/Code/User/snippets/typescriptreact.json"

## Copy Mode vs Symlink Mode

- Copy mode (default, recommended): files are copied into VS Code User paths.
  - Best for portability and tool compatibility.
  - Survives repo path changes.
- Symlink mode: use `--mode symlink`.
  - Destination files point directly to repo-managed files.
  - Changes in repo are reflected immediately.
  - If repo moves, links must be recreated.

## Optional Path Override

Use custom VS Code user directory:

VSCODE_USER_DIR="$HOME/Library/Application Support/Code - Insiders/User" ./scripts/bootstrap-vscode.sh --mode copy

## Quick Validation

1. Open a `.jsx` or `.tsx` file.
2. Type `Section` or `sec`, press Enter.
3. Type `Image` or `img`, press Enter.
4. Press Tab to navigate placeholders in order.
5. Confirm snippet suggestions are near top of completion list.

## Notes

- Snippets target `javascriptreact` and `typescriptreact` globally via VS Code User snippet files.
- Attributes use double quotes for placeholder defaults.
