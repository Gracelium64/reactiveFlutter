#!/usr/bin/env node

const path = require("node:path");

function detectGlobalBin(prefix) {
  if (!prefix) {
    return null;
  }

  if (process.platform === "win32") {
    return prefix;
  }

  return path.join(prefix, "bin");
}

function printLine(line = "") {
  process.stdout.write(`${line}\n`);
}

function main() {
  const isGlobalInstall = process.env.npm_config_global === "true";
  const npmPrefix = process.env.npm_config_prefix || "";
  const globalBin = detectGlobalBin(npmPrefix);

  printLine("[reactiveflutter] Install complete.");
  printLine(
    "[reactiveflutter] Next step: deploy snippets into VS Code user files.",
  );
  printLine("");

  if (isGlobalInstall) {
    printLine("Run:");
    printLine("  vscode-react-snippets --mode copy");
    printLine("");
    printLine("Alias also available:");
    printLine("  reactiveflutter --mode copy");
  } else {
    printLine("Run (local install):");
    printLine("  npx vscode-react-snippets --mode copy");
    printLine("");
    printLine("Alias also available:");
    printLine("  npx reactiveflutter --mode copy");
  }

  if (globalBin) {
    printLine("");
    printLine(
      "If command is not found in VS Code terminal, ensure this is in PATH:",
    );
    printLine(`  ${globalBin}`);
  }
}

main();
