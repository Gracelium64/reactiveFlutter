### This will be a working progress project, with time more and more shortcuts will be added as i go through the learning curve of React

# VS Code React JSX Dotfiles

This repository provides a reusable, version-controlled VS Code snippet setup for React JSX/TSX with Flutter-like flow:

- Type trigger, press Enter, then Tab through placeholders.
- Dual prefixes for each snippet (long trigger + short alias).
- Double-quote attribute placeholders by default.
- Broad HTML tag coverage for React work.
- Auto-detects VS Code User directory on macOS, Linux, and Windows.

## Quickstart (Linux/macOS/Windows)

1. Install package:

   npm install -g reactiveflutter

2. Deploy snippets to VS Code User directory:

   vscode-react-snippets --mode copy

   Alias (same command):

   reactiveflutter --mode copy

3. Verify in VS Code:
   - Open a `.jsx` or `.tsx` file.
   - Type `sec` or `img`, then accept snippet.

If global npm install fails with `EACCES` on Linux, use one of these:

- Use nvm (recommended) so global installs are user-scoped.
- Or avoid global install entirely:

  npm install reactiveflutter
  npx vscode-react-snippets --mode copy

## Install As npm Package

### Global Install (Recommended)

1. Install:

   npm install -g reactiveflutter

2. Run installer (safe default, snippets only):

   vscode-react-snippets --mode copy

   Alias (same command):

   reactiveflutter --mode copy

3. Optional: include managed VS Code settings:

   vscode-react-snippets --mode copy --include-settings

### Local Project Install

If you install locally (`npm install reactiveflutter` without `-g`), use npx to run it:

npx vscode-react-snippets --mode copy

Alias with same behavior:

npx reactiveflutter --mode copy

Or with optional settings:

npx vscode-react-snippets --mode copy --include-settings

## Repository Layout

- `vscode/settings.json` - Optional VS Code user settings overrides (snippet ranking and snippet acceptance behavior).
- `vscode/snippets/javascriptreact.json` - Global React JSX snippets.
- `vscode/snippets/typescriptreact.json` - TSX parity snippets.
- `scripts/bootstrap-vscode.sh` - Safe and idempotent macOS bootstrap script.
- `scripts/bootstrap-vscode.js` - Cross-platform bootstrap script (macOS/Linux/Windows).
- `scripts/bootstrap-vscode.sh` - Bash bootstrap script (macOS/Linux/WSL/Git Bash).
- `bin/vscode-react-snippets.js` - npm CLI entrypoint.
- `package.json` - npm package metadata and commands.

## Initial Install (macOS)

1. Clone this repo on your machine.
2. From repo root, run (safe default, snippets only):

   node ./scripts/bootstrap-vscode.js --mode copy

3. Optional: apply managed VS Code settings too:

   node ./scripts/bootstrap-vscode.js --mode copy --include-settings

Using npm script shortcuts:

- npm run bootstrap
- npm run bootstrap:with-settings

Default destination paths:

- `~/Library/Application Support/Code/User/snippets/javascriptreact.json`
- `~/Library/Application Support/Code/User/snippets/typescriptreact.json`

Optional destination when `--include-settings` is used:

- `~/Library/Application Support/Code/User/settings.json`

Backups are stored under:

- `~/.vscode-dotfiles-backups/<timestamp>/...`

## Update / Sync On Another Machine

1. Pull latest changes in this repository.
2. Re-run bootstrap:

   ./scripts/bootstrap-vscode.sh --mode copy

3. Include settings only when you explicitly want to replace local user settings:

   ./scripts/bootstrap-vscode.sh --mode copy --include-settings

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

VSCODE_USER_DIR="$HOME/Library/Application Support/Code - Insiders/User" node ./scripts/bootstrap-vscode.js --mode copy

Linux example:

VSCODE_USER_DIR="$HOME/.config/Code/User" node ./scripts/bootstrap-vscode.js --mode copy

Windows PowerShell example:

$env:VSCODE_USER_DIR="$env:APPDATA\Code\User"; node .\scripts\bootstrap-vscode.js --mode copy

Include managed settings with custom path:

VSCODE_USER_DIR="$HOME/Library/Application Support/Code - Insiders/User" node ./scripts/bootstrap-vscode.js --mode copy --include-settings

## Quick Validation

1. Open a `.jsx` or `.tsx` file.
2. Type `Section` or `sec`, press Enter.
3. Type `Image` or `img`, press Enter.
4. Press Tab to navigate placeholders in order.
5. Confirm snippet suggestions are near top of completion list.

## Troubleshooting

If install succeeded but VS Code does not behave as if snippets are installed, run:

1. Check package installation:

   npm list -g reactiveflutter

2. Check CLI resolution:

   which vscode-react-snippets

3. Check npm global prefix:

   npm config get prefix

4. Check shell PATH:

   echo "$PATH"

5. Check deployed snippet files:

   ls -l ~/.config/Code/User/snippets/javascriptreact.json
   ls -l ~/.config/Code/User/snippets/typescriptreact.json

6. Run built-in diagnostics:

   vscode-react-snippets --doctor

If command works in a normal terminal but not VS Code terminal, restart VS Code after updating shell config (`.bashrc`, `.zshrc`, etc.).

## Notes

- Snippets target `javascriptreact` and `typescriptreact` globally via VS Code User snippet files.
- Attributes use double quotes for placeholder defaults.
- Bootstrap does not overwrite user settings unless `--include-settings` is passed.

Release notes (suggested one-liner): New: reactiveflutter command alias; New: built-in doctor diagnostics; Improved: postinstall and troubleshooting guidance.
