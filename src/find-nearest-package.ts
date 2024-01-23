import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Given a program file path, walk up the file system until
 * finding the nearest a Nargo.toml in a directory that contains
 * the program.
 *
 * To reduce the odds of accidentally choosing the wrong Nargo package,
 * end the walk at the root of the current VS Code open files.
 */
export default function findNearestPackageFolder(program: string): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error(`No workspace is currently open in VS Code.`);
  }

  const workspaceRoots = workspaceFolders.map((wf) => wf.uri.fsPath);

  let currentFolder = path.dirname(program);

  try {
    while (currentFolder !== path.dirname(currentFolder) && !workspaceRoots.includes(currentFolder)) {
      const maybeNargoProject = path.join(currentFolder, 'Nargo.toml');

      if (fs.existsSync(maybeNargoProject)) {
        return currentFolder;
      }

      currentFolder = path.dirname(currentFolder);
    }
  } catch (error) {
    throw new Error(`Could not find a Nargo package associated to this file.`);
  }

  throw new Error(`Could not find a Nargo package associated to this file.`);
}
