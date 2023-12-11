import { EditorLineDecorationManager } from "./EditorLineDecorationManager";
import Client from "./client";

export let lspClients: Map<string, Client> = new Map();

export const editorLineDecorationManager = new EditorLineDecorationManager(
  lspClients
);
