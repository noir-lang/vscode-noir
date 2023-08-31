import which from "which";

const nargoBinaries = ["nargo"];

export default function findNargo() {
  for (const bin of nargoBinaries) {
    try {
      const nargo = which.sync(bin);
      // If it didn't throw, we found a nargo binary
      return nargo;
    } catch (err) {
      // Not found
    }
  }
  throw new Error("Unable to locate any nargo binary. Did you install it?");
}
