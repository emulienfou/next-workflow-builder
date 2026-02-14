#!/usr/bin/env tsx

/**
 * nwb - Next Workflow Builder CLI
 *
 * Entry point for running workflow builder scripts from consumer projects.
 *
 * Usage:
 *   npx nwb <command>
 *
 * Commands:
 *   discover-plugins Discover plugins and generate registry files
 *   create-plugin Scaffold a new plugin from templates
 *   migrate-prod Run database migrations for production (Vercel)
 */

const command = process.argv[2];

const COMMANDS: Record<string, string> = {
  "discover-plugins": "./discover-plugins.ts",
  "create-plugin": "./create-plugin.ts",
  "migrate-prod": "./migrate-prod.ts",
};

function printUsage(): void {
  console.log(`
nwb - Next Workflow Builder CLI

Usage:
  npx nwb <command>

Commands:
  discover-plugins  Discover plugins and generate registry files
  create-plugin     Scaffold a new plugin from templates
  migrate-prod      Run database migrations for production (Vercel)
`);
}

if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

const scriptPath = COMMANDS[command];

if (!scriptPath) {
  console.error(`Unknown command: ${ command }\n`);
  printUsage();
  process.exit(1);
}

await import(scriptPath);

export {};
