import {
  workspace,
  Disposable,
  window,
  Range,
  TextEditorDecorationType,
  DecorationRangeBehavior,
  ThemeColor,
  commands,
  TextDocument,
} from 'vscode';
import Client, { FileInfo, OpcodesCounts } from './client';

const decoration: TextEditorDecorationType = window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 3em',
    textDecoration: 'none',
  },
  rangeBehavior: DecorationRangeBehavior.ClosedOpen,
});

type LineAccumulatedOpcodes = {
  ranges: { range: Range; countInfo: OpcodesCounts }[];
  lineOpcodes: { acir_size: number; brillig_size: number };
};

export class EditorLineDecorationManager extends Disposable {
  #didChangeActiveTextEditor: Disposable;
  lspClients: Map<string, Client>;

  constructor(lspClients: Map<string, Client>) {
    super(() => {});

    this.lspClients = lspClients;

    window.onDidChangeActiveTextEditor((_editor) => {
      this.displayAllTextDecorations();
    });
  }

  displayAllTextDecorations() {
    const document = window?.activeTextEditor?.document;

    if (document) {
      const workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.toString();

      const activeClient = this.lspClients.get(workspaceFolder);

      if (activeClient?.profileRunResult) {
        // find file which we want to present hints for
        const [fileIdKey, _] = Object.entries(activeClient.profileRunResult.file_map).find(
          ([_fileId, fileElement]) => fileElement.path === document.uri.path,
        ) as [string, FileInfo];

        const fileId = Number(fileIdKey);

        // Filter counts for file of interest
        const filteredResults = activeClient.profileRunResult.opcodes_counts.filter(([spanInfo, _]) => {
          return spanInfo.file === fileId;
        });

        // Sum Opcodes for lines
        const lineAccumulatedOpcodes: Record<number, { ranges: { range: Range; countInfo: OpcodesCounts }[] }> =
          filteredResults
            .map(([spanInfo, countInfo]) => {
              const startPosition = document.positionAt(spanInfo.span.start);
              const endPosition = document.positionAt(spanInfo.span.end);

              const range = new Range(startPosition, endPosition);

              return { range, countInfo };
            })
            // Lets accumulate ranges by line numbers
            .reduce(
              (accumulator, { range, countInfo }) => {
                let lineInfo = accumulator[range.end.line];
                if (!lineInfo) {
                  lineInfo = { ranges: [] };
                }
                lineInfo.ranges.push({ range, countInfo });
                accumulator[range.end.line] = lineInfo;
                return accumulator;
              },
              {} as Record<number, { ranges: { range: Range; countInfo: OpcodesCounts }[] }>,
            );

        // Count opcodes per line in accumulated collection
        (Object.values(lineAccumulatedOpcodes) as LineAccumulatedOpcodes[]).forEach((lineInfo) => {
          lineInfo.lineOpcodes = lineInfo.ranges.reduce(
            ({ acir_size, brillig_size }, { countInfo }) => {
              acir_size = acir_size + countInfo.acir_size;
              brillig_size = brillig_size + countInfo.brillig_size;
              return { acir_size, brillig_size };
            },
            { acir_size: 0, brillig_size: 0 },
          );
        });

        updateDecorations(document, lineAccumulatedOpcodes as Record<number, LineAccumulatedOpcodes>);

        // Used to show Hide Commands in Command Pallette
        commands.executeCommand('setContext', 'noir.profileInfoPresent', true);
      }
    }
  }

  // Remove all decorations including onHover ones
  hideDecorations() {
    window.activeTextEditor.setDecorations(decoration, []);
  }

  dispose() {
    this.#didChangeActiveTextEditor.dispose();
  }
}

function updateDecorations(document: TextDocument, lineAccumulatedOpcodes: Record<number, LineAccumulatedOpcodes>) {
  const decorations = Object.entries(lineAccumulatedOpcodes)
    .flatMap(([lineNumber, lineInfo]) => {
      const decorators = [];

      const lineDecorators = lineDecorator(document, lineNumber, lineInfo);
      decorators.push(lineDecorators);

      const hoverDecorators = lineInfo.ranges.map(({ range, countInfo }) => {
        const hoverMessage = `${countInfo.acir_size ? `${countInfo.acir_size} ACIR` : ''} ${
          countInfo.brillig_size ? `${countInfo.brillig_size} Brillig` : ''
        } opcodes`;
        return {
          range,
          hoverMessage,
        };
      });
      decorators.push(hoverDecorators);

      return decorators;
    })
    .flat();

  window?.activeTextEditor?.setDecorations(decoration, decorations);
}

function lineDecorator(document: TextDocument, lineNumber: string, lineInfo: LineAccumulatedOpcodes) {
  const range: Range = document.lineAt(Number(lineNumber)).range;
  const lineContent = `// ${lineInfo.lineOpcodes.acir_size ? `${lineInfo.lineOpcodes.acir_size} ACIR` : ''} ${
    lineInfo.lineOpcodes.brillig_size ? `${lineInfo.lineOpcodes.brillig_size} Brillig` : ''
  } opcodes`;
  const decorator = {
    range,
    renderOptions: {
      after: {
        backgroundColor: new ThemeColor('editorInlayHint.background'),
        color: new ThemeColor('editorInlayHint.foreground'),
        contentText: lineContent,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: `none; position: absolute;`,
      },
    },
  };
  return decorator;
}
