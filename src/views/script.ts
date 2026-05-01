export function getScript(): string {
  return `
(function() {
  const vscode = acquireVsCodeApi();
  const e = (t) => { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  const pr = (p) => p ? p.passed + '/' + p.total : '—';
  const pct = (n) => n >= 0 ? '+' + Math.round(n * 100) + '%' : Math.round(n * 100) + '%';
  let evidenceIdCounter = 0;

  // Render a clickable pass rate that expands to show per-run evidence
  function prLink(passRate, evidence, criterionDesc) {
    if (!passRate) return '—';
    const label = passRate.passed + '/' + passRate.total;
    if (!evidence || !evidence.length) return label;
    const id = 'ev-' + (evidenceIdCounter++);
    let html = '<span class="rate-link" data-ev-id="' + id + '">' + label + '</span>';
    html += '<div class="evidence-panel" id="' + id + '">';
    if (criterionDesc) html += '<div class="evidence-panel-title">' + e(criterionDesc) + '</div>';
    evidence.forEach(ev => {
      html += '<div class="evidence-item">';
      // Find run to determine pass/fail
      const run = readout.runs && readout.runs.find(r => r.id === ev.runId);
      let status = '';
      if (run && ev.criterionName && run.results.criteriaResults[ev.criterionName]) {
        status = run.results.criteriaResults[ev.criterionName].result;
      }
      const statusIcon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '·';
      const statusCls = status === 'pass' ? 'run-status-pass' : status === 'fail' ? 'run-status-fail' : '';
      html += '<div class="evidence-run-header">';
      html += '<span class="' + statusCls + '">' + statusIcon + '</span> ';
      html += '<span class="run-link" data-run-id="' + e(ev.runId) + '">Run ' + e(ev.runId) + '</span>';
      html += ' <span class="trajectory-link" data-run="' + e(ev.runId) + '">open trajectory</span>';
      html += '</div>';
      if (ev.excerpt) html += '<div class="evidence-excerpt">' + e(ev.excerpt) + '</div>';
      if (run && ev.criterionName && run.results.criteriaResults[ev.criterionName]) {
        html += '<div class="evidence-reason">' + e(run.results.criteriaResults[ev.criterionName].reason) + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  const meta = readout.metadata;
  const sc = readout.scorecard;
  const profiles = meta.profiles;
  const profileMap = {};
  profiles.forEach(p => profileMap[p.id] = p);

  const baseline = sc.profileResults.find(r => {
    const p = profileMap[r.profileId];
    return p && p.isBaseline;
  });
  const baselineTokens = baseline ? baseline.tokens : null;

  // Profile display name
  function profileName(pid) {
    const p = profileMap[pid];
    if (!p) return pid;
    if (p.isBaseline) return 'Bare baseline';
    if (p.extensions && p.extensions.length) return '+ ' + p.extensions.join(', ');
    return p.id;
  }

  // Row color class
  function rowClass(pr) {
    const p = profileMap[pr.profileId];
    if (p && p.isBaseline) return 'row-baseline';
    if (pr.deltaLift == null) return 'row-baseline';
    if (pr.deltaLift < 0) return 'row-drag';
    if (pr.deltaLift === 0 && baselineTokens && pr.tokens > baselineTokens) return 'row-drag';
    if (pr.deltaLift > 0 && baselineTokens && ((pr.tokens - baselineTokens) / baselineTokens) > 0.5) return 'row-amber';
    if (pr.deltaLift > 0) return 'row-lift';
    return 'row-baseline';
  }

  // Format tokens
  function fmtTokens(t, showDelta) {
    const k = (t / 1000).toFixed(1) + 'K';
    if (!showDelta || !baselineTokens) return k;
    const delta = Math.round(((t - baselineTokens) / baselineTokens) * 100);
    if (delta === 0) return k;
    return k + ' (' + (delta > 0 ? '+' : '') + delta + '%)';
  }

  // ─── Lift/Drag Table ───
  const liftEl = document.getElementById('lift-table');

  // Determine which gates/dimensions are present
  const gateKeys = ['build', 'test', 'run', 'deploy'];
  const dimKeys = ['idiomatic', 'dependencyCurrency', 'configurationCorrectness'];
  const presentGates = gateKeys.filter(k => sc.profileResults.some(r => r[k]));
  const presentDims = dimKeys.filter(k => sc.profileResults.some(r => r[k]));

  let tableHtml = '<table class="lift-table"><thead><tr>';
  tableHtml += '<th>Profile</th><th>Δ Lift</th><th>Select</th><th>Tokens</th>';
  tableHtml += '</tr></thead><tbody>';

  sc.profileResults.forEach((r, idx) => {
    const cls = rowClass(r);
    const isBase = profileMap[r.profileId] && profileMap[r.profileId].isBaseline;
    const dl = r.deltaLift != null ? (r.deltaLift > 0 ? '+' : '') + r.deltaLift.toFixed(2) : '—';

    tableHtml += '<tr class="' + cls + ' expandable" data-idx="' + idx + '">';
    tableHtml += '<td><span class="expand-arrow" id="arrow-' + idx + '">▶</span> ' + e(profileName(r.profileId)) + '</td>';
    tableHtml += '<td>' + dl + '</td>';
    tableHtml += '<td>' + pr(r.select) + '</td>';
    tableHtml += '<td>' + fmtTokens(r.tokens, !isBase) + '</td>';
    tableHtml += '</tr>';

    // Expanded row (hidden by default)
    tableHtml += '<tr class="expanded-row" id="expanded-' + idx + '"><td colspan="4">';
    tableHtml += '<div class="expanded-content">';

    if (r.deltaDefects != null) {
      tableHtml += '<div class="metric"><span class="metric-label">Δ Defects</span><br><span class="metric-value">' + pct(r.deltaDefects) + '</span></div>';
    }
    if (r.deltaTokens != null) {
      tableHtml += '<div class="metric"><span class="metric-label">Δ Tokens</span><br><span class="metric-value">' + (r.deltaTokens > 0 ? '+' : '') + r.deltaTokens.toLocaleString() + '</span></div>';
    }
    presentGates.forEach(g => {
      if (r[g]) tableHtml += '<div class="metric"><span class="metric-label">' + g.charAt(0).toUpperCase() + g.slice(1) + '</span><br><span class="metric-value">' + pr(r[g]) + '</span></div>';
    });
    presentDims.forEach(d => {
      const labels = { idiomatic: 'Idiomatic', dependencyCurrency: 'Currency', configurationCorrectness: 'Config' };
      if (r[d]) tableHtml += '<div class="metric"><span class="metric-label">' + labels[d] + '</span><br><span class="metric-value">' + pr(r[d]) + '</span></div>';
    });
    if (r.defects != null) {
      tableHtml += '<div class="metric"><span class="metric-label">Defects</span><br><span class="metric-value">' + r.defects.toFixed(1) + '</span></div>';
    }

    tableHtml += '</div>';

    // Criteria breakdown for this profile
    const breakdown = sc.criteriaBreakdowns.find(b => b.profileId === r.profileId);
    if (breakdown) {
      tableHtml += '<table class="criteria-table"><thead><tr><th>Dimension</th><th>Criterion</th><th>Rate</th></tr></thead><tbody>';
      breakdown.dimensions.forEach(dim => {
        dim.criteria.forEach((c, ci) => {
          tableHtml += '<tr>';
          if (ci === 0) tableHtml += '<td rowspan="' + dim.criteria.length + '"><strong>' + e(dim.name) + '</strong> ' + pr(dim.passRate) + '</td>';
          tableHtml += '<td>' + e(c.description) + (c.annotation ? '<span class="annotation">' + e(c.annotation) + '</span>' : '') + '</td>';
          tableHtml += '<td>' + prLink(c.passRate, c.evidence, c.description) + '</td>';
          tableHtml += '</tr>';
        });
      });
      tableHtml += '</tbody></table>';
    }

    tableHtml += '</td></tr>';
  });

  tableHtml += '</tbody></table>';
  liftEl.innerHTML = tableHtml;

  // Toggle expanded rows
  document.querySelectorAll('tr.expandable').forEach(row => {
    row.addEventListener('click', () => {
      const idx = row.getAttribute('data-idx');
      const expanded = document.getElementById('expanded-' + idx);
      const arrow = document.getElementById('arrow-' + idx);
      expanded.classList.toggle('visible');
      arrow.classList.toggle('open');
    });
  });

  // ─── What to Change ───
  const actionEl = document.getElementById('action-list');
  const al = readout.actionList;
  let actionHtml = '';

  if (al.narrative) {
    actionHtml += '<div class="narrative">' + e(al.narrative) + '</div>';
  }

  function renderEvidence(evidence) {
    if (!evidence || !evidence.length) return '';
    let h = '';
    evidence.forEach(ev => {
      if (ev.excerpt) h += '<div class="evidence-excerpt">' + e(ev.excerpt) + '</div>';
      if (ev.runId) h += '<span class="trajectory-link" data-run="' + e(ev.runId) + '">Open trajectory (run ' + e(ev.runId) + ')</span> ';
    });
    return h;
  }

  function priorityClass(p) {
    if (p <= 1) return 'priority-p1';
    if (p <= 2) return 'priority-p2';
    return 'priority-p3';
  }

  // Fix items
  if (al.fix && al.fix.length) {
    actionHtml += '<div class="section-group-header">Fix</div>';
    al.fix.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-card">';
      actionHtml += '<div class="action-card-header">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.rootCause) + ' → ' + e(item.fixTarget) + '</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-meta">' + pr(item.runs) + ' runs';
      if (item.ownership) actionHtml += ' · <span class="badge">' + e(item.ownership) + '</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-detail">';
      actionHtml += '<p>' + e(item.description) + '</p>';
      actionHtml += renderEvidence(item.evidence);
      actionHtml += '</div></div>';
    });
  }

  // Create items
  if (al.create && al.create.length) {
    actionHtml += '<div class="section-group-header">Create</div>';
    al.create.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-card">';
      actionHtml += '<div class="action-card-header">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.gap) + ' → ' + e(item.whatToBuild) + '</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-meta">' + pr(item.runs) + ' runs';
      if (item.type) actionHtml += ' · <span class="badge">' + e(item.type) + '</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-detail">';
      if (item.rationale) actionHtml += '<p>' + e(item.rationale) + '</p>';
      actionHtml += renderEvidence(item.evidence);
      actionHtml += '</div></div>';
    });
  }

  // Constraints
  if (al.constraints && al.constraints.length) {
    actionHtml += '<details><summary>' + al.constraints.length + ' constraint' + (al.constraints.length > 1 ? 's' : '') + '</summary>';
    al.constraints.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-card">';
      actionHtml += '<div class="action-card-header">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.rootCause) + '</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-meta">' + pr(item.runs) + ' runs · affects ' + e(item.affected) + '</div>';
      actionHtml += '<div class="action-detail">';
      actionHtml += '<p>' + e(item.description) + '</p>';
      if (item.mitigation) actionHtml += '<p><strong>Mitigation:</strong> ' + e(item.mitigation) + '</p>';
      actionHtml += renderEvidence(item.evidence);
      actionHtml += '</div></div>';
    });
    actionHtml += '</details>';
  }

  actionEl.innerHTML = actionHtml;

  // Toggle action cards
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', (evt) => {
      if (evt.target.closest('.trajectory-link')) return;
      card.classList.toggle('open');
    });
  });

  // ─── Supporting Evidence: Scores ───
  const scoresEl = document.getElementById('scores-content');
  let scoresHtml = '';
  if (sc.keyFinding) {
    scoresHtml += '<div class="narrative">' + e(sc.keyFinding) + '</div>';
  }
  if (sc.criteriaAnalysis) {
    scoresHtml += '<div class="narrative">' + e(sc.criteriaAnalysis) + '</div>';
  }

  sc.criteriaBreakdowns.forEach(cb => {
    scoresHtml += '<h3 style="margin: 12px 0 6px; font-size: 0.95em;">' + e(profileName(cb.profileId)) + '</h3>';
    scoresHtml += '<table class="criteria-table"><thead><tr><th>Dimension</th><th>Criterion</th><th>Rate</th></tr></thead><tbody>';
    cb.dimensions.forEach(dim => {
      dim.criteria.forEach((c, ci) => {
        scoresHtml += '<tr>';
        if (ci === 0) {
          scoresHtml += '<td rowspan="' + dim.criteria.length + '"><strong>' + e(dim.name) + '</strong> ' + pr(dim.passRate) + '</td>';
        }
        scoresHtml += '<td>' + e(c.description) + (c.annotation ? ' <span class="annotation">' + e(c.annotation) + '</span>' : '') + '</td>';
        scoresHtml += '<td>' + prLink(c.passRate, c.evidence, c.description) + '</td>';
        scoresHtml += '</tr>';
      });
    });
    scoresHtml += '</tbody></table>';
  });
  scoresEl.innerHTML = scoresHtml;

  // ─── Supporting Evidence: Behaviors ───
  const behaviorsEl = document.getElementById('behaviors-content');
  let behavHtml = '';
  const ba = readout.behaviorAnalysis;

  ba.profiles.forEach(bp => {
    behavHtml += '<h3 style="margin: 12px 0 6px; font-size: 0.95em;">' + e(profileName(bp.profileId)) + '</h3>';
    if (bp.narrative) {
      behavHtml += '<div class="narrative">' + e(bp.narrative) + '</div>';
    }
    behavHtml += '<table class="behavior-table"><thead><tr><th>Category</th><th>Behavior</th><th>Rate</th><th>Source</th></tr></thead><tbody>';
    bp.behaviors.forEach(b => {
      behavHtml += '<tr>';
      behavHtml += '<td class="behavior-category">' + e(b.category) + '</td>';
      behavHtml += '<td>' + e(b.behavior) + '</td>';
      behavHtml += '<td>' + pr(b.rate) + '</td>';
      behavHtml += '<td>' + e(b.source) + (b.surface ? ' <span class="badge">' + e(b.surface) + '</span>' : '') + '</td>';
      behavHtml += '</tr>';
    });
    behavHtml += '</tbody></table>';
  });
  behaviorsEl.innerHTML = behavHtml;

  // ─── Supporting Evidence: Runs ───
  const runsEl = document.getElementById('runs-content');
  let runsHtml = '';

  if (readout.runs && readout.runs.length) {
    // Group by profile
    const grouped = {};
    readout.runs.forEach(r => {
      if (!grouped[r.profileId]) grouped[r.profileId] = [];
      grouped[r.profileId].push(r);
    });

    Object.keys(grouped).forEach(pid => {
      runsHtml += '<h3 style="margin: 12px 0 6px; font-size: 0.95em;">' + e(profileName(pid)) + '</h3>';
      grouped[pid].forEach((run, ri) => {
        const runIdx = pid + '-' + ri;
        const selectStatus = run.results.gates.select.status;
        const statusCls = selectStatus === 'pass' ? 'run-status-pass' : selectStatus === 'fail' ? 'run-status-fail' : 'run-status-skip';

        runsHtml += '<div class="run-card" id="run-' + runIdx + '" data-run-id="' + e(run.id) + '">';
        runsHtml += '<div class="run-card-header" data-run-idx="' + runIdx + '">';
        runsHtml += '<span class="expand-arrow" id="run-arrow-' + runIdx + '">▶</span>';
        runsHtml += '<span class="' + statusCls + '">' + e(selectStatus) + '</span>';
        runsHtml += '<span>' + e(run.id) + '</span>';

        // Gate badges
        const gates = run.results.gates;
        ['select','build','test','run','deploy'].forEach(g => {
          if (gates[g]) {
            const s = gates[g].status;
            const gcls = s === 'pass' ? 'gate-pass' : s === 'fail' ? 'gate-fail' : 'gate-na';
            runsHtml += '<span class="gate-badge ' + gcls + '">' + g.charAt(0).toUpperCase() + g.slice(1) + '</span>';
          }
        });

        if (run.results.tokens) runsHtml += '<span class="action-meta">' + (run.results.tokens / 1000).toFixed(1) + 'K tokens</span>';
        runsHtml += '</div>';

        // Detail
        runsHtml += '<div class="run-card-detail">';

        // Criteria results
        const cr = run.results.criteriaResults;
        if (cr && Object.keys(cr).length) {
          runsHtml += '<table class="criteria-table"><thead><tr><th>Criterion</th><th>Result</th><th>Reason</th></tr></thead><tbody>';
          Object.entries(cr).forEach(([name, result]) => {
            const rcls = result.result === 'pass' ? 'run-status-pass' : result.result === 'fail' ? 'run-status-fail' : 'run-status-skip';
            runsHtml += '<tr><td>' + e(name) + '</td><td class="' + rcls + '">' + e(result.result) + '</td><td>' + e(result.reason) + '</td></tr>';
          });
          runsHtml += '</tbody></table>';
        }

        // Behavior observations
        if (run.results.behaviorObservations && run.results.behaviorObservations.length) {
          runsHtml += '<h4 style="margin: 10px 0 4px; font-size: 0.9em;">Behaviors</h4>';
          run.results.behaviorObservations.forEach(bo => {
            runsHtml += '<p><strong>' + e(bo.category) + ':</strong> ' + e(bo.behavior);
            if (bo.sourceArtifact) runsHtml += ' (' + e(bo.sourceArtifact) + ')';
            runsHtml += '</p>';
          });
        }

        // Root causes
        if (run.results.rootCauses && run.results.rootCauses.length) {
          runsHtml += '<h4 style="margin: 10px 0 4px; font-size: 0.9em;">Root Causes</h4>';
          run.results.rootCauses.forEach(rc => {
            runsHtml += '<p><strong>' + e(rc.label) + '</strong> (' + e(rc.section) + '): ' + e(rc.behaviorChain) + '</p>';
          });
        }

        // Trajectory link
        if (run.trajectoryRef) {
          runsHtml += '<p style="margin-top: 8px;"><span class="trajectory-link" data-path="' + e(run.trajectoryRef) + '">Open trajectory</span></p>';
        }

        runsHtml += '</div></div>';
      });
    });
  } else {
    runsHtml = '<p class="action-meta">No individual run data in this readout.</p>';
  }
  runsEl.innerHTML = runsHtml;

  // Toggle run cards
  document.querySelectorAll('.run-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const idx = header.getAttribute('data-run-idx');
      const card = document.getElementById('run-' + idx);
      const arrow = document.getElementById('run-arrow-' + idx);
      card.classList.toggle('open');
      arrow.classList.toggle('open');
    });
  });

  // ─── Trajectory links ───
  document.addEventListener('click', (evt) => {
    const link = evt.target.closest('.trajectory-link');
    if (!link) return;
    evt.preventDefault();
    evt.stopPropagation();
    const path = link.getAttribute('data-path');
    const runId = link.getAttribute('data-run');
    if (path) {
      vscode.postMessage({ command: 'openTrajectory', path: path });
    } else if (runId) {
      // Try to find the trajectory ref from runs
      const run = readout.runs && readout.runs.find(r => r.id === runId);
      if (run && run.trajectoryRef) {
        vscode.postMessage({ command: 'openTrajectory', path: run.trajectoryRef });
      } else {
        // Send runId and let the extension try to resolve it
        vscode.postMessage({ command: 'openTrajectory', runId: runId });
      }
    }
  });

  // ─── Run links → scroll to run in Runs section ───
  document.addEventListener('click', (evt) => {
    const runLink = evt.target.closest('.run-link');
    if (!runLink) return;
    evt.preventDefault();
    evt.stopPropagation();
    const runId = runLink.getAttribute('data-run-id');
    if (!runId) return;
    // Open the Runs details section
    const runsDetails = document.getElementById('evidence-runs');
    if (runsDetails && !runsDetails.open) runsDetails.open = true;
    // Find and expand the run card
    const card = document.querySelector('.run-card[data-run-id="' + runId + '"]');
    if (card) {
      if (!card.classList.contains('open')) card.classList.add('open');
      const arrow = card.querySelector('.expand-arrow');
      if (arrow && !arrow.classList.contains('open')) arrow.classList.add('open');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // ─── Rate links → evidence panels ───
  document.addEventListener('click', (evt) => {
    const rateLink = evt.target.closest('.rate-link');
    if (!rateLink) return;
    evt.stopPropagation();
    const evId = rateLink.getAttribute('data-ev-id');
    const panel = document.getElementById(evId);
    if (panel) {
      panel.classList.toggle('visible');
    }
  });

  // ─── Keyboard shortcuts ───
  document.addEventListener('keydown', (evt) => {
    if (evt.key === '1') document.getElementById('section-lift').scrollIntoView({ behavior: 'smooth' });
    if (evt.key === '2') document.getElementById('section-change').scrollIntoView({ behavior: 'smooth' });
    if (evt.key === '3') document.getElementById('section-evidence').scrollIntoView({ behavior: 'smooth' });
  });

  // Keyboard hint
  const hint = document.createElement('div');
  hint.className = 'kbd-hint';
  hint.innerHTML = '<kbd>1</kbd> Lift/Drag <kbd>2</kbd> Changes <kbd>3</kbd> Evidence';
  document.body.appendChild(hint);
})();
`;
}
