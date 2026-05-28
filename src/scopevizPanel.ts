import * as vscode from 'vscode';
import { Readout } from './types';
import { tryParse } from './validation';
import { getHtml } from './views/shell';

export class ScopevizEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'scopeviz.preview';

  constructor(private readonly extensionUri: vscode.Uri) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ScopevizEditorProvider(context.extensionUri);
    return vscode.window.registerCustomEditorProvider(
      ScopevizEditorProvider.viewType,
      provider,
      { supportsMultipleEditorsPerDocument: false }
    );
  }

  public resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.iconPath = new vscode.ThemeIcon('graph-line');

    const update = () => {
      const text = document.getText();
      const { readout, errors } = tryParse(text);
      const nonce = getNonce();
      webviewPanel.webview.html = getHtml(webviewPanel.webview, nonce, readout, errors);
    };

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        update();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((msg) =>
      this.handleMessage(document.uri, msg)
    );

    update();
  }

  private async handleMessage(
    docUri: vscode.Uri,
    msg: { command: string; path?: string; runId?: string }
  ) {
    if (msg.command === 'openTrajectory') {
      const readoutDir = vscode.Uri.joinPath(docUri, '..');

      if (msg.path) {
        try {
          await this.openTrajectoryFile(vscode.Uri.joinPath(readoutDir, msg.path));
        } catch {
          vscode.window.showWarningMessage(`Could not open trajectory: ${msg.path}`);
        }
      } else if (msg.runId) {
        const pattern = new vscode.RelativePattern(readoutDir, `**/${msg.runId}/trajectory.json`);
        const files = await vscode.workspace.findFiles(pattern, null, 1);
        if (files.length > 0) {
          try {
            await this.openTrajectoryFile(files[0]);
          } catch {
            vscode.window.showWarningMessage(`Could not open trajectory for run ${msg.runId}`);
          }
        } else {
          vscode.window.showWarningMessage(`Could not find trajectory for run ${msg.runId}`);
        }
      }
    }
  }

  private async openTrajectoryFile(uri: vscode.Uri) {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    await vscode.commands.executeCommand('atif-visualizer.preview');
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
