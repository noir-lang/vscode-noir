import { Wasm, WasmProcess } from "@vscode/wasm-wasi";
import {
  WorkspaceFolder,
  Uri,
  window,
  tests,
  TestRunProfileKind,
  Range,
  TestItem,
  TestMessage,
  TestController,
  CancellationToken,
  TestRunRequest,
} from "vscode";

import {
  BaseLanguageClient,
  LanguageClientOptions,
  ServerCapabilities,
  TextDocumentFilter,
} from "vscode-languageclient";

import { extensionName, languageId } from "../constants";
import { WasmMessageReader, WasmMessageWriter } from "../streams";

//@ts-ignore
import noirLspWasm from "./noir_lsp_wasm.wasm";

type NargoCapabilities = {
  nargo?: {
    tests?: {
      fetch: boolean;
      run: boolean;
      update: boolean;
    };
  };
};

type NargoTests = {
  package: string;
  uri: string;
  tests?: {
    id: string;
    label: string;
    uri: string;
    range: Range;
  }[];
};

type RunTestResult = {
  id: string;
  result: "pass" | "fail" | "error";
  message: string;
};

function globFromUri(uri: Uri, glob: string) {
  // globs always need to use `/`
  return `${uri.fsPath}${glob}`.replaceAll("\\", "/");
}

export default class WasmClient extends BaseLanguageClient {
  #uri: Uri;
  #process: WasmProcess;

