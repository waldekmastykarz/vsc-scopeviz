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
      font-size: 1.15em;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: var(--gap);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      padding-bottom: 4px;
    }

    .section h3 {
      font-size: 0.85em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
      margin: 14px 0 6px;
    }

    .section h4 {
      font-size: 0.9em;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 10px 0 4px;
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
    table.lift-table tr.expandable .expand-arrow {
      opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    table.lift-table tr.expandable:hover .expand-arrow,
    table.lift-table tr.expandable.expanded .expand-arrow {
      opacity: 1;
    }
    table.lift-table tr.expandable:hover {
      background: var(--vscode-list-hoverBackground);
    }

    /* Remove bottom border when expanded so header + detail feel joined */
    table.lift-table tr.expandable.expanded td {
      border-bottom: none;
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
      padding: 10px 10px 14px 28px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-left: 3px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: rgba(127,127,127,0.03);
    }

    .expanded-content {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .expanded-content .metric {
      font-size: 0.85em;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: var(--radius);
      padding: 6px 12px;
      min-width: 80px;
    }

    .expanded-content .metric-label {
      color: var(--vscode-descriptionForeground);
      font-size: 0.8em;
      display: block;
      margin-bottom: 2px;
    }

    .expanded-content .metric-value {
      font-weight: 600;
      font-size: 1.05em;
    }

    /* Criteria breakdown — grouped list */
    .criteria-list {
      margin-top: 12px;
    }

    .criteria-list-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 0 0 4px;
      margin-bottom: 6px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .criteria-list-header span:first-child {
      flex: 0 0 140px;
    }

    .criteria-list-header span:nth-child(2) {
      flex: 1;
    }

    .criteria-list-header span:last-child {
      flex: 0 0 60px;
      text-align: right;
    }

    .criteria-group {
      margin-bottom: 2px;
    }

    .criteria-group:last-child {
      margin-bottom: 0;
    }

    .criteria-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 3px 0;
      border-bottom: 1px solid rgba(127,127,127,0.1);
    }

    .criteria-row:last-child {
      border-bottom: none;
    }

    .criteria-row.criteria-expandable {
      cursor: pointer;
    }

    .criteria-row.criteria-expandable:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .criteria-caret {
      font-size: 0.7em;
      opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
      flex-shrink: 0;
    }

    .criteria-expandable:hover .criteria-caret,
    .criteria-expandable.expanded .criteria-caret {
      opacity: 1;
    }

    .criteria-group-label {
      font-weight: 600;
      font-size: 0.85em;
      color: var(--vscode-foreground);
      margin-bottom: 4px;
      flex: 0 0 140px;
    }

    .criteria-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 3px 0;
      font-size: 0.9em;
      flex: 1;
    }

    .criteria-desc {
      flex: 1;
      color: var(--vscode-foreground);
    }

    .criteria-rate {
      flex: 0 0 60px;
      text-align: right;
    }

    .annotation {
      color: var(--vscode-errorForeground);
      font-size: 0.9em;
      margin-left: 4px;
    }

    /* Criteria/results tables (evidence & runs sections) */
    .criteria-table {
      width: 100%;
      margin-top: 8px;
      border-collapse: collapse;
    }

    .criteria-table th {
      text-align: left;
      padding: 4px 8px;
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .criteria-table td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    /* Action Rows */
    .action-row {
      border-bottom: 1px solid rgba(127,127,127,0.1);
    }

    .action-row:last-child {
      border-bottom: none;
    }

    .action-row-header {
      padding: 8px 0;
      cursor: pointer;
    }

    .action-row-header:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .action-row-top {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .action-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .action-caret {
      opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
    }

    .action-row-header:hover .action-caret,
    .action-row.open .action-caret {
      opacity: 1;
    }

    .priority-badge {
      font-weight: 700;
      font-size: 0.8em;
      border-radius: 3px;
      padding: 1px 6px;
      flex-shrink: 0;
    }

    .priority-p1 { color: var(--vscode-errorForeground); }
    .priority-p2 { color: var(--vscode-editorWarning-foreground, orange); }
    .priority-p3 { color: var(--vscode-descriptionForeground); }

    .action-label {
      flex: 1;
    }

    .action-meta {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
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
      padding: 4px 0 12px 28px;
      border-left: 3px solid var(--vscode-widget-border, var(--vscode-panel-border));
      margin-left: 0;
      line-height: 1.6;
      background: rgba(127,127,127,0.03);
    }

    .action-row.open .action-detail {
      display: block;
    }

    .action-detail p {
      margin-bottom: 8px;
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

    /* Evidence panels */
    .evidence-panel {
      display: none;
      padding: 8px 0 8px 12px;
      border-left: 3px solid var(--vscode-widget-border, var(--vscode-panel-border));
      margin: 4px 0 8px 140px;
    }

    .evidence-panel.visible {
      display: block;
    }

    .evidence-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(127,127,127,0.1);
    }

    .evidence-item:last-child {
      border-bottom: none;
    }

    .evidence-body {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .evidence-desc {
      flex: 1;
      font-size: 0.9em;
      line-height: 1.5;
      color: var(--vscode-foreground);
    }

    .evidence-actions {
      display: flex;
      gap: 4px;
      flex: 0 0 60px;
      justify-content: flex-end;
    }

    .evidence-btn {
      background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.15));
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      border: none;
      border-radius: 3px;
      padding: 2px 8px;
      font-size: 0.8em;
      cursor: pointer;
      font-family: var(--vscode-font-family);
    }

    .evidence-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.25));
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
