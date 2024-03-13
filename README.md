# Noir Language Support for Visual Studio Code

Visual Studio Code extension for working with the [Noir programming language](https://noir-lang.org/).

## Features

This extension helps developers write, understand, and improve Noir code by providing:

- Syntax highlighting
- Compile errors and warnings on file save
- Run tests via codelens above each test
- Useful snippets for common code patterns
- Auto-format on save

## Requirements

For Language Server Protocol support, we require `nargo` v0.7.1+ to be in your `PATH`. You can check this by running `nargo --version` in your terminal and you can check for the `lsp` command by running `nargo --help`.

If you can't put `nargo` in your `PATH`, you can set an absolute path in the `Nargo Path` [setting](#settings).

## Settings

- **Noir: Enable LSP** _(noir.enableLSP)_ - If checked, the extension will launch the Language Server via `nargo lsp` and communicate with it.
- **Noir: Nargo Flags** _(noir.nargoFlags)_ - Additional flags may be specified if you require them to be added when the extension calls `nargo lsp`.
- **Noir: Nargo Path** _(noir.nargoPath)_ - An absolute path to a Nargo binary with the `lsp` command. This may be useful if Nargo is not within the `PATH` of your editor.
- **Noir > Trace: Server** _(noir.trace.server)_ - Setting this to `"messages"` or `"verbose"` will log LSP messages between the Client and Server. Useful for debugging.

## Changelog

You can find a full list of changes at https://github.com/noir-lang/vscode-noir/blob/master/CHANGELOG.md

## Working on project

The project provides a few useful commands via npm scripts:

- `npm run package` - Builds the project and packages it into a `.vsix` file which can be manually installed for testing.
- `npm run esbuild` - Builds the project with esbuild to output `out/extension.js` and `out/extension.js.map`.
- `npm run test-compile` - Check types with TypeScript. Useful since esbuild doesn't typecheck.
- `npm run format` - Formats all the code in the repository.
- `npm run check-format` - Checks the formatting in the repository.
