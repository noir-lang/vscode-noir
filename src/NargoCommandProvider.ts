import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { TaskPanelKind, TaskRevealKind, TaskScope } from 'vscode';

export const NargoTaskType = "nargo";
export const NargoCompileCommandId = "nargo.compile";

async function exists(file: string): Promise<boolean> {
    try {
        await fs.promises.access(file);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        } else {
            throw err;
        }
    }
}

interface NargoTaskDefinition extends vscode.TaskDefinition {
	task: string;
}

export async function nargoCompileCommand(): Promise<vscode.TaskExecution> {
    let activeDocument = vscode.window.activeTextEditor.document;
    let nargoPackageDirname = path.dirname(activeDocument.fileName);
    if (path.basename(nargoPackageDirname) === "src") {
        nargoPackageDirname = path.dirname(nargoPackageDirname);
    }

    let nargoBaseDirname = path.basename(nargoPackageDirname);
    if (!nargoPackageDirname) {
        return ;
    }

    const nargoFile = path.join(nargoPackageDirname, 'Nargo.toml');
    if (!await exists(nargoFile)) {
        return ;
    }

    let workspaceFolder = vscode.workspace.getWorkspaceFolder(activeDocument.uri);

    let taskName = "compile";
    const kind: NargoTaskDefinition = {
        type: NargoTaskType,
        task: taskName
    };

    let shellExecution = new vscode.ShellExecution(`nargo ${taskName} ${nargoBaseDirname} --contracts --experimental-ssa`, { cwd: nargoPackageDirname });
    const task = new vscode.Task(kind, TaskScope.Workspace, taskName, "noir", shellExecution);
    task.group = vscode.TaskGroup.Build;
    
    task.presentationOptions = {
        reveal: TaskRevealKind.Always,
        panel: TaskPanelKind.Dedicated,
        clear: true,
      };

	return vscode.tasks.executeTask(task);
    
}