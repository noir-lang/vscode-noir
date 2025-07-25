/**
 * This file is largely copied from vscode's sample library and Grain's vscode extension.
 * The original copyright notices are reproduced below.
 *
 * --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * --------------------------------------------------------------------------------------------
 * Copyright 2018-2020 Oscar Spencer & Contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * --------------------------------------------------------------------------------------------
 */

import {
  window,
  workspace,
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
  Disposable,
  TextDocument,
  TextDocumentContentProvider,
  ViewColumn,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
  ConfigurationChangeEvent,
  Uri,
  tasks,
  Task,
  TaskScope,
  TaskRevealKind,
  TaskPanelKind,
  TaskGroup,
  ProcessExecution,
  ProgressLocation,
  debug,
} from 'vscode';
import os from 'os';

import { activateDebugger } from './debugger';

import { languageId } from './constants';
import Client from './client';
import { findNargoBinaries, getNargoPath } from './find-nargo';
import { lspClients, editorLineDecorationManager } from './noir';
import { getNoirStatusBarItem, handleClientStartError } from './noir';

const NOIR_PROJECT_CONTEXT_NAME = 'inNoirProject';

const activeCommands: Map<string, Disposable> = new Map();

const activeMutex: Set<string> = new Set();

function mutex(key: string, fn: (...args: unknown[]) => Promise<void>) {
  return (...args) => {
    if (activeMutex.has(key)) return;

    activeMutex.add(key);

    fn(...args)
      .catch((err) =>
        // Rethrow on a "next tick" to break out of the promise wrapper
        queueMicrotask(() => {
          throw err;
        }),
      )
      .finally(() => {
        activeMutex.delete(key);
      });
  };
}

function dirpathFromUri(uri: Uri): string {
  const dirPath = uri.toString();
  if (!dirPath.endsWith('/')) {
    return dirPath + '/';
  }
  return dirPath;
}

let workspaceFolders: string[] = [];
function sortWorkspaceFolders(): string[] {
  if (workspaceFolders.length === 0) {
    if (!workspace.workspaceFolders) {
      workspaceFolders = [];
    } else {
      workspaceFolders = workspace.workspaceFolders
        .map((folder) => dirpathFromUri(folder.uri))
        .sort((a, b) => a.length - b.length);
    }
  }
  return workspaceFolders;
}

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  const sorted = sortWorkspaceFolders();
  for (const element of sorted) {
    const dirpath = dirpathFromUri(folder.uri);
    if (dirpath.startsWith(element)) {
      return workspace.getWorkspaceFolder(Uri.parse(element))!;
    }
  }
  return folder;
}

const INTERNAL_COMMANDS = [
  { type: 'nargo', command: 'test', group: TaskGroup.Test },
  { type: 'nargo', command: 'compile', group: TaskGroup.Build },
  { type: 'nargo', command: 'info', group: TaskGroup.Build },
  { type: 'nargo', command: 'execute', group: TaskGroup.Build },
];

