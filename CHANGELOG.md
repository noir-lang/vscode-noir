# Changelog

## [0.0.17](https://github.com/noir-lang/vscode-noir/compare/v0.0.16...v0.0.17) (2025-07-14)


### Features

* `while` and other syntax highlighting ([#106](https://github.com/noir-lang/vscode-noir/issues/106)) ([47d506c](https://github.com/noir-lang/vscode-noir/commit/47d506cd8048f2d112cf55a43d00590206cb71f3))
* allow running `nargo expand` ([#104](https://github.com/noir-lang/vscode-noir/issues/104)) ([63e2ce5](https://github.com/noir-lang/vscode-noir/commit/63e2ce56b46595c7c0f84499ddb1c4de6c6a5ae0))
* **codelens:** trigger debugger on 'Debug test' command ([#3](https://github.com/noir-lang/vscode-noir/issues/3)) ([#100](https://github.com/noir-lang/vscode-noir/issues/100)) ([fca148c](https://github.com/noir-lang/vscode-noir/commit/fca148c9f5570dfbe5426864dff204ed8dd7108d))

## [0.0.16](https://github.com/noir-lang/vscode-noir/compare/v0.0.15...v0.0.16) (2025-02-04)


### Features

* add `loop`, `enum` and `match` keywords ([#97](https://github.com/noir-lang/vscode-noir/issues/97)) ([1fde58d](https://github.com/noir-lang/vscode-noir/commit/1fde58dff66b91bc757cb80ea86655ebe6ce8ca0))


### Bug Fixes

* find nargo in path if `nargoPath` is blank ([#99](https://github.com/noir-lang/vscode-noir/issues/99)) ([73b684a](https://github.com/noir-lang/vscode-noir/commit/73b684a99e40c656ac6f0e161e48d238f64a31ca))

## [0.0.15](https://github.com/noir-lang/vscode-noir/compare/v0.0.14...v0.0.15) (2025-01-10)


### Features

* better syntax highlighting for strings ([#95](https://github.com/noir-lang/vscode-noir/issues/95)) ([16d9956](https://github.com/noir-lang/vscode-noir/commit/16d9956a0031819879d9ef959b8fbbb99d8ac8c2))

## [0.0.14](https://github.com/noir-lang/vscode-noir/compare/v0.0.13...v0.0.14) (2025-01-08)


### Features

* expand `${workspaceFolder}` in `nargoPath` setting ([#91](https://github.com/noir-lang/vscode-noir/issues/91)) ([cf4b161](https://github.com/noir-lang/vscode-noir/commit/cf4b16138f9bfed0fc2555bf6b0dfffb8bea6d6e))
* remove `distinct` keyword ([#86](https://github.com/noir-lang/vscode-noir/issues/86)) ([2376b85](https://github.com/noir-lang/vscode-noir/commit/2376b85cf7bf78d738cb8e8ecfdd85c44da85ad8))
* some syntax highlighting improvements ([#93](https://github.com/noir-lang/vscode-noir/issues/93)) ([ed74a75](https://github.com/noir-lang/vscode-noir/commit/ed74a757afb0b6da10dd854df2cd5cbd5ab79662))

## [0.0.13](https://github.com/noir-lang/vscode-noir/compare/v0.0.12...v0.0.13) (2024-06-21)


### Features

* add language icon for noir files ([#82](https://github.com/noir-lang/vscode-noir/issues/82)) ([6c71a1e](https://github.com/noir-lang/vscode-noir/commit/6c71a1eb3e7de86d808824ae529045ff7e41504f))

## [0.0.12](https://github.com/noir-lang/vscode-noir/compare/v0.0.11...v0.0.12) (2024-03-13)


### Features

* add support for nargo DAP ([#51](https://github.com/noir-lang/vscode-noir/issues/51)) ([369fa91](https://github.com/noir-lang/vscode-noir/commit/369fa917a34fbf7d5b8c25600df314217955944f))

## [0.0.11](https://github.com/noir-lang/vscode-noir/compare/v0.0.10...v0.0.11) (2024-03-04)


### Bug Fixes

* update tooltip when selecting nargo binary ([#73](https://github.com/noir-lang/vscode-noir/issues/73)) ([daf62f4](https://github.com/noir-lang/vscode-noir/commit/daf62f4bd9012d9a47f32fae1a37dfdf05467ca3))

## [0.0.10](https://github.com/noir-lang/vscode-noir/compare/v0.0.9...v0.0.10) (2024-03-04)


### Features

* add `unchecked` keyword highlighting ([#72](https://github.com/noir-lang/vscode-noir/issues/72)) ([47e5b3c](https://github.com/noir-lang/vscode-noir/commit/47e5b3c22ef2994ee4028fec93d0fbcc2db5b383))
* add keyword highlighting for databus visibility keywords ([#68](https://github.com/noir-lang/vscode-noir/issues/68)) ([fe14627](https://github.com/noir-lang/vscode-noir/commit/fe14627ed4ea6dc7c81ebb96eecd4256652ddb1d))
* **aztec:** search for aztec-nargo on top of nargo bin ([#67](https://github.com/noir-lang/vscode-noir/issues/67)) ([0be02a5](https://github.com/noir-lang/vscode-noir/commit/0be02a573bb48435f36e9517c4b69a2d7b633f96))
* introduce setting to disable Code Lens feature ([#64](https://github.com/noir-lang/vscode-noir/issues/64)) ([2ef2925](https://github.com/noir-lang/vscode-noir/commit/2ef2925ca9d9d2e3002f0d862a1f3f0c9fb8ef90))

## [0.0.9](https://github.com/noir-lang/vscode-noir/compare/v0.0.8...v0.0.9) (2023-12-13)


### Features

* Added format configuration defaults for noir ([#55](https://github.com/noir-lang/vscode-noir/issues/55)) ([5152918](https://github.com/noir-lang/vscode-noir/commit/51529189194d955785b70335061c4d121c851a98))

## [0.0.8](https://github.com/noir-lang/vscode-noir/compare/v0.0.7...v0.0.8) (2023-11-29)


### Features

* add opcodes profile information ([#45](https://github.com/noir-lang/vscode-noir/issues/45)) ([78e529a](https://github.com/noir-lang/vscode-noir/commit/78e529ac0137eda2d98857cc7c7dfa73edab075d))


### Bug Fixes

* document handling ([#49](https://github.com/noir-lang/vscode-noir/issues/49)) ([f3d2a54](https://github.com/noir-lang/vscode-noir/commit/f3d2a5415518ba4c6c11510a5a7002be9e07aba1))

## [0.0.7](https://github.com/noir-lang/vscode-noir/compare/v0.0.6...v0.0.7) (2023-11-18)


### Features

* Update language grammar ([#46](https://github.com/noir-lang/vscode-noir/issues/46)) ([85d3d4d](https://github.com/noir-lang/vscode-noir/commit/85d3d4d1570680b81170ec332695354870e43c17))

## [0.0.6](https://github.com/noir-lang/vscode-noir/compare/v0.0.5...v0.0.6) (2023-10-05)


### Features

* add support for "info" codelens to call `nargo info` ([#42](https://github.com/noir-lang/vscode-noir/issues/42)) ([6e5746b](https://github.com/noir-lang/vscode-noir/commit/6e5746b0894f88b74bba0e5ece9f7bd68b0487b2))

## [0.0.5](https://github.com/noir-lang/vscode-noir/compare/v0.0.4...v0.0.5) (2023-09-15)


### Features

* Implement Testing Panel via custom LSP messages ([#39](https://github.com/noir-lang/vscode-noir/issues/39)) ([890b606](https://github.com/noir-lang/vscode-noir/commit/890b606a36127297aeb8a961bee20a4757cfb531))

## [0.0.4](https://github.com/noir-lang/vscode-noir/compare/v0.0.3...v0.0.4) (2023-08-16)


### Features

* Add compile command to handle Compile code lens ([#30](https://github.com/noir-lang/vscode-noir/issues/30)) ([c88a397](https://github.com/noir-lang/vscode-noir/commit/c88a397dd18b80e99a361995312389e40e3edf0a))
* Add execute command to handle Execute code lens ([#31](https://github.com/noir-lang/vscode-noir/issues/31)) ([7eb8a52](https://github.com/noir-lang/vscode-noir/commit/7eb8a52543c09fcf11b18d168be262fb51f43bf7))
* Handle nargo.test command when executed by codelens ([#25](https://github.com/noir-lang/vscode-noir/issues/25)) ([d901967](https://github.com/noir-lang/vscode-noir/commit/d901967cb51f0bc76199d984ba9465ab74cd3c43))


### Bug Fixes

* Accept multiple arguments for a registered command ([#29](https://github.com/noir-lang/vscode-noir/issues/29)) ([0185ff4](https://github.com/noir-lang/vscode-noir/commit/0185ff47acd3e4aa8da4a9149c407ba0a1526b48))

## [0.0.3](https://github.com/noir-lang/vscode-noir/compare/v0.0.2...v0.0.3) (2023-06-26)


### Bug Fixes

* Change display name to avoid marketplace collision ([#21](https://github.com/noir-lang/vscode-noir/issues/21)) ([60d5cfb](https://github.com/noir-lang/vscode-noir/commit/60d5cfb4f932275ec1a0c02cb23f8d9364f9af88))

## [0.0.2](https://github.com/noir-lang/vscode-noir/compare/v0.0.1...v0.0.2) (2023-06-26)


### Features

* Implement LSP client ([#3](https://github.com/noir-lang/vscode-noir/issues/3)) ([1a4933d](https://github.com/noir-lang/vscode-noir/commit/1a4933df7709ad196006a084358e96b9fa0303c9))
