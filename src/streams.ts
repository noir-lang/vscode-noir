import { Readable, Writable } from "@vscode/wasm-wasi";
import {
  Disposable,
  ReadableStreamMessageReader,
  WriteableStreamMessageWriter,
} from "vscode-languageclient";

/**
 * These are a hack to fulfill the MessageReader and MessageWriter interfaces
 * on top of the Readable/Writable streams provided by @vscode/wasm-wasi
 *
 * We use extend the ReadableStreamMessageReader and WriteableStreamMessageWriter classes
 * because they have the logic for pulling from RAL.ReadableStream and RAL.Writable stream;
 * however, we have to mock some functions they expect. NOTE: There are likely bugs with not implementing these
 *
 * Ideally, the Readable and Writable should just implement the RAL interfaces upstream.
 **/

export class WasmMessageReader extends ReadableStreamMessageReader {
  constructor(reader: Readable) {
    super({
      get onData() {
        return reader.onData;
      },
      onClose(listener: () => void): Disposable {
        return Disposable.create(() => {});
      },
      onEnd(listener: () => void): Disposable {
        return Disposable.create(() => {});
      },
      onError(listener: (error: any) => void): Disposable {
        return Disposable.create(() => {});
      },
    });
  }
}

export class WasmMessageWriter extends WriteableStreamMessageWriter {
  constructor(writer: Writable) {
    super({
      write(chunk: Uint8Array | string, encoding?: "utf-8") {
        if (typeof chunk === "string") {
          return writer.write(chunk, encoding);
        } else {
          return writer.write(chunk);
        }
      },
      onClose(listener: () => void): Disposable {
        return Disposable.create(() => {});
      },
      onEnd(listener: () => void): Disposable {
        return Disposable.create(() => {});
      },
      onError(listener: (error: any) => void): Disposable {
        return Disposable.create(() => {});
      },
      end() {},
    });
  }
}