  // This function wasn't added until vscode 1.81.0 so fake the type
  #testController: TestController & {
    invalidateTestResults?: (item: TestItem) => void;
  };

  constructor(uri: Uri, workspaceFolder?: WorkspaceFolder) {
    let outputChannel = window.createOutputChannel(extensionName, languageId);

    let documentSelector: TextDocumentFilter[] = [];
    if (workspaceFolder) {
      documentSelector.push(
        {
          scheme: "file",
          language: languageId,
          // Glob starts with `/` because it just appends both segments
          pattern: `${globFromUri(uri, "/**/*")}`,
        },
        // TODO: Need to figure out the scheme provided by vscode.dev and add it as another selector
        {
          scheme: "vscode-test-web",
          language: languageId,
        }
      );
    } else {
      documentSelector.push(
        {
          scheme: uri.scheme,
          language: languageId,
          pattern: `${globFromUri(uri, "")}`,
        },
        // TODO: Need to figure out the scheme provided by vscode.dev and add it as another selector
        {
          scheme: "vscode-test-web",
          language: languageId,
        }
      );
    }

    let clientOptions: LanguageClientOptions = {
      documentSelector,
      workspaceFolder,
      outputChannel,
    };

    super(languageId, extensionName, clientOptions);

    this.#uri = uri;

    // TODO: Figure out how to do type-safe onNotification
    this.onNotification("nargo/tests/update", (testData: NargoTests) => {
      this.#updateTests(testData);
    });

    this.registerFeature({
      fillClientCapabilities: () => {},
      initialize: (capabilities: ServerCapabilities & NargoCapabilities) => {
        if (typeof capabilities.nargo?.tests !== "undefined") {
          this.#testController = tests.createTestController(
            // We prefix with our ID namespace but we also tie these to the URI since they need to be unique
            `NoirWorkspaceTests-${uri.toString()}`,
            "Noir Workspace Tests"
          );

          if (capabilities.nargo.tests.fetch) {
            // TODO: reload a single test if provided as the function argument
            this.#testController.resolveHandler = async (test) => {
              await this.#fetchTests();
            };
            this.#testController.refreshHandler = async (token) => {
              await this.#refreshTests(token);
            };
          }

          if (capabilities.nargo.tests.run) {
            this.#testController.createRunProfile(
              "Run Tests",
              TestRunProfileKind.Run,
              async (request, token) => {
                await this.#runTest(request, token);
              },
              true
            );
          }
        }
      },
      getState: () => {
        return { kind: "static" };
      },
      dispose: () => {
        if (this.#testController) {
          this.#testController.dispose();
        }
      },
    });
  }

  async createMessageTransports() {
    const wasm: Wasm = await Wasm.load();

    const rootFileSystem = await wasm.createRootFileSystem([
      {
        kind: "vscodeFileSystem",
        mountPoint: this.#uri.fsPath,
        uri: this.#uri,
      },
    ]);

    try {
      //@ts-ignore
      const module = await WebAssembly.compile(noirLspWasm);

      this.outputChannel.appendLine(`Compiled wasm`);

      this.#process = await wasm.createProcess("noir-lsp", module, {
        stdio: {
          in: { kind: "pipeIn" },
          out: { kind: "pipeOut" },
          err: { kind: "pipeOut" },
        },
        trace: true,
        rootFileSystem,
      });

      // TODO: Need to handle stderr better
      this.#process.stderr.onData((err) => {
        this.outputChannel.appendLine(`err: ${err}`);
      });

      const result = this.#process.run();
      this.outputChannel.appendLine(`Process started`);
      result
        .then((exitCode) => {
          this.outputChannel.appendLine(
            `Process exited with code: ${exitCode}`
          );
        })
        .catch((err) => {
          this.outputChannel.appendLine(`Process exited with error: ${err}`);
        })
        .finally(() => {
          this.outputChannel.appendLine(`Process exited!`);
        });

      return {
        writer: new WasmMessageWriter(this.#process.stdin),
        reader: new WasmMessageReader(this.#process.stdout),
      };
    } catch (error) {
      // TODO: Bubble this error
      this.outputChannel.appendLine(`err: ${error.message}`);
    }
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public stop(timeout: number = 2000): Promise<void> {
    return super.stop(timeout).finally(() => {
      this.#process.terminate();
    });
  }

  async #fetchTests() {
    const response = await this.sendRequest<NargoTests[]>("nargo/tests", {});

    response.forEach((testData) => {
      this.#createTests(testData);
    });
  }

  async #refreshTests(token: CancellationToken) {
    const response = await this.sendRequest<NargoTests[]>(
      "nargo/tests",
      {},
      token
    );
    response.forEach((testData) => {
      this.#updateTests(testData);
    });
  }

  async #runTest(request: TestRunRequest, token: CancellationToken) {
    const run = this.#testController.createTestRun(request);
    const queue: TestItem[] = [];

    // Loop through all included tests, or all known tests, and add them to our queue
    if (request.include) {
      request.include.forEach((test) => queue.push(test));
    } else {
      this.#testController.items.forEach((test) => queue.push(test));
    }

    while (queue.length > 0 && !token.isCancellationRequested) {
      const test = queue.pop()!;

      // Skip tests the user asked to exclude
      if (request.exclude?.includes(test)) {
        continue;
      }

      // We don't run our test headers since they are just for grouping
      // but this is fine because the test pass/fail icons are propagated upward
      if (test.parent) {
        // If we have these tests, the server will be able to run them with this message
        const { id, result, message } = await this.sendRequest<RunTestResult>(
          "nargo/tests/run",
          {
            id: test.id,
          },
          token
        );

        // TODO: Handle `test.id !== id`. I'm not sure if it is possible for this to happen in normal usage

        if (result === "pass") {
          run.passed(test);
          continue;
        }

        if (result === "fail" || result === "error") {
          run.failed(test, new TestMessage(message));
          continue;
        }
      }

      // After tests are run (if any), we add any children to the queue
      test.children.forEach((test) => queue.push(test));
    }

    run.end();
  }

  #createTests(testData: NargoTests) {
    let pkg = this.#testController.createTestItem(
      testData.package,
      testData.package
    );

    testData.tests.forEach((test) => {
      // This normalizes the URI scheme and authority based on our workspace root, which is a workaround for the
      // custom `nargo` LSP messages not knowing about alternative, non-file schemes (such as `vscode-test-web://`)
      // TODO: Properly normalize the URIs inside of the LSP itself
      let uri = Uri.parse(test.uri).with({
        scheme: this.#uri.scheme,
        authority: this.#uri.authority,
      });
      let item = this.#testController.createTestItem(test.id, test.label, uri);
      item.range = test.range;
      pkg.children.add(item);
    });

    this.#testController.items.add(pkg);
  }

  #updateTests(testData: NargoTests) {
    // This function wasn't added until vscode 1.81.0 so we check for it
    if (typeof this.#testController.invalidateTestResults === "function") {
      let pkg = this.#testController.items.get(testData.package);
      this.#testController.invalidateTestResults(pkg);
    }

    this.#createTests(testData);
  }

  async start(): Promise<void> {
    this.info(`Starting LSP client using command WebAssembly`);

    await super.start();
  }

  async dispose(timeout?: number): Promise<void> {
    await super.dispose(timeout);
  }
}
