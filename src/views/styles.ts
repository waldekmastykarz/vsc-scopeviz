export function getStyles(): string {
  return `
    :root {
      --gap: 12px;
      --radius: 4px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px 20px;
      line-height: 1.5;
    }

    .readout-header {
      margin-bottom: 20px;
    }

    .readout-header h1 {
      font-size: 1.4em;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .subtitle {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9em;
      margin-top: 2px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section h2 {
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--vscode-descriptionForeground);
      margin-bottom: var(--gap);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      padding-bottom: 4px;
    }

    .divider {
      border: none;
      border-top: 1px dashed var(--vscode-widget-border, var(--vscode-panel-border));
      margin: 24px 0;
    }

    /* Lift/Drag Table */
    table.lift-table {
      width: 100%;
      border-collapse: collapse;
    }

    table.lift-table th {
      text-align: left;
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
      padding: 6px 10px;
      border-bottom: 2px solid var(--vscode-widget-border, var(--vscode-panel-border));
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    table.lift-table td {
      padding: 6px 10px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      vertical-align: top;
    }

    table.lift-table tr.row-lift { background: var(--vscode-diffEditor-insertedTextBackground, rgba(0,180,0,0.08)); }
    table.lift-table tr.row-drag { background: var(--vscode-diffEditor-removedTextBackground, rgba(255,0,0,0.08)); }
    table.lift-table tr.row-amber { background: rgba(255,180,0,0.1); }
    table.lift-table tr.row-baseline { background: transparent; }

    table.lift-table tr.expandable { cursor: pointer; }
    table.lift-table tr.expandable:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .expand-arrow {
      display: inline-block;
      transition: transform 0.15s;
      margin-right: 4px;
      font-size: 0.75em;
    }

    .expand-arrow.open { transform: rotate(90deg); }

    .expanded-row {
      display: none;
    }

    .expanded-row.visible {
      display: table-row;
    }

    .expanded-row td {
      padding: 8px 10px 12px 28px;
      background: var(--vscode-editor-background);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .expanded-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 6px 16px;
    }

    .expanded-content .metric {
      font-size: 0.9em;
    }

    .expanded-content .metric-label {
      color: var(--vscode-descriptionForeground);
      font-size: 0.85em;
    }

    .expanded-content .metric-value {
      font-weight: 600;
    }

    /* Criteria breakdown in expanded row */
    .criteria-table {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
    }

    .criteria-table th {
      text-align: left;
      padding: 4px 8px;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .criteria-table td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .criteria-table .annotation {
      color: var(--vscode-errorForeground);
      font-size: 0.9em;
      margin-left: 4px;
    }

    /* Action Cards */
    .action-card {
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: var(--radius);
      padding: 10px 14px;
      margin-bottom: 8px;
      cursor: pointer;
    }

    .action-card:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .action-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .priority-badge {
      font-weight: 700;
      font-size: 0.8em;
      border-radius: 3px;
      padding: 1px 6px;
    }

    .priority-p1 { color: var(--vscode-errorForeground); }
    .priority-p2 { color: var(--vscode-editorWarning-foreground, orange); }
    .priority-p3 { color: var(--vscode-descriptionForeground); }

    .action-label {
      font-weight: 600;
      flex: 1;
    }

    .action-meta {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
    }

    .badge {
      font-size: 0.75em;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      color: var(--vscode-descriptionForeground);
    }

    .action-detail {
      display: none;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      line-height: 1.6;
    }

    .action-card.open .action-detail {
      display: block;
    }

    .evidence-excerpt {
      background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1));
      border-left: 3px solid var(--vscode-textBlockQuote-border, var(--vscode-widget-border));
      padding: 6px 10px;
      margin: 6px 0;
    }

    .trajectory-link {
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      text-decoration: underline;
    }

    .trajectory-link:hover {
      color: var(--vscode-textLink-activeForeground);
    }

    .section-group-header {
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--vscode-descriptionForeground);
      margin: 14px 0 6px;
    }

    /* Evidence section */
    details {
      margin-bottom: 8px;
    }

    details > summary {
      cursor: pointer;
      font-weight: 600;
      padding: 6px 0;
      color: var(--vscode-foreground);
      list-style: none;
    }

    details > summary::before {
      content: '▶ ';
      font-size: 0.7em;
      display: inline-block;
      transition: transform 0.15s;
      margin-right: 4px;
    }

    details[open] > summary::before {
      transform: rotate(90deg);
    }

    /* Rate links and evidence panels */
    .rate-link {
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      text-decoration: underline;
    }

    .rate-link:hover {
      color: var(--vscode-textLink-activeForeground);
    }

    .evidence-panel {
      display: none;
      margin-top: 6px;
      padding: 8px 12px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: var(--radius);
      background: var(--vscode-editor-background);
    }

    .evidence-panel.visible {
      display: block;
    }

    .evidence-panel-title {
      font-weight: 600;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .evidence-item {
      padding: 6px 0;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .evidence-item:last-child {
      border-bottom: none;
    }

    .evidence-run-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .run-link {
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      text-decoration: underline;
    }

    .run-link:hover {
      color: var(--vscode-textLink-activeForeground);
    }

    .evidence-reason {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    /* Behavior table */
    .behavior-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .behavior-table th {
      text-align: left;
      padding: 4px 8px;
      color: var(--vscode-descriptionForeground);
      border-bottom: 2px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .behavior-table td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .behavior-category {
      font-weight: 600;
      text-transform: capitalize;
    }

    /* Runs section */
    .run-card {
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: var(--radius);
      margin-bottom: 6px;
    }

    .run-card-header {
      padding: 6px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .run-card-header:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .run-card-detail {
      display: none;
      padding: 8px 10px 10px 28px;
      border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .run-card.open .run-card-detail {
      display: block;
    }

    .run-status-pass { color: var(--vscode-testing-iconPassed, green); }
    .run-status-fail { color: var(--vscode-testing-iconFailed, red); }
    .run-status-skip { color: var(--vscode-descriptionForeground); }

    .gate-badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.8em;
      margin-right: 4px;
    }

    .gate-pass { background: var(--vscode-diffEditor-insertedTextBackground, rgba(0,180,0,0.15)); }
    .gate-fail { background: var(--vscode-diffEditor-removedTextBackground, rgba(255,0,0,0.15)); }
    .gate-na { background: var(--vscode-badge-background, rgba(127,127,127,0.15)); }

    .pass-rate-bar {
      display: inline-block;
      min-width: 50px;
    }

    .error-container {
      padding: 20px;
    }

    .error-container h2 {
      color: var(--vscode-errorForeground);
      margin-bottom: 10px;
    }

    .error-container ul {
      padding-left: 20px;
    }

    .error-container li {
      margin-bottom: 4px;
    }

    .narrative {
      padding: 8px 12px;
      margin-bottom: 12px;
      background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1));
      border-left: 3px solid var(--vscode-textLink-foreground);
      line-height: 1.6;
    }

    /* Keyboard shortcut hints */
    .kbd-hint {
      position: fixed;
      bottom: 8px;
      right: 12px;
      font-size: 0.75em;
      color: var(--vscode-descriptionForeground);
      opacity: 0.6;
    }

    .kbd-hint kbd {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      margin: 0 2px;
    }
  `;
}
