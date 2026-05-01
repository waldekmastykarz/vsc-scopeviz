import * as vscode from 'vscode';
import { Readout } from '../types';
import { getStyles } from './styles';
import { getScript } from './script';

export function getHtml(
  webview: vscode.Webview,
  nonce: string,
  readout?: Readout,
  errors?: string[]
): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`;

  if (errors && errors.length > 0) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">${getStyles()}</style>
  <title>Scopeviz</title>
</head>
<body>
  <div class="error-container">
    <h2>Not a valid Scope readout</h2>
    <ul>${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
  </div>
</body>
</html>`;
  }

  if (!readout) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Scopeviz</title>
</head>
<body><p>No data.</p></body>
</html>`;
  }

  const dataJson = JSON.stringify(readout);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">${getStyles()}</style>
  <title>${escapeHtml(readout.metadata.title)} — Readout</title>
</head>
<body>
  <header class="readout-header">
    <h1>${escapeHtml(readout.metadata.title)}</h1>
    <p class="subtitle">${escapeHtml(readout.metadata.harness)} · ${escapeHtml(readout.metadata.model)} · ${readout.metadata.runsPerProfile} runs/profile</p>
  </header>

  <section id="section-lift" class="section">
    <h2>Lift / Drag</h2>
    <div id="lift-table"></div>
  </section>

  <section id="section-change" class="section">
    <h2>What to Change</h2>
    <div id="action-list"></div>
  </section>

  <hr class="divider">

  <section id="section-evidence" class="section">
    <h2>Supporting Evidence</h2>
    <details id="evidence-scores">
      <summary>Scores (gates, dimensions, criteria)</summary>
      <div id="scores-content"></div>
    </details>
    <details id="evidence-behaviors">
      <summary>Behaviors (what the agent did)</summary>
      <div id="behaviors-content"></div>
    </details>
    <details id="evidence-runs">
      <summary>Runs</summary>
      <div id="runs-content"></div>
    </details>
  </section>

  <script nonce="${nonce}">
    const readout = ${dataJson};
    ${getScript()}
  </script>
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
