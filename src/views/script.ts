export function getScript(): string {
  return `
(function() {
  const vscode = acquireVsCodeApi();
  const e = (t) => { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  const pr = (p) => p ? p.passed + '/' + p.total : '—';
  const pct = (n) => n >= 0 ? '+' + Math.round(n * 100) + '%' : Math.round(n * 100) + '%';
  let evidenceIdCounter = 0;

  // Render the evidence panel HTML (without the rate link wrapper)
  function evidencePanel(id, evidence) {
    let html = '<div class="evidence-panel" id="' + id + '">';
    evidence.forEach((ev, i) => {
      html += '<div class="evidence-item">';
      const run = readout.runs && readout.runs.find(r => r.id === ev.runId);
      let status = '';
      if (run && ev.criterionName && run.results.criteriaResults[ev.criterionName]) {
        status = run.results.criteriaResults[ev.criterionName].result;
      }
      const statusIcon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '·';
      const statusCls = status === 'pass' ? 'run-status-pass' : status === 'fail' ? 'run-status-fail' : '';
      html += '<span class="evidence-status ' + statusCls + '">' + statusIcon + '</span>';
      html += '<div class="evidence-body">';
      if (ev.excerpt) {
        html += '<span class="evidence-desc">' + e(ev.excerpt) + '</span>';
      } else if (run && ev.criterionName && run.results.criteriaResults[ev.criterionName]) {
        html += '<span class="evidence-desc">' + e(run.results.criteriaResults[ev.criterionName].reason) + '</span>';
      }
      html += '<span class="evidence-actions">';
      html += '<button class="evidence-btn run-link" data-run-id="' + e(ev.runId) + '" title="View run">⬦</button>';
      html += '<button class="evidence-btn trajectory-link" data-run="' + e(ev.runId) + '" title="Open trajectory">↗</button>';
      html += '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // Render a clickable pass rate that expands to show per-run evidence
  function prLink(passRate, evidence, criterionDesc) {
    if (!passRate) return { label: '—', panel: '', id: null };
    const label = passRate.passed + '/' + passRate.total;
    if (!evidence || !evidence.length) return { label: label, panel: '', id: null };
    const id = 'ev-' + (evidenceIdCounter++);
    return { label: label, panel: evidencePanel(id, evidence), id: id };
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

  // Sort so baseline profile is always first
  const sortedResults = sc.profileResults.slice().sort((a, b) => {
    const aBase = profileMap[a.profileId] && profileMap[a.profileId].isBaseline ? 1 : 0;
    const bBase = profileMap[b.profileId] && profileMap[b.profileId].isBaseline ? 1 : 0;
    return bBase - aBase;
  });

  let tableHtml = '<table class="lift-table"><thead><tr>';
  tableHtml += '<th>Profile</th><th>Δ Lift</th><th>Select</th><th>Tokens</th>';
  tableHtml += '</tr></thead><tbody>';

  sortedResults.forEach((r, idx) => {
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
      tableHtml += '<div class="metric"><span class="metric-label">Δ Defects</span><span class="metric-value">' + pct(r.deltaDefects) + '</span></div>';
    }
    if (r.deltaTokens != null) {
      tableHtml += '<div class="metric"><span class="metric-label">Δ Tokens</span><span class="metric-value">' + (r.deltaTokens > 0 ? '+' : '') + r.deltaTokens.toLocaleString() + '</span></div>';
    }
    presentGates.forEach(g => {
      if (r[g]) tableHtml += '<div class="metric"><span class="metric-label">' + g.charAt(0).toUpperCase() + g.slice(1) + '</span><span class="metric-value">' + pr(r[g]) + '</span></div>';
    });
    presentDims.forEach(d => {
      const labels = { idiomatic: 'Idiomatic', dependencyCurrency: 'Currency', configurationCorrectness: 'Config' };
      if (r[d]) tableHtml += '<div class="metric"><span class="metric-label">' + labels[d] + '</span><span class="metric-value">' + pr(r[d]) + '</span></div>';
    });
    if (r.defects != null) {
      tableHtml += '<div class="metric"><span class="metric-label">Defects</span><span class="metric-value">' + r.defects.toFixed(1) + '</span></div>';
    }

    tableHtml += '</div>';

    // Criteria breakdown for this profile
    const breakdown = sc.criteriaBreakdowns.find(b => b.profileId === r.profileId);
    if (breakdown) {
      tableHtml += '<div class="criteria-list">';
      tableHtml += '<div class="criteria-list-header"><span>Dimension</span><span>Criterion</span><span>Rate</span></div>';
      breakdown.dimensions.forEach(dim => {
        dim.criteria.forEach((c, ci) => {
          const result = prLink(c.passRate, c.evidence, c.description);
          const hasEvidence = result.id != null;
          const rowCls = hasEvidence ? 'criteria-row criteria-expandable' : 'criteria-row';
          const evAttr = hasEvidence ? ' data-ev-id="' + result.id + '"' : '';
          tableHtml += '<div class="' + rowCls + '"' + evAttr + '>';
          if (ci === 0) {
            tableHtml += '<div class="criteria-group-label">' + e(dim.name) + '</div>';
          } else {
            tableHtml += '<div class="criteria-group-label"></div>';
          }
          tableHtml += '<div class="criteria-item">';
          tableHtml += '<span class="criteria-desc">' + e(c.description) + (c.annotation ? '<span class="annotation">' + e(c.annotation) + '</span>' : '') + '</span>';
          tableHtml += '<span class="criteria-rate">' + result.label + '</span>';
          if (hasEvidence) tableHtml += '<span class="criteria-caret expand-arrow">▶</span>';
          tableHtml += '</div>';
          tableHtml += '</div>';
          if (hasEvidence) tableHtml += result.panel;
        });
      });
      tableHtml += '</div>';
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
      row.classList.toggle('expanded');
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
      h += '<div class="evidence-item">';

      h += '<div class="evidence-body">';
      if (ev.excerpt) {
        h += '<span class="evidence-desc">' + e(ev.excerpt) + '</span>';
      }
      h += '<span class="evidence-actions">';
      if (ev.runId) {
        h += '<button class="evidence-btn run-link" data-run-id="' + e(ev.runId) + '" title="View run">⬦</button>';
        h += '<button class="evidence-btn trajectory-link" data-run="' + e(ev.runId) + '" title="Open trajectory">↗</button>';
      }
      h += '</span>';
      h += '</div>';
      h += '</div>';
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
    actionHtml += '<h3>Fix</h3>';
    al.fix.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-row">';
      actionHtml += '<div class="action-row-header">';
      actionHtml += '<div class="action-row-top">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.fixTarget) + '</span>';
      actionHtml += '<span class="action-meta">' + pr(item.runs) + ' runs</span>';
      actionHtml += '<span class="expand-arrow action-caret">▶</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-tags">';
      actionHtml += '<span class="badge">' + e(item.rootCause) + '</span>';
      if (item.ownership) actionHtml += '<span class="badge">' + e(item.ownership) + '</span>';
      actionHtml += '</div>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-detail">';
      actionHtml += '<h4>Description</h4>';
      actionHtml += '<p>' + e(item.description) + '</p>';
      if (item.evidence && item.evidence.length) {
        actionHtml += '<h4>Evidence</h4>';
        actionHtml += renderEvidence(item.evidence);
      }
      actionHtml += '</div></div>';
    });
  }

  // Create items
  if (al.create && al.create.length) {
    actionHtml += '<h3>Create</h3>';
    al.create.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-row">';
      actionHtml += '<div class="action-row-header">';
      actionHtml += '<div class="action-row-top">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.whatToBuild) + '</span>';
      actionHtml += '<span class="action-meta">' + pr(item.runs) + ' runs</span>';
      actionHtml += '<span class="expand-arrow action-caret">▶</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-tags">';
      actionHtml += '<span class="badge">' + e(item.gap) + '</span>';
      if (item.type) actionHtml += '<span class="badge">' + e(item.type) + '</span>';
      actionHtml += '</div>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-detail">';
      if (item.rationale) {
        actionHtml += '<h4>Description</h4>';
        actionHtml += '<p>' + e(item.rationale) + '</p>';
      }
      if (item.evidence && item.evidence.length) {
        actionHtml += '<h4>Evidence</h4>';
        actionHtml += renderEvidence(item.evidence);
      }
      actionHtml += '</div></div>';
    });
  }

  // Constraints
  if (al.constraints && al.constraints.length) {
    actionHtml += '<details><summary>' + al.constraints.length + ' constraint' + (al.constraints.length > 1 ? 's' : '') + '</summary>';
    al.constraints.sort((a, b) => a.priority - b.priority).forEach(item => {
      actionHtml += '<div class="action-row">';
      actionHtml += '<div class="action-row-header">';
      actionHtml += '<span class="priority-badge ' + priorityClass(item.priority) + '">P' + item.priority + '</span>';
      actionHtml += '<span class="action-label">' + e(item.rootCause) + '</span>';
      actionHtml += '<span class="action-meta">' + pr(item.runs) + ' runs · affects ' + e(item.affected) + '</span>';
      actionHtml += '<span class="expand-arrow action-caret">▶</span>';
      actionHtml += '</div>';
      actionHtml += '<div class="action-detail">';
      actionHtml += '<h4>Description</h4>';
      actionHtml += '<p>' + e(item.description) + '</p>';
      if (item.mitigation) actionHtml += '<p><strong>Mitigation:</strong> ' + e(item.mitigation) + '</p>';
      if (item.evidence && item.evidence.length) {
        actionHtml += '<h4>Evidence</h4>';
        actionHtml += renderEvidence(item.evidence);
      }
      actionHtml += '</div></div>';
    });
    actionHtml += '</details>';
  }

  actionEl.innerHTML = actionHtml;

  // Toggle action rows
  document.querySelectorAll('.action-row').forEach(row => {
    const header = row.querySelector('.action-row-header');
    if (header) header.addEventListener('click', (evt) => {
      if (evt.target.closest('.trajectory-link') || evt.target.closest('.run-link')) return;
      const caret = row.querySelector('.action-caret');
      row.classList.toggle('open');
      if (caret) caret.classList.toggle('open');
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
    scoresHtml += '<h3>' + e(profileName(cb.profileId)) + '</h3>';
    scoresHtml += '<table class="criteria-table"><thead><tr><th>Dimension</th><th>Criterion</th><th>Rate</th></tr></thead><tbody>';
    cb.dimensions.forEach(dim => {
      dim.criteria.forEach((c, ci) => {
        scoresHtml += '<tr>';
        if (ci === 0) {
          scoresHtml += '<td rowspan="' + dim.criteria.length + '"><strong>' + e(dim.name) + '</strong> ' + pr(dim.passRate) + '</td>';
        }
        scoresHtml += '<td>' + e(c.description) + (c.annotation ? ' <span class="annotation">' + e(c.annotation) + '</span>' : '') + '</td>';
        const sr = prLink(c.passRate, c.evidence, c.description);
        scoresHtml += '<td>' + sr.label + sr.panel + '</td>';
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
    behavHtml += '<h3>' + e(profileName(bp.profileId)) + '</h3>';
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
      runsHtml += '<h3>' + e(profileName(pid)) + '</h3>';
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
          runsHtml += '<h4>Behaviors</h4>';
          run.results.behaviorObservations.forEach(bo => {
            runsHtml += '<p><strong>' + e(bo.category) + ':</strong> ' + e(bo.behavior);
            if (bo.sourceArtifact) runsHtml += ' (' + e(bo.sourceArtifact) + ')';
            runsHtml += '</p>';
          });
        }

        // Root causes
        if (run.results.rootCauses && run.results.rootCauses.length) {
          runsHtml += '<h4>Root Causes</h4>';
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

  // ─── Criteria row → evidence panels ───
  document.addEventListener('click', (evt) => {
    const row = evt.target.closest('.criteria-expandable');
    if (!row) return;
    if (evt.target.closest('.trajectory-link') || evt.target.closest('.run-link')) return;
    evt.stopPropagation();
    const evId = row.getAttribute('data-ev-id');
    const panel = document.getElementById(evId);
    const caret = row.querySelector('.criteria-caret');
    if (panel) {
      panel.classList.toggle('visible');
      if (caret) caret.classList.toggle('open');
      row.classList.toggle('expanded');
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
