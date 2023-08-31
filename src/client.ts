import { workspace, WorkspaceFolder, Uri, window, OutputChannel } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TextDocumentFilter,
} from "vscode-languageclient/node";

import { extensionName, languageId } from "./constants";
import findNargo from "./find-nargo";

function globFromUri(uri: Uri, glob: string) {
  // globs always need to use `/`
  return `${uri.fsPath}${glob}`.replaceAll("\\", "/");
}

function getLspCommand(uri: Uri) {
  let config = workspace.getConfiguration("noir", uri);

  let lspEnabled = config.get<boolean>("enableLSP");

  if (!lspEnabled) {
    return;
  }

  let command = config.get<string | undefined>("nargoPath") || findNargo();

  let flags = config.get<string | undefined>("nargoFlags") || "";

  // Remove empty strings from the flags list
  let args = ["lsp", ...flags.split(" ")].filter((arg) => arg !== "");

  return [command, args] as const;
}

export default class Client extends LanguageClient {
  #uri: Uri;
  #command: string;
  #args: string[];
  #output: OutputChannel;

  constructor(uri: Uri, workspaceFolder?: WorkspaceFolder) {
    let outputChannel = window.createOutputChannel(extensionName, languageId);

    let [command, args] = getLspCommand(uri);

    let documentSelector: TextDocumentFilter[] = [];
    if (workspaceFolder) {
      documentSelector.push({
        scheme: "file",
        language: languageId,
        // Glob starts with `/` because it just appends both segments
        pattern: `${globFromUri(uri, "/**/*")}`,
      });
    } else {
      documentSelector.push({
        scheme: uri.scheme,
        language: languageId,
        pattern: `${globFromUri(uri, "")}`,
      });
    }

    let clientOptions: LanguageClientOptions = {
      documentSelector,
      workspaceFolder,
      outputChannel,
    };

    let serverOptions: ServerOptions = {
      command,
      args,
    };

    super(languageId, extensionName, serverOptions, clientOptions);

    this.#uri = uri;
    this.#command = command;
    this.#args = args;
    this.#output = outputChannel;
  }

  async start(): Promise<void> {
    this.info(
      `Starting LSP client using command: ${this.#command} ${this.#args.join(
        " "
      )}`
    );

    await super.start();
  }

  async dispose(timeout?: number): Promise<void> {
    await super.dispose(timeout);
  }
}
