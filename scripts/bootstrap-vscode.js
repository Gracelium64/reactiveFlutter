#!/usr/bin/env node

const fs = require("node:fs/promises");
const fssync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");

function usage() {
  console.log(`Usage: scripts/bootstrap-vscode.js [--mode copy|symlink] [--include-settings] [--dry-run] [--doctor]

Options:
  --mode      Deployment mode. Default is copy.
  --include-settings  Also deploy vscode/settings.json into VS Code user settings.
  --dry-run   Print actions without changing files.
  --doctor    Print environment diagnostics and exit.
  -h, --help  Show this help.

Environment overrides:
  VSCODE_USER_DIR   Custom VS Code User directory.
  BACKUP_ROOT       Custom backup root directory.`);
}

function parseArgs(argv) {
  const out = {
    mode: "copy",
    includeSettings: false,
    dryRun: false,
    doctor: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--mode") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --mode");
      }
      out.mode = value;
      i += 1;
      continue;
    }

    if (arg === "--include-settings") {
      out.includeSettings = true;
      continue;
    }

    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }

    if (arg === "--doctor") {
      out.doctor = true;
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (out.mode !== "copy" && out.mode !== "symlink") {
    throw new Error(`Invalid mode: ${out.mode} (expected copy or symlink)`);
  }

  return out;
}

async function pathExists(target) {
  try {
    await fs.lstat(target);
    return true;
  } catch {
    return false;
  }
}

