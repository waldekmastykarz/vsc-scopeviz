import * as vscode from 'vscode';
import { ScopevizPanel } from './scopevizPanel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('scopeviz.preview', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a readout JSON file first.');
        return;
      }
      ScopevizPanel.createOrShow(context.extensionUri, editor.document);
    })
  );

  // Live-reload on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      ScopevizPanel.updateIfVisible(doc);
    })
  );
}

export function deactivate() {}
