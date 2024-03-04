import { MarkdownString, StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode';
import { EditorLineDecorationManager } from './EditorLineDecorationManager';
import Client from './client';

export const lspClients: Map<string, Client> = new Map();

export const editorLineDecorationManager = new EditorLineDecorationManager(lspClients);

let noirStatusBarItem: StatusBarItem;

export function getNoirStatusBarItem() {
  if (noirStatusBarItem) {
    return noirStatusBarItem;
  }
  // Create Nargo Status bar item, we only need one for lifetime of plugin
  // we will show/update it depending on file user is working with
  noirStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  noirStatusBarItem.text = 'Nargo';
  noirStatusBarItem.command = 'nargo.config.path.select';

  return noirStatusBarItem;
}

export class NargoNotFoundError extends Error {
  constructor(markdownMessage?: MarkdownString) {
    super(markdownMessage.value);

    this.markdownMessage = markdownMessage;
  }

  markdownMessage: MarkdownString;
}

export function handleClientStartError(err: Error) {
  if (err instanceof NargoNotFoundError) {
    const backgroundColor = new ThemeColor('statusBarItem.errorBackground');
    const foregroundColor = new ThemeColor('statusBarItem.errorForeground');

    const statusBarItem = getNoirStatusBarItem();
    statusBarItem.backgroundColor = backgroundColor;
    statusBarItem.color = foregroundColor;
    statusBarItem.tooltip = err.markdownMessage;
    statusBarItem.show();
  } else {
    throw err;
  }
}