function detectNpmPrefix() {
  if (process.env.npm_config_prefix) {
    return process.env.npm_config_prefix;
  }

  try {
    return execSync("npm config get prefix", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function detectGlobalBinDir(prefix) {
  if (!prefix) {
    return "";
  }

  if (process.platform === "win32") {
    return prefix;
  }

  return path.join(prefix, "bin");
}

function isPathSegmentPresent(targetDir, envPath) {
  if (!targetDir || !envPath) {
    return false;
  }

  const normalizedTarget = path.resolve(targetDir);
  const parts = envPath.split(path.delimiter).map((part) => path.resolve(part));
  return parts.includes(normalizedTarget);
}

async function checkWritablePath(targetPath) {
  let probe = targetPath;

  while (true) {
    if (await pathExists(probe)) {
      try {
        await fs.access(probe, fssync.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }

    const parent = path.dirname(probe);
    if (parent === probe) {
      return false;
    }
    probe = parent;
  }
}

async function runDoctor({ vscodeUserDir, destSnippetsDir, destJsx, destTsx }) {
  const checks = [];
  const npmPrefix = detectNpmPrefix();
  const npmGlobalBin = detectGlobalBinDir(npmPrefix);
  const envPath = process.env.PATH || "";

  const pushCheck = (label, ok, detail) => {
    checks.push({ ok, label });
    const status = ok ? "PASS" : "FAIL";
    log(`${status}: ${label}${detail ? ` (${detail})` : ""}`);
  };

  log("Doctor mode: collecting diagnostics");
  log(`Detected VS Code user dir: ${vscodeUserDir}`);
  log(`Detected snippets dir: ${destSnippetsDir}`);
  log(`Detected npm prefix: ${npmPrefix || "(unknown)"}`);
  if (npmGlobalBin) {
    log(`Expected npm global bin: ${npmGlobalBin}`);
  }

  pushCheck(
    "VS Code user directory exists",
    await pathExists(vscodeUserDir),
    vscodeUserDir,
  );
  pushCheck(
    "VS Code user/snippets is writable",
    await checkWritablePath(destSnippetsDir),
    destSnippetsDir,
  );
  pushCheck(
    "JSX snippet target is writable",
    await checkWritablePath(destJsx),
    destJsx,
  );
  pushCheck(
    "TSX snippet target is writable",
    await checkWritablePath(destTsx),
    destTsx,
  );

  if (npmGlobalBin) {
    pushCheck(
      "npm global bin is in PATH",
      isPathSegmentPresent(npmGlobalBin, envPath),
      npmGlobalBin,
    );
  } else {
    pushCheck("npm prefix is detectable", false, "run `npm config get prefix`");
  }

  const allPassed = checks.every((item) => item.ok);
  log(`Doctor summary: ${allPassed ? "PASS" : "FAIL"}`);

  if (!allPassed) {
    log("Suggested fixes:");
    log("- Ensure VS Code user directory exists and is user-writable.");
    log(
      "- If global command is not found, add npm global bin to PATH and restart VS Code.",
    );
    log(
      "- Alternative: run with npx (local install) to avoid global PATH/permission issues.",
    );
    process.exitCode = 1;
  }
}

function detectVscodeUserDir() {
  if (process.env.VSCODE_USER_DIR) {
    return process.env.VSCODE_USER_DIR;
  }

  const home = os.homedir();

  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Code", "User");
  }

  if (process.platform === "linux") {
    const candidates = [
      path.join(home, ".config", "Code", "User"),
      path.join(home, ".config", "Code - Insiders", "User"),
      path.join(home, ".config", "VSCodium", "User"),
    ];

    for (const candidate of candidates) {
      if (fssync.existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    if (appData) {
      const candidates = [
        path.join(appData, "Code", "User"),
        path.join(appData, "Code - Insiders", "User"),
        path.join(appData, "VSCodium", "User"),
      ];

      for (const candidate of candidates) {
        if (fssync.existsSync(candidate)) {
          return candidate;
        }
      }

      return candidates[0];
    }

    return path.join(home, "AppData", "Roaming", "Code", "User");
  }

  return path.join(home, ".config", "Code", "User");
}

function defaultBackupRoot() {
  if (process.env.BACKUP_ROOT) {
    return process.env.BACKUP_ROOT;
  }
  return path.join(os.homedir(), ".vscode-dotfiles-backups");
}

function tsNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function log(msg) {
  process.stdout.write(`[bootstrap] ${msg}\n`);
}

async function ensureDir(target, dryRun) {
  if (dryRun) {
    log(`DRY RUN: mkdir -p ${target}`);
    return;
  }
  await fs.mkdir(target, { recursive: true });
}

function relativeBackupPath(targetPath) {
  const home = os.homedir();
  const rel = path.relative(home, targetPath);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    return rel;
  }

  // Keep external paths safe and deterministic across OSes.
  const sanitized = targetPath.replace(/[:\\]/g, "/").replace(/^\/+/, "");
  return path.join("external", sanitized);
}

async function backupIfExists(targetPath, backupDir, dryRun) {
  if (!(await pathExists(targetPath))) {
    return;
  }

  const rel = relativeBackupPath(targetPath);
  const backupPath = path.join(backupDir, rel);
  const backupParent = path.dirname(backupPath);

  if (dryRun) {
    log(`DRY RUN: mkdir -p ${backupParent}`);
    log(`DRY RUN: cp -a ${targetPath} ${backupPath}`);
    return;
  }

  await fs.mkdir(backupParent, { recursive: true });
  await fs.cp(targetPath, backupPath, {
    recursive: true,
    force: true,
    verbatimSymlinks: true,
  });
  log(`Backed up: ${targetPath} -> ${backupPath}`);
}

async function filesEqual(src, dest) {
  try {
    const [a, b] = await Promise.all([fs.readFile(src), fs.readFile(dest)]);
    return a.equals(b);
  } catch {
    return false;
  }
}

async function deployCopy(src, dest, backupDir, dryRun) {
  if (await pathExists(dest)) {
    const stats = await fs.lstat(dest);
    if (stats.isFile() && (await filesEqual(src, dest))) {
      log(`No change: ${dest}`);
      return;
    }
  }

  await backupIfExists(dest, backupDir, dryRun);
  const parent = path.dirname(dest);

  if (dryRun) {
    log(`DRY RUN: mkdir -p ${parent}`);
    log(`DRY RUN: cp ${src} ${dest}`);
    return;
  }

  await fs.mkdir(parent, { recursive: true });
  await fs.copyFile(src, dest);
  log(`Copied: ${src} -> ${dest}`);
}

async function deploySymlink(src, dest, backupDir, dryRun) {
  if (await pathExists(dest)) {
    const stats = await fs.lstat(dest);
    if (stats.isSymbolicLink()) {
      const current = await fs.readlink(dest);
      const currentResolved = path.resolve(path.dirname(dest), current);
      const targetResolved = path.resolve(src);
      if (currentResolved === targetResolved) {
        log(`No change: ${dest}`);
        return;
      }
    }
  }

  await backupIfExists(dest, backupDir, dryRun);
  const parent = path.dirname(dest);

  if (dryRun) {
    log(`DRY RUN: mkdir -p ${parent}`);
    log(`DRY RUN: rm -rf ${dest}`);
    log(`DRY RUN: ln -s ${src} ${dest}`);
    return;
  }

  await fs.mkdir(parent, { recursive: true });
  await fs.rm(dest, { recursive: true, force: true });

  try {
    await fs.symlink(src, dest);
  } catch (err) {
    if (
      process.platform === "win32" &&
      (err.code === "EPERM" || err.code === "EACCES")
    ) {
      throw new Error(
        "Symlink mode on Windows requires Developer Mode or elevated permissions. Use --mode copy instead.",
      );
    }
    throw err;
  }

  log(`Linked: ${dest} -> ${src}`);
}

async function deploy({ src, dest, mode, backupDir, dryRun }) {
  if (!(await pathExists(src))) {
    throw new Error(`Missing source file: ${src}`);
  }

  if (mode === "copy") {
    await deployCopy(src, dest, backupDir, dryRun);
  } else {
    await deploySymlink(src, dest, backupDir, dryRun);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const rootDir = path.resolve(__dirname, "..");
  const vscodeUserDir = detectVscodeUserDir();
  const backupRoot = defaultBackupRoot();
  const backupDir = path.join(backupRoot, tsNow());

  const srcSettings = path.join(rootDir, "vscode", "settings.json");
  const srcJsx = path.join(
    rootDir,
    "vscode",
    "snippets",
    "javascriptreact.json",
  );
  const srcTsx = path.join(
    rootDir,
    "vscode",
    "snippets",
    "typescriptreact.json",
  );

  const destSettings = path.join(vscodeUserDir, "settings.json");
  const destSnippetsDir = path.join(vscodeUserDir, "snippets");
  const destJsx = path.join(destSnippetsDir, "javascriptreact.json");
  const destTsx = path.join(destSnippetsDir, "typescriptreact.json");

  log(`Mode: ${options.mode}`);
  log(`VS Code user dir: ${vscodeUserDir}`);
  if (options.includeSettings) {
    log("Settings deployment: enabled");
  } else {
    log("Settings deployment: disabled (use --include-settings to enable)");
  }

  await ensureDir(vscodeUserDir, options.dryRun);
  await ensureDir(destSnippetsDir, options.dryRun);

  if (options.doctor) {
    await runDoctor({
      vscodeUserDir,
      destSnippetsDir,
      destJsx,
      destTsx,
    });
    return;
  }

  if (!options.dryRun) {
    await fs.mkdir(backupDir, { recursive: true });
  }

  if (options.includeSettings) {
    await deploy({
      src: srcSettings,
      dest: destSettings,
      mode: options.mode,
      backupDir,
      dryRun: options.dryRun,
    });
  } else {
    log(`Skipping settings deployment: ${destSettings}`);
  }

  await deploy({
    src: srcJsx,
    dest: destJsx,
    mode: options.mode,
    backupDir,
    dryRun: options.dryRun,
  });

  await deploy({
    src: srcTsx,
    dest: destTsx,
    mode: options.mode,
    backupDir,
    dryRun: options.dryRun,
  });

  log("Completed successfully.");
  if (!options.dryRun) {
    log(`Backups (if any) stored in: ${backupDir}`);
  }
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