function registerCommands(uri: Uri) {
  const file = uri.toString();
  const config = workspace.getConfiguration('noir', uri);

  const nargoPath = getNargoPath(uri);

  const nargoFlags = config.get<string | undefined>('nargoFlags') || [];

  const commands$: Disposable[] = [];
  for (const { type, command, group } of INTERNAL_COMMANDS) {
    const internalName = `${type}.${command}`;
    const displayName = `${type} ${command}`;
    const command$ = commands.registerCommand(internalName, async (...args) => {
      const task = new Task(
        { type, command },
        TaskScope.Workspace,
        displayName,
        languageId,
        new ProcessExecution(nargoPath, [command].concat(nargoFlags).concat(args)),
        [],
      );
      task.group = group;
      // We set `isBackground` to `true` to avoid showing the internal task as "recently used"
      task.isBackground = true;
      // However, we still want to show the terminal when you run a test
      task.presentationOptions = {
        reveal: TaskRevealKind.Always,
        panel: TaskPanelKind.New,
        clear: true,
      };

      return tasks.executeTask(task);
    });

    commands$.push(command$);
  }

  const profileCommand$ = commands.registerCommand('nargo.profile', async (..._args) => {
    window.withProgress(
      {
        location: ProgressLocation.Window,
        cancellable: false,
        title: 'Getting Profile Information',
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const workspaceFolder = workspace.getWorkspaceFolder(uri).uri.toString();
        const activeClient = lspClients.get(workspaceFolder);

        await activeClient.refreshProfileInfo();
        editorLineDecorationManager.displayAllTextDecorations();

        progress.report({ increment: 100 });
      },
    );
  });
  commands$.push(profileCommand$);
  const hideProfileInformationCommand$ = commands.registerCommand('nargo.profile.hide', async (..._args) => {
    editorLineDecorationManager.hideDecorations();
  });
  commands$.push(hideProfileInformationCommand$);
  const debugCommand$ = commands.registerCommand('nargo.debug.dap', async (..._args) => {
    return commands.executeCommand('workbench.action.debug.start');
  });

  commands$.push(debugCommand$);
  const debugTestCommand$ = commands.registerCommand('nargo.debug.test', async (...args) => {
    const exactIndex = args.indexOf('--exact');
    const testName = args.at(exactIndex + 1);
    const oracleResolver = process.env['TXE_TARGET'];
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    await debug.startDebugging(workspaceFolder, {
      type: 'noir',
      request: 'launch',
      name: 'Noir binary package',
      projectFolder: '${workspaceFolder}',
      proverName: 'Prover',
      ...(testName && { testName }),
      ...(oracleResolver && { oracleResolver }),
    });
  });
  commands$.push(debugTestCommand$);

  const selectNargoPathCommand$ = commands.registerCommand('nargo.config.path.select', async (..._args) => {
    const homeDir = os.homedir();
    const foundNargoBinaries = findNargoBinaries(homeDir);
    const result = await window.showQuickPick(foundNargoBinaries, { placeHolder: 'Select the Nargo binary to use' });
    const config = workspace.getConfiguration('noir', uri);
    config.update('nargoPath', result);
    const statusBarItem = getNoirStatusBarItem();
    statusBarItem.tooltip = result;
  });
  commands$.push(selectNargoPathCommand$);

  activeCommands.set(file, Disposable.from(...commands$));
}

function disposeCommands(uri: Uri) {
  const file = uri.toString();
  const commands$ = activeCommands.get(file);
  commands$.dispose();
}

function registerFileCommands(uri: Uri) {
  registerCommands(uri);
}

function disposeFileCommands(uri: Uri) {
  disposeCommands(uri);
}

function registerWorkspaceCommands(workspaceFolder: WorkspaceFolder) {
  registerCommands(workspaceFolder.uri);
}

function disposeWorkspaceCommands(workspaceFolder: WorkspaceFolder) {
  disposeCommands(workspaceFolder.uri);
}

async function addFileClient(uri: Uri) {
  const file = uri.toString();
  if (!lspClients.has(file)) {
    // Start the client. This will also launch the server
    const client = new Client(uri);
    lspClients.set(file, client);
    await client.start();
  }
}

async function removeFileClient(uri: Uri) {
  const file = uri.toString();
  const client = lspClients.get(file);
  if (client) {
    await client.stop();
    lspClients.delete(file);
  }
}

async function addWorkspaceClient(workspaceFolder: WorkspaceFolder) {
  const workspacePath = workspaceFolder.uri.toString();
  if (!lspClients.has(workspacePath)) {
    // Start the client. This will also launch the server
    const client = new Client(workspaceFolder.uri, workspaceFolder);
    lspClients.set(workspacePath, client);
    await client.start();
  }
}

async function removeWorkspaceClient(workspaceFolder: WorkspaceFolder) {
  const workspacePath = workspaceFolder.uri.toString();
  const client = lspClients.get(workspacePath);
  if (client) {
    await client.stop();
    lspClients.delete(workspacePath);
  }
}

async function restartAllClients() {
  for (const client of lspClients.values()) {
    await client.restart();
  }
}

async function runNargoExpand() {
  const tdcp = new (class implements TextDocumentContentProvider {
    uri = Uri.parse('nargo-expand://expandMacro/[EXPANSION].nr');
    eventEmitter = new EventEmitter<Uri>();

    async provideTextDocumentContent(_uri: Uri): Promise<string> {
      const editor = window.activeTextEditor;
      if (!editor) return 'Not available';

      const document = editor.document;
      const workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.toString();
      const client = lspClients.get(workspaceFolder);
      if (!client) return 'Not available';

      const position = editor.selection.active;
      return await client.sendRequest<string>('nargo/expand', {
        textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(editor.document),
        position,
      });
    }

    get onDidChange(): Event<Uri> {
      return this.eventEmitter.event;
    }
  })();

  workspace.registerTextDocumentContentProvider('nargo-expand', tdcp);

  const document = await workspace.openTextDocument(tdcp.uri);
  tdcp.eventEmitter.fire(tdcp.uri);
  await window.showTextDocument(document, ViewColumn.Two, true);
}

