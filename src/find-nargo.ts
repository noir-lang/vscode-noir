import os from 'os';
import path from 'path';
import fs from 'fs';
import which from 'which';
import { NargoNotFoundError } from './noir';
import { MarkdownString } from 'vscode';

// List of possible nargo binaries to find on Path
// We prioritize 'aztec-nargo' as more specialised case
const nargoBinaries = ['aztec-nargo', 'nargo'];
// List of possible default installations in users folder
const nargoInstallLocationPostix = ['.aztec/bin/aztec-nargo', '.nargo/bin/nargo'];

export default function findNargo() {
  for (const bin of nargoBinaries) {
    try {
      const nargo = which.sync(bin);
      // If it didn't throw, we found a nargo binary
      return nargo;
    } catch (err) {
      // Not found
    }
  }

  const homeDir = os.homedir();
  // So far we have not found installations on path
  // Let's check default installation locations
  for (const postfix of nargoInstallLocationPostix) {
    const filePath = path.join(homeDir, postfix);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  const message = new MarkdownString();
  message.appendText(`Could not locate any of\n`);
  for (const nargoBinary of nargoBinaries) {
    message.appendMarkdown(`\`${nargoBinary}\``);
    message.appendText(`\n`);
  }

  message.appendText(`on \`$PATH\`, or one of default installation locations\n`);
  for (const postfix of nargoInstallLocationPostix) {
    const filePath = path.join(homeDir, postfix);
    message.appendMarkdown(`\`${filePath}\``);
    message.appendText(`\n`);
  }

  throw new NargoNotFoundError(message);
}
