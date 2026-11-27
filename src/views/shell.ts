import * as vscode from 'vscode';
import { Readout } from '../types';
import { buildReadoutPresentation } from '../presentation';

export function getHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  nonce: string,
  readout?: Readout,
  errors?: string[]
): string {
  const media = vscode.Uri.joinPath(extensionUri, 'media');
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(media, 'readout.css'));
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(media, 'readout.js'));
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource}`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`
  ].join('; ');
  const head = (title: string) => `<meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>${escapeHtml(title)}</title>`;

  if (errors && errors.length > 0) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  ${head('Scope readout')}
</head>
<body>
  <div class="frame">
    <section class="hero">
      <h1 class="hang">Not a valid Scope readout</h1>
      <ul class="measure">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
    </section>
  </div>
</body>
</html>`;
  }

  if (!readout) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  ${head('Scope readout')}
</head>
<body><div class="frame"><p class="empty">No data.</p></div></body>
</html>`;
  }

  // JSON in a non-executable script block; escaping '<' keeps readout text from closing the element.
  const data = JSON.stringify({ readout, presentation: buildReadoutPresentation(readout) }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${head(`${readout.metadata.title} · Scope readout`)}
</head>
<body>
  <div class="frame">
    <main id="app"></main>
  </div>
  <div class="kbd-hint" aria-hidden="true"><kbd>1</kbd> Lift/drag <kbd>2</kbd> Changes <kbd>3</kbd> Evidence</div>
  <div class="toast" role="status" aria-live="polite"></div>
  <script type="application/json" id="readout-data">${data}</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
