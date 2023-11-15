import {
  workspace,
  Disposable,
  window,
  TextEditorSelectionChangeEvent,
  Range,
  TextEditorDecorationType,
  DecorationRangeBehavior,
} from "vscode";
import Client from "./client";

const decoration: TextEditorDecorationType =
  window.createTextEditorDecorationType({
    after: {
      margin: "0 0 0 3em",
      textDecoration: "none",
    },
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  });

export class EditorLineDecorationManager extends Disposable {
  #didChangeActiveTextEditor: Disposable;
  lspClients: Map<string, Client>;
  // activeClient: Client;

  constructor(lspClients: Map<string, Client>) {
    super(() => {});

    this.lspClients = lspClients;

    window.onDidChangeActiveTextEditor((editor) => {
      // this.updateActiveLspClient();
      this.displayAllTextDecorations();
    });

    // window.onDidChangeTextEditorSelection(
    //   (event: TextEditorSelectionChangeEvent) =>
    //     this.didChangeTextEditorSelection(event)
    // );
  }

  displayAllTextDecorations() {
    const document = window.activeTextEditor.document;
    
    let workspaceFolder = workspace
      .getWorkspaceFolder(document.uri)
      .uri.toString();
    const activeClient = this.lspClients.get(workspaceFolder);
    

    const decorations = [];
    activeClient.profileRunResult.opcodes_counts.forEach((element) => {
      const spanInfo = element[0];
      const countInfo = element[1];

      const position = document.positionAt(
        spanInfo.span.start
      );

        decorations.push({
          range: document.lineAt(position.line).range,
          content: `// ${countInfo.acir_size ? `${countInfo.acir_size} ACIR` : ""} ${
            countInfo.brillig_size ? `${countInfo.brillig_size} ACIR` : ""
          } opcodes`
        });
    });
    updateDecorations(decorations);

  }

  hideDecorations() {
    window.activeTextEditor.setDecorations(decoration, []);
  }

  // didChangeTextEditorSelection(event) {
  //   this.activeClient.profileRunResult.opcodes_counts.forEach((element) => {
  //     const spanInfo = element[0];
  //     const countInfo = element[1];

  //     const position = event?.textEditor.document.positionAt(
  //       spanInfo.span.start
  //     );

  //     if (position.line === event?.selections[0].anchor.line) {
  //       console.log(position, countInfo);
  //       updateDecorations(
  //         event?.textEditor.document.lineAt(position.line).range,
  //         `// ${countInfo.acir_size ? `${countInfo.acir_size} ACIR` : ""} ${
  //           countInfo.brillig_size ? `${countInfo.brillig_size} ACIR` : ""
  //         } opcodes`
  //       );
  //     } else {
  //       clearDecorations();
  //     }
  //   });
  // }

  // updateActiveLspClient() {
  //   const activeFileUri = window.activeTextEditor.document.uri;

  //   let workspaceFolder = workspace
  //     .getWorkspaceFolder(activeFileUri)
  //     .uri.toString();
  //   const activeClient = this.lspClients.get(workspaceFolder);
  //   this.activeClient = activeClient;
  // }

  dispose() {
    this.#didChangeActiveTextEditor.dispose();
  }
}

function updateDecorations(contentForRange: any[]) {

  let decorations = contentForRange.map(({range, content}) => {
    return {
      range,
      renderOptions: {
        after: {
          // backgroundColor: new ThemeColor('trailingLineBackgroundColor' ),
          // color: new ThemeColor('trailingLineForegroundColor' ),
          contentText: content,
          fontWeight: "normal",
          fontStyle: "normal",
          // Pull the decoration out of the document flow if we want to be scrollable
          textDecoration: `none; position: absolute;`,
        },
      },
      }
  });
  window.activeTextEditor.setDecorations(decoration, decorations);
}