async function didOpenTextDocument(document: TextDocument): Promise<Disposable> {
  // We are only interested in language mode text
  if (document.languageId !== languageId) {
    return Disposable.from();
  }

  const uri = document.uri;
  let folder = workspace.getWorkspaceFolder(uri);
  let configHandler;

  try {
    if (folder) {
      // If we have nested workspace folders we only start a server on the outer most workspace folder.
      folder = getOuterMostWorkspaceFolder(folder);

      await addWorkspaceClient(folder);

      const currentLspClient = lspClients.get(folder.uri.toString());
      const statusBarItem = getNoirStatusBarItem();
      statusBarItem.tooltip = currentLspClient.command;
      statusBarItem.show();

      registerWorkspaceCommands(folder);

      configHandler = mutex(folder.uri.toString(), async (e: ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('noir.nargoFlags', folder.uri)) {
          disposeWorkspaceCommands(folder);
          await removeWorkspaceClient(folder);
          await addWorkspaceClient(folder);
          registerWorkspaceCommands(folder);
        }

        if (e.affectsConfiguration('noir.nargoPath', folder.uri)) {
          disposeWorkspaceCommands(folder);
          await removeWorkspaceClient(folder);
          await addWorkspaceClient(folder);
          registerWorkspaceCommands(folder);
        }

        if (e.affectsConfiguration('noir.enableLSP', folder.uri)) {
          await removeWorkspaceClient(folder);
          await addWorkspaceClient(folder);
        }

        if (e.affectsConfiguration('noir.enableCodeLens', folder.uri)) {
          await removeWorkspaceClient(folder);
          await addWorkspaceClient(folder);
        }
      });
    } else {
      // We only want to handle `file:` and `untitled:` schemes because
      // vscode sends `output:` schemes for markdown responses from our LSP
      if (uri.scheme !== 'file' && uri.scheme !== 'untitled') {
        return Disposable.from();
      }

      // Each file outside of a workspace gets it's own client
      await addFileClient(uri);
      registerFileCommands(uri);

      configHandler = mutex(uri.toString(), async (e: ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('noir.nargoFlags', uri)) {
          disposeFileCommands(uri);
          await removeFileClient(uri);
          await addFileClient(uri);
          registerFileCommands(uri);
        }

        if (e.affectsConfiguration('noir.nargoPath', uri)) {
          disposeFileCommands(uri);
          await removeFileClient(uri);
          await addFileClient(uri);
          registerFileCommands(uri);
        }

        if (e.affectsConfiguration('noir.enableLSP', uri)) {
          await removeFileClient(uri);
          await addFileClient(uri);
        }
      });
    }

    return workspace.onDidChangeConfiguration(configHandler);
  } catch (e) {
    handleClientStartError(e);
  }
}

async function didChangeWorkspaceFolders(event: WorkspaceFoldersChangeEvent) {
  // Reset the workspace folders so it'll sort them again
  workspaceFolders = [];

  // Do nothing for newly added workspaces because their LSP will be booted
  // up when a file is opened

  // Remove any clients for workspaces that were closed
  for (const folder of event.removed) {
    await removeWorkspaceClient(folder);
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  const didOpenTextDocument$ = workspace.onDidOpenTextDocument(didOpenTextDocument);
  const didChangeWorkspaceFolders$ = workspace.onDidChangeWorkspaceFolders(didChangeWorkspaceFolders);
  const restart$ = commands.registerCommand('noir.restart', restartAllClients);
  const expand$ = commands.registerCommand('nargo.expand', runNargoExpand);

  context.subscriptions.push(didOpenTextDocument$, didChangeWorkspaceFolders$, restart$, expand$);

  for (const doc of workspace.textDocuments) {
    const disposable = await didOpenTextDocument(doc);
    context.subscriptions.push(disposable);
  }

  activateDebugger(context);

  await commands.executeCommand('setContext', NOIR_PROJECT_CONTEXT_NAME, true);
}

export async function deactivate(): Promise<void> {
  for (const client of lspClients.values()) {
    await client.stop();
  }

  await commands.executeCommand('setContext', NOIR_PROJECT_CONTEXT_NAME, undefined);
}
