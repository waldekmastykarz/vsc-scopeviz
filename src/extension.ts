import * as vscode from 'vscode';
import { ScopevizEditorProvider } from './scopevizPanel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ScopevizEditorProvider.register(context)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('scopeviz.preview', async () => {
      await vscode.commands.executeCommand(
        'reopenActiveEditorWith',
        ScopevizEditorProvider.viewType
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('scopeviz.showSource', async () => {
      await vscode.commands.executeCommand('reopenActiveEditorWith', 'default');
    })
  );
}

export function deactivate() {}
