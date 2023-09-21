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
        return (listener: (data: Uint8Array) => void) => {
          // Sometimes (such as inside vscode.dev) the `data` is actually a SharedArrayBuffer, which can't be decoded
          // Instead, it needs to be copied and then decoded. Conversion code from https://stackoverflow.com/a/76916494
          return reader.onData((data) => {
            // Create a temporary ArrayBuffer and copy the contents of the shared buffer into it.
            const tempBuffer = new ArrayBuffer(data.byteLength);
            const tempView = new Uint8Array(tempBuffer);

            let sharedView = new Uint8Array(data);
            sharedView = sharedView.subarray(0, data.byteLength);
            tempView.set(sharedView);
            listener(sharedView);
          });
        };
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
