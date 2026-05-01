import * as vscode from 'vscode';
import { Readout } from './types';
import { tryParse } from './validation';
import { getHtml } from './views/shell';

export class ScopevizPanel {
  public static readonly viewType = 'scopeviz.preview';
  private static panels = new Map<string, ScopevizPanel>();

  private readonly panel: vscode.WebviewPanel;
  private readonly docUri: string;
  private readout: Readout | undefined;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const key = document.uri.toString();
    const existing = ScopevizPanel.panels.get(key);
    if (existing) {
      existing.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ScopevizPanel.viewType,
      `Readout: ${document.uri.path.split('/').pop()}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const instance = new ScopevizPanel(panel, document, extensionUri);
    ScopevizPanel.panels.set(key, instance);
  }

  static updateIfVisible(document: vscode.TextDocument) {
    const key = document.uri.toString();
    const instance = ScopevizPanel.panels.get(key);
    if (instance) {
      instance.update(document);
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument,
    private readonly extensionUri: vscode.Uri
  ) {
    this.panel = panel;
    this.docUri = document.uri.toString();
    this.update(document);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }

  private update(document: vscode.TextDocument) {
    const text = document.getText();
    const { readout, errors } = tryParse(text);
    this.readout = readout;
    const nonce = getNonce();
    this.panel.webview.html = getHtml(this.panel.webview, nonce, readout, errors);
  }

  private async handleMessage(msg: { command: string; path?: string; runId?: string }) {
    if (msg.command === 'openTrajectory') {
      const docUri = vscode.Uri.parse(this.docUri);
      const readoutDir = vscode.Uri.joinPath(docUri, '..');

      if (msg.path) {
        try {
          await this.openTrajectoryFile(vscode.Uri.joinPath(readoutDir, msg.path));
        } catch {
          vscode.window.showWarningMessage(`Could not open trajectory: ${msg.path}`);
        }
      } else if (msg.runId) {
        // Search for {runId}/trajectory.json under the readout directory
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

  private dispose() {
    ScopevizPanel.panels.delete(this.docUri);
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
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
