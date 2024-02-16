import os, { homedir } from 'os';
import path from 'path';
import fs from 'fs';
import which from 'which';
import { NargoNotFoundError } from './noir';
import { MarkdownString } from 'vscode';

// List of possible nargo binaries to find on Path
// We prioritize 'nargo' as the more standard version.
const NARGO_BINARIES = ['nargo', 'aztec-nargo'];
// List of possible default installations in users folder
const NARGO_INSTALL_LOCATION_POSTFIXES = ['.nargo/bin/nargo', '.aztec/bin/aztec-nargo'];

function absoluteInstallLocationPaths(homeDir: string): string[] {
  return NARGO_INSTALL_LOCATION_POSTFIXES.map((postfix) => path.join(homeDir, postfix)).filter((filePath) =>
    fs.existsSync(filePath),
  );
}

export function findNargoBinaries(homeDir: string): string[] {
  // Note that JS sets maintain insertion order.
  const nargoBinaryPaths: Set<string> = new Set();

  for (const bin of NARGO_BINARIES) {
    try {
      const path = which.sync(bin);
      // If it didn't throw, we found a nargo binary
      nargoBinaryPaths.add(path);
    } catch (err) {
      // Not found
    }
  }

  // So far we have not found installations on path
  // Let's check default installation locations
  for (const filePath of absoluteInstallLocationPaths(homeDir)) {
    nargoBinaryPaths.add(filePath);
  }

  return [...nargoBinaryPaths];
}

export default function findNargo() {
  const homeDir = os.homedir();
  const nargoBinaryPaths = findNargoBinaries(homeDir);

  if (nargoBinaryPaths.length > 0) {
    return nargoBinaryPaths[0];
  } else {
    const message = new MarkdownString();
    message.appendText(`Could not locate any of\n`);
    for (const nargoBinary of NARGO_BINARIES) {
      message.appendMarkdown(`\`${nargoBinary}\``);
      message.appendText(`\n`);
    }

    message.appendText(`on \`$PATH\`, or one of default installation locations\n`);
    for (const postfix of NARGO_INSTALL_LOCATION_POSTFIXES) {
      const filePath = path.join(homeDir, postfix);
      message.appendMarkdown(`\`${filePath}\``);
      message.appendText(`\n`);
    }

    throw new NargoNotFoundError(message);
  }
}
