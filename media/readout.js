(function () {
  'use strict';

  const vscode = acquireVsCodeApi();
  const data = JSON.parse(document.getElementById('readout-data').textContent);
  const R = data.readout;
  const P = data.presentation;
  const app = document.getElementById('app');

  const host = {
    openTrajectory(runId) {
      const run = runById.get(runId);
      if (run && run.trajectoryRef) vscode.postMessage({ command: 'openTrajectory', path: run.trajectoryRef });
      else vscode.postMessage({ command: 'openTrajectory', runId: runId });
    }
  };

  // ─── Helpers ───
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  const MINUS = '\u2212';
  const trim1 = (x) => { const s = x.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s; };
  const pct = (n) => n == null ? '—' : trim1(n * 100) + '%';
  const signedPct = (n) => n == null ? '' : (n > 0 ? '+' : n < 0 ? MINUS : '±') + Math.round(Math.abs(n) * 100) + '%';
  const pp = (n) => n == null ? '—' : n === 0 ? '±0pp' : (n > 0 ? '+' : MINUS) + Math.abs(n * 100).toFixed(1) + 'pp';
  const usd = (n) => n == null ? '—' : '$' + (Math.abs(n) < 0.1 ? Math.abs(n).toFixed(3) : Math.abs(n).toFixed(2));
  const signedUsd = (n) => n == null ? '' : (n >= 0 ? '+' : MINUS) + usd(n);
  const tokens = (n) => n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);
  const duration = (s) => s == null ? '—' : s >= 60 ? Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's' : s + 's';
  const shortId = (id) => '…' + String(id).slice(-4);
  const rate = (r) => !r ? '—' : r === 'N/A' ? 'n/a' : r.passed + '/' + r.total;
  const frac = (r) => r && r !== 'N/A' && r.total ? r.passed / r.total : null;
  const humanize = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

  function pips(r) {
    if (!r || r === 'N/A' || !r.total) return '';
    if (r.total > 10) {
      return '<span class="meter" title="' + rate(r) + '"><span data-style="width:' + (r.passed / r.total * 100) + '%"></span></span>';
    }
    let h = '<span class="pips" aria-hidden="true">';
    for (let i = 0; i < r.total; i++) h += '<span class="pip ' + (i < r.passed ? 'on' : 'off') + '"></span>';
    return h + '</span>';
  }

  // Splits narrative text into a lead (first sentence, or two if the first is short) and the rest.
  function sentences(text) {
    const raw = String(text || '').trim().split(/(?<=[.!?])\s+(?=\S)/);
    const out = [];
    raw.forEach((s) => {
      if (out.length && /\b(e\.g|i\.e|vs|etc|cf|approx)\.$/i.test(out[out.length - 1])) out[out.length - 1] += ' ' + s;
      else out.push(s);
    });
    return out;
  }
  function splitLead(text, min) {
    const s = sentences(text);
    if (!s.length) return { lead: '', rest: [] };
    let n = 1;
    if (s[0].length < (min || 140) && s.length > 1) n = 2;
    return { lead: s.slice(0, n).join(' '), rest: s.slice(n) };
  }
  function paragraphs(list) {
    const paras = [];
    let cur = [];
    let len = 0;
    list.forEach((s) => {
      cur.push(s);
      len += s.length;
      if (cur.length >= 3 && len > 380) { paras.push(cur.join(' ')); cur = []; len = 0; }
    });
    if (cur.length) paras.push(cur.join(' '));
    return paras.map((p) => '<p>' + md(p) + '</p>').join('');
  }
  function leadWithMore(text, moreLabel, leadClass) {
    const { lead, rest } = splitLead(text);
    let h = '<p class="' + (leadClass || 'takeaway') + '">' + md(lead) + '</p>';
    if (rest.length) h += '<details class="more"><summary>' + esc(moreLabel) + '</summary><div class="prose">' + paragraphs(rest) + '</div></details>';
    return h;
  }

  // ─── Model ───
  const meta = R.metadata;
  const sc = R.scorecard;
  const profiles = meta.profiles;
  const results = new Map(sc.profileResults.map((r) => [r.profileId, r]));
  const breakdowns = new Map((sc.criteriaBreakdowns || []).map((b) => [b.profileId, b]));
  const verdictTexts = new Map(((R.summary && R.summary.profileVerdicts) || []).map((v) => [v.profileId, v.verdict]));
  const behaviorMap = new Map(((R.behaviorAnalysis && R.behaviorAnalysis.profiles) || []).map((b) => [b.profileId, b]));
  const runs = R.runs || [];
  const runById = new Map(runs.map((r) => [r.id, r]));
  const runsByProfile = new Map();
  runs.forEach((r) => {
    if (!runsByProfile.has(r.profileId)) runsByProfile.set(r.profileId, []);
    runsByProfile.get(r.profileId).push(r);
  });

  // Profiles, their scores and verdicts come precomputed from the extension (see presentation.ts).
  const ordered = P.profiles;
  const views = new Map(ordered.map((v) => [v.id, v]));
  const baseline = P.baselineId ? views.get(P.baselineId) : null;
  const baselineCount = P.baselineCount;
  const isBase = (pid) => !!baseline && baseline.id === pid;
  const labelOf = (pid) => (views.get(pid) || { name: pid }).name;
  const isCost = P.costMetric === 'cost';
  const costFmt = (n) => isCost ? usd(n) : tokens(n) + ' tok';
  const signedCost = (n) => isCost ? signedUsd(n) : (n >= 0 ? '+' : MINUS) + tokens(Math.abs(n)) + ' tok';

  // Criteria order: union of breakdown criteria, grouped by dimension, in first-seen order.
  const dims = [];
  (sc.criteriaBreakdowns || []).forEach((b) => b.dimensions.forEach((d) => {
    let dim = dims.find((x) => x.name === d.name);
    if (!dim) { dim = { name: d.name, criteria: [] }; dims.push(dim); }
    d.criteria.forEach((c) => { if (!dim.criteria.includes(c.description)) dim.criteria.push(c.description); });
  }));
  function criterionOf(pid, desc) {
    const b = breakdowns.get(pid);
    if (!b) return null;
    for (const d of b.dimensions) for (const c of d.criteria) if (c.description === desc) return c;
    return null;
  }
  const GATES = ['select', 'build', 'test', 'run', 'deploy'];
  const gatesPresent = GATES.filter((g) => sc.profileResults.some((r) => r[g] != null));
  const classification = new Map((meta.criteria || []).map((c) => [c.name, String(c.classification).toLowerCase()]));

  // ─── Renderers ───
  function evidenceList(evs, criterionName) {
    if (!evs || !evs.length) return '';
    return '<ul class="ev-list">' + evs.map((ev) => {
      const run = runById.get(ev.runId);
      const cname = ev.criterionName || criterionName;
      const res = run && cname && run.results.criteriaResults ? run.results.criteriaResults[cname] : null;
      const st = res ? res.result : '';
      const glyph = st === 'pass' ? '✓' : st === 'fail' ? '✗' : '·';
      const text = ev.excerpt || (res && res.reason) || '';
      const step = ev.stepId != null ? '<span>step ' + esc(ev.stepId) + '</span>' : '';
      return '<li class="ev ' + esc(st) + '"><span class="glyph" aria-label="' + esc(st || 'evidence') + '">' + glyph + '</span>' +
        '<span class="ev-text">' + md(text) + '</span>' +
        '<span class="ev-actions">' + step +
        '<button class="linkish run-link" data-run="' + esc(ev.runId) + '" title="Show run ' + esc(ev.runId) + '">run ' + shortId(ev.runId) + '</button>' +
        '<button class="icon-btn traj" data-run="' + esc(ev.runId) + '" title="Open trajectory" aria-label="Open trajectory">↗</button>' +
        '</span></li>';
    }).join('') + '</ul>';
  }

  function renderHero() {
    const s = R.summary && R.summary.narrative;
    const totalRuns = runs.length || meta.runsPerProfile * profiles.length;
    let h = '<section class="hero" aria-labelledby="title">';
    h += '<p class="label">' + esc([meta.date, meta.scenarioType + ' scenario', meta.benchmarkId ? 'benchmark ' + meta.benchmarkId : ''].filter(Boolean).join(' · ')) + '</p>';
    h += '<h1 id="title" class="hang">' + esc(meta.title) + '</h1>';
    if (s) h += leadWithMore(s, 'Read the full summary', 'lede');
    h += '<dl class="facts" aria-label="Readout setup">';
    h += '<div><dt>Instruction</dt><dd>' + esc(meta.instruction) + '</dd></div>';
    if (baseline) h += '<div><dt>Baseline</dt><dd>' + esc(labelOf(baseline.id)) + '</dd></div>';
    h += '<div><dt>Harness</dt><dd>' + esc(meta.harness) + '</dd></div>';
    h += '<div><dt>Model</dt><dd>' + esc(meta.model) + '</dd></div>';
    h += '<div><dt>Profiles</dt><dd>' + profiles.length + '</dd></div>';
    h += '<div><dt>Runs</dt><dd>' + meta.runsPerProfile + ' per profile · ' + totalRuns + ' total</dd></div>';
    if (meta.workspaceSnapshot) h += '<div><dt>Workspace</dt><dd><a href="' + esc(meta.workspaceSnapshot) + '">' + esc(meta.workspaceSnapshot.split('/').pop()) + '</a></dd></div>';
    h += '</dl>';
    h += '</section>';
    return h;
  }

  // Runs with the same score share one dot showing how many landed there; near neighbours stack vertically.
  function dots(scores) {
    const counts = new Map();
    scores.forEach((x) => { const k = Math.round(x * 1e6) / 1e6; counts.set(k, (counts.get(k) || 0) + 1); });
    const keys = [...counts.keys()].sort((a, b) => a - b);
    let prev = null;
    let up = false;
    return keys.map((k) => {
      up = prev != null && k - prev < 0.035 ? !up : false;
      prev = k;
      const n = counts.get(k);
      const size = n === 1 ? 0.6 : Math.min(1.5, 1 + (n - 2) * 0.08);
      return '<span class="dot' + (up ? ' up' : '') + '" data-style="left:' + (k * 100) + '%;--d:' + size + 'rem" title="' + n + ' run' + (n > 1 ? 's' : '') + ' at ' + pct(k) + '">' + (n > 1 ? n : '') + '</span>';
    }).join('');
  }

  function renderLift() {
    const at = (v) => (v * 100) + '%';
    let ticks = '';
    for (let v = 0; v <= 100; v += 10) {
      const major = v % 20 === 0;
      ticks += '<span class="tick' + (major ? ' major' : '') + '" data-style="left:' + v + '%"></span>';
      if (major) ticks += '<span class="tick-label' + (v === 0 ? ' start' : v === 100 ? ' end' : '') + '" data-style="left:' + v + '%">' + v + '%</span>';
    }
    const base = baseline;
    const band = base && base.min != null ? '--bmin:' + at(base.min) + ';--bmax:' + at(base.max) : '--bmin:' + at(base && base.score != null ? base.score : 0) + ';--bmax:' + at(base && base.score != null ? base.score : 0);

    let h = '<section id="section-lift" class="section" aria-labelledby="lift-title">';
    h += '<div class="section-head"><span class="label">Does it help?</span><h2 id="lift-title" class="hang">Lift or drag</h2>';
    h += '<p class="note measure">Each bar spans the scores of a profile\'s individual runs, from worst to best, and the solid line marks its average. The shaded band behind every row is the baseline\'s range. Verdicts compare the averages: a higher average is a lift, or an expensive lift when it costs at least 10% more. A lower average is a drag. At the same average, at least 10% cheaper is a lift and at least 10% more expensive is a drag.</p>';
    if (P.hasComputedScores) h += '<p class="note measure"><span class="marked">Note</span> Some profiles have no stored score. Their score is computed from gates and criteria and marked with *.' + (isCost ? '' : ' Cost is shown as tokens because not every profile has a dollar cost.') + '</p>';
    if (baselineCount > 1) h += '<p class="note measure"><span class="marked">Note</span> This readout marks ' + baselineCount + ' baselines. Every profile is compared against the first: ' + esc(labelOf(baseline.id)) + '. Changes shown here can differ from the narrative, which compares against several baselines.</p>';
    h += '</div>';
    h += '<div class="chart" data-style="' + band + '">';
    h += '<div class="chart-head"><span>Profile</span><span class="scale">' + ticks + '</span><span class="num">Score</span><span class="num">' + (isCost ? 'Cost / run' : 'Tokens / run') + '</span><span>Verdict</span></div>';

    ordered.forEach((p) => {
      const s = p;
      const v = p.verdict;
      const baseRow = isBase(p.id);
      let bar = '';
      if (s.min != null && s.max > s.min) bar += '<span class="range" data-style="left:' + at(s.min) + ';width:' + at(s.max - s.min) + '" title="Runs scored ' + pct(s.min) + '–' + pct(s.max) + '"></span>';
      if (s.score != null) bar += '<span class="mean" data-style="left:' + at(s.score) + '" title="Average ' + pct(s.score) + '"></span>';
      bar += dots(s.runScores);

      const scoreSub = baseRow || s.scoreDelta == null ? '' :
        '<small>' + (s.scoreDelta === 0 ? 'same as baseline' : (s.scoreDelta > 0 ? '+' : MINUS) + Math.round(Math.abs(s.scoreDelta) * 100) + ' pts') + '</small>';
      const costSub = baseRow || s.costDelta == null ? '' : '<small>' + signedCost(s.costDelta) + (s.costChange != null ? ' · ' + signedPct(s.costChange) : '') + '</small>';
      const scoreText = s.scoreComputed && s.score != null ? '<span title="Computed from gates and criteria; this readout doesn\'t store a score for this profile">' + pct(s.score) + '*</span>' : pct(s.score);
      const verdictLabel = v.kind === 'expensive' ? '<span class="marked">' + v.label + '</span>'
        : v.kind === 'best' ? '<span class="marked best" title="The top-scoring profile, and it doesn\'t cost more than the baseline">' + v.label + '</span>' : v.label;
      const name = esc(labelOf(p.id));

      h += '<div class="crow v-' + v.kind + '" role="button" tabindex="0" aria-expanded="false" aria-controls="detail-' + esc(p.id) + '" data-pid="' + esc(p.id) + '">';
      h += '<span class="name"><span class="caret" aria-hidden="true">▸</span><span class="txt">' + name + (baseRow ? ' <span class="tag">baseline</span>' : '') + '</span></span>';
      h += '<span class="bars">' + bar + '</span>';
      h += '<span class="num score">' + scoreText + scoreSub + '</span>';
      h += '<span class="num cost">' + (s.cost != null ? costFmt(s.cost) : '—') + costSub + '</span>';
      h += '<span class="verdict">' + verdictLabel + (v.note ? '<small>' + esc(v.note) + '</small>' : '') + '</span>';
      h += '</div>';
      h += '<div class="cdetail" id="detail-' + esc(p.id) + '" hidden></div>';
    });
    h += '</div>';

    if (sc.keyFinding) h += '<div class="narr"><p class="label">Key finding</p>' + leadWithMore(sc.keyFinding, 'Read the full key finding') + '</div>';
    if (sc.criteriaAnalysis) h += '<div class="narr"><p class="label">Criteria analysis</p>' + leadWithMore(sc.criteriaAnalysis, 'Read the full criteria analysis') + '</div>';
    h += '</section>';
    return h;
  }

  function profileDetail(pid) {
    const r = results.get(pid) || {};
    const s = views.get(pid);
    const runCount = (runsByProfile.get(pid) || []).length;
    const cmp = isBase(pid) ? null : baseline;
    const verdict = verdictTexts.get(pid);
    let h = '<div class="card">';
    h += '<div class="card-meta label"><span>' + esc(labelOf(pid)) + '</span><span>' + runCount + ' runs</span></div>';
    if (verdict) h += '<p class="takeaway measure">' + md(verdict) + '</p>';

    const metric = (k, v, muted) => '<div class="metric"><span class="k">' + k + '</span><span class="v' + (muted ? ' muted' : '') + '">' + v + '</span></div>';
    h += '<div class="metrics">';
    gatesPresent.forEach((g) => { h += metric(humanize(g), rate(r[g]), !r[g]); });
    h += metric('Score', pct(s.score));
    if (s.min != null) h += metric('Run range', pct(s.min) + '–' + pct(s.max));
    if (isCost && s.cost != null) h += metric('Cost / run', usd(s.cost));
    h += metric('Tokens / run', tokens(s.tokens));
    h += '</div>';

    const b = breakdowns.get(pid);
    if (b) {
      h += '<div><div class="crit crit-head"><span>Criterion</span><span></span><span class="num">Rate</span><span class="vs">' + (cmp ? 'Baseline' : '') + '</span><span></span></div>';
      b.dimensions.forEach((d) => {
        h += '<div class="crit-dim"><span>' + esc(d.name) + '</span><span class="num" title="Runs that passed every criterion in this dimension">' + rate(d.passRate) + ' all-pass</span></div>';
        d.criteria.forEach((c, i) => {
          const hasEv = c.evidence && c.evidence.length;
          const bc = cmp ? criterionOf(cmp.id, c.description) : null;
          const regressed = bc && frac(bc.passRate) > frac(c.passRate);
          const vs = bc ? (regressed ? '<span class="marked">↓ from ' + rate(bc.passRate) + '</span>' : rate(bc.passRate)) : '';
          const evId = 'ev-' + pid + '-' + d.name.replace(/\W+/g, '') + '-' + i;
          h += '<div class="crit crit-row' + (hasEv ? ' has-ev' : '') + '"' + (hasEv ? ' role="button" tabindex="0" aria-expanded="false" aria-controls="' + evId + '"' : '') + '>';
          h += '<span>' + esc(c.description) + (c.annotation ? '<span class="annot marked">' + esc(c.annotation) + '</span>' : '') + '</span>';
          h += pips(c.passRate) + '<span class="rate">' + rate(c.passRate) + '</span><span class="vs">' + vs + '</span>';
          h += '<span class="caret" aria-hidden="true">' + (hasEv ? '▸' : '') + '</span></div>';
          if (hasEv) h += '<div class="crit-ev" id="' + evId + '" hidden>' + evidenceList(c.evidence, c.description) + '</div>';
        });
      });
      h += '</div>';
    }

    h += '<div class="jump-row">';
    if (behaviorMap.has(pid)) h += '<button class="linkish jump-behaviors" data-pid="' + esc(pid) + '">What the agent did →</button>';
    if (runsByProfile.has(pid)) h += '<button class="linkish jump-runs" data-pid="' + esc(pid) + '">All ' + runsByProfile.get(pid).length + ' runs →</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function renderActions() {
    const al = R.actionList || {};
    const fix = (al.fix || []).slice().sort((a, b) => a.priority - b.priority);
    const create = (al.create || []).slice().sort((a, b) => a.priority - b.priority);
    const constraints = (al.constraints || []).slice().sort((a, b) => a.priority - b.priority);

    let h = '<section id="section-change" class="section" aria-labelledby="change-title">';
    h += '<div class="section-head"><span class="label">What to do next</span><h2 id="change-title" class="hang">What to change</h2></div>';
    if (al.narrative) h += '<div class="narr">' + leadWithMore(al.narrative, 'Read the full action narrative') + '</div>';
    h += '<div class="actions">';

    const evidenceBlock = (evs) => evs && evs.length ? '<details class="more"><summary>Evidence (' + evs.length + ')</summary><div class="prose">' + evidenceList(evs) + '</div></details>' : '';

    if (!fix.length && !create.length) h += '<p class="empty">No Fix or Create actions in this readout.</p>';
    if (fix.length) h += '<div class="action-group"><p class="label">Fix · ' + fix.length + '</p>';
    fix.forEach((a) => {
      h += '<article class="card action-card"><div class="card-meta label"><span><span class="marked">P' + a.priority + '</span> · Fix' + (a.ownership ? ' · ' + esc(humanize(a.ownership)) : '') + '</span><span>' + rate(a.runs) + ' runs</span></div>';
      h += '<h3>' + esc(a.fixTarget) + '</h3><p class="label">' + esc(humanize(a.rootCause)) + '</p><p class="measure">' + md(a.description) + '</p>' + evidenceBlock(a.evidence) + '</article>';
    });
    if (fix.length) h += '</div>';

    if (create.length) h += '<div class="action-group"><p class="label">Create · ' + create.length + '</p>';
    create.forEach((a) => {
      h += '<article class="card action-card"><div class="card-meta label"><span><span class="marked">P' + a.priority + '</span> · Create' + (a.type ? ' · ' + esc(humanize(a.type)) : '') + '</span><span>' + rate(a.runs) + ' runs</span></div>';
      h += '<h3>' + esc(a.whatToBuild) + '</h3><p class="label">' + esc(a.gap) + '</p>' + (a.rationale ? '<p class="measure">' + md(a.rationale) + '</p>' : '') + evidenceBlock(a.evidence) + '</article>';
    });
    if (create.length) h += '</div>';

    if (constraints.length) {
      h += '<div class="action-group"><p class="label">Constraints · ' + constraints.length + '</p>';
      constraints.forEach((a) => {
        h += '<article class="card action-card"><div class="card-meta label"><span><span class="marked">P' + a.priority + '</span> · Constraint</span><span>' + rate(a.runs) + ' runs</span></div>';
        h += '<h3>' + esc(humanize(a.rootCause)) + '</h3><p class="measure">' + md(a.description) + '</p>';
        h += '<dl class="facts facts-prose"><div><dt>Affects</dt><dd>' + md(a.affected) + '</dd></div>' + (a.mitigation ? '<div><dt>Mitigation</dt><dd>' + md(a.mitigation) + '</dd></div>' : '') + '</dl>';
        h += evidenceBlock(a.evidence) + '</article>';
      });
      h += '</div>';
    }
    h += '</div></section>';
    return h;
  }

  function renderMatrix() {
    const cols = [];
    gatesPresent.forEach((g, i) => cols.push({ kind: 'gate', key: g, label: humanize(g), dim: 'Gates', first: i === 0 }));
    dims.forEach((d) => d.criteria.forEach((c, i) => cols.push({ kind: 'crit', key: c, label: c, dim: d.name, first: i === 0 })));
    const cellRate = (pid, col) => col.kind === 'gate' ? (results.get(pid) || {})[col.key] : (criterionOf(pid, col.key) || {}).passRate;

    let h = '<div class="legend"><span><span class="cell full">5/5</span> all passed</span><span><span class="cell part">3/5</span> some failed</span><span><span class="cell zero"><b>0/5</b></span> none passed</span><span><span class="cell reg">2/5</span> below the baseline</span></div>';
    h += '<div class="tbl-wrap"><table class="matrix"><thead>';
    h += '<tr class="dimrow"><th class="pname"></th>';
    const groups = [];
    cols.forEach((c) => { const g = groups[groups.length - 1]; if (g && g.name === c.dim) g.n++; else groups.push({ name: c.dim, n: 1 }); });
    groups.forEach((g) => { h += '<th colspan="' + g.n + '">' + esc(g.name) + '</th>'; });
    h += '</tr><tr><th class="pname"></th>';
    cols.forEach((c) => { h += '<th class="rot' + (c.first ? ' first-of-dim' : '') + '" title="' + esc(c.label) + '"><span>' + esc(c.label) + '</span></th>'; });
    h += '</tr></thead><tbody>';
    ordered.forEach((p) => {
      const cmp = isBase(p.id) ? null : baseline;
      h += '<tr' + (isBase(p.id) ? ' class="base-row"' : '') + '><th class="pname" scope="row">' + esc(labelOf(p.id)) + (isBase(p.id) ? ' <span class="tag">baseline</span>' : '') + '</th>';
      cols.forEach((col) => {
        const r = cellRate(p.id, col);
        const f = frac(r);
        const bf = cmp ? frac(cellRate(cmp.id, col)) : null;
        let cls = f == null ? '' : f === 1 ? 'full' : f === 0 ? 'zero' : 'part';
        if (f != null && bf != null && f < bf) cls += ' reg';
        const txt = r ? rate(r) : '—';
        const crit = col.kind === 'crit' ? criterionOf(p.id, col.key) : null;
        const title = col.label + ': ' + txt + (crit && crit.annotation ? ' (' + crit.annotation + ')' : '') + (bf != null && f < bf ? ' — below baseline ' + rate(cellRate(cmp.id, col)) : '');
        h += '<td class="' + (col.first ? 'first-of-dim' : '') + '" title="' + esc(title) + '"><span class="cell ' + cls + '">' + (cls.includes('zero') ? '<b>' + txt + '</b>' : txt) + '</span></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  function renderBehaviors() {
    let h = '';
    ordered.filter((p) => behaviorMap.has(p.id)).forEach((p) => {
      const bp = behaviorMap.get(p.id);
      h += '<details class="sub" data-behaviors-pid="' + esc(p.id) + '"><summary>' + esc(labelOf(p.id)) + '<span class="label">' + bp.behaviors.length + ' behaviors</span></summary><div class="body">';
      if (bp.narrative) h += leadWithMore(bp.narrative, 'Read the full narrative', 'measure');
      h += '<div class="tbl-wrap"><table class="data"><thead><tr><th>Category</th><th>Behavior</th><th>Rate</th><th>Surface</th><th>Source</th></tr></thead><tbody>';
      bp.behaviors.forEach((b, i) => {
        const hasEv = b.evidence && b.evidence.length;
        const id = 'beh-' + p.id + '-' + i;
        h += '<tr' + (hasEv ? ' class="clickable" tabindex="0" aria-expanded="false" aria-controls="' + id + '"' : '') + '>';
        h += '<td class="cat">' + esc(b.category) + '</td><td>' + esc(humanize(b.behavior)) + '</td><td class="num" data-style="white-space:nowrap">' + pips(b.rate) + ' ' + rate(b.rate) + '</td><td>' + (b.surface ? '<span class="tag">' + esc(b.surface) + '</span>' : '') + '</td><td class="src">' + esc(b.source) + '</td></tr>';
        if (hasEv) h += '<tr class="detail" id="' + id + '" hidden><td colspan="5">' + evidenceList(b.evidence) + '</td></tr>';
      });
      h += '</tbody></table></div></div></details>';
    });
    return h || '<p class="empty">No behavior analysis in this readout.</p>';
  }

  function renderRuns() {
    if (!runs.length) return '<p class="empty">No individual run data in this readout.</p>';
    const critNames = dims.flatMap((d) => d.criteria);
    let h = '';
    ordered.filter((p) => runsByProfile.has(p.id)).forEach((p) => {
      const rs = runsByProfile.get(p.id);
      const s = p;
      h += '<details class="sub" data-runs-pid="' + esc(p.id) + '"><summary>' + esc(labelOf(p.id)) + '<span class="label">' + rs.length + ' runs' + (s.min != null ? ' · ' + pct(s.min) + '–' + pct(s.max) : '') + '</span></summary><div class="body">';
      h += '<div class="tbl-wrap"><table class="data"><thead><tr><th>Run</th><th>Gates</th><th>Criteria</th><th class="num">Score</th><th class="num">Tokens</th><th class="num">Requests</th><th class="num">Coding time</th><th></th></tr></thead><tbody>';
      rs.forEach((run) => {
        const res = run.results;
        const cr = res.criteriaResults || {};
        const names = Object.keys(cr);
        const passed = names.filter((n) => cr[n].result === 'pass').length;
        const did = 'run-' + run.id;
        h += '<tr class="clickable" data-run="' + esc(run.id) + '" tabindex="0" aria-expanded="false" aria-controls="' + did + '">';
        h += '<td class="mono" data-style="white-space:nowrap" title="' + esc(run.id) + '"><span class="caret" aria-hidden="true">▸</span> ' + shortId(run.id) + '</td>';
        h += '<td><span class="gates">' + GATES.filter((g) => res.gates[g]).map((g) => '<span class="gate ' + esc(res.gates[g].status) + '" title="' + humanize(g) + ': ' + esc(res.gates[g].status) + '">' + g[0].toUpperCase() + '</span>').join('') + '</span></td>';
        h += '<td data-style="white-space:nowrap">' + pips({ passed, total: names.length }) + ' <span class="num">' + passed + '/' + names.length + '</span></td>';
        h += '<td class="num">' + pct(P.runScores[run.id]) + '</td>';
        h += '<td class="num">' + tokens(res.tokens) + '</td><td class="num">' + (res.requests ?? '—') + '</td><td class="num">' + duration(res.durations && res.durations.codingSeconds) + '</td>';
        h += '<td><button class="icon-btn traj" data-run="' + esc(run.id) + '" title="Open trajectory" aria-label="Open trajectory">↗</button></td></tr>';

        h += '<tr class="detail" id="' + did + '" hidden><td colspan="8">';
        if (res.reason) h += '<p class="note" data-style="margin-bottom:.5rem">' + md(res.reason) + '</p>';
        const sortedNames = names.slice().sort((a, b) => (critNames.indexOf(a) + 1 || 999) - (critNames.indexOf(b) + 1 || 999));
        h += '<ul class="run-crit">' + sortedNames.map((n) => {
          const c = cr[n];
          return '<li class="' + esc(c.result) + '"><span class="glyph">' + (c.result === 'pass' ? '✓' : c.result === 'fail' ? '✗' : '–') + '</span><span>' + esc(n) + '</span><span class="why">' + md(c.reason) + '</span></li>';
        }).join('') + '</ul>';
        if (res.behaviorObservations && res.behaviorObservations.length) {
          h += '<p class="label" data-style="margin-top:1rem">Behaviors</p><ul class="run-crit">' + res.behaviorObservations.map((bo) => '<li><span class="glyph">·</span><span>' + esc(bo.category) + ': ' + esc(humanize(bo.behavior)) + '</span><span class="why">' + md(bo.evidence) + '</span></li>').join('') + '</ul>';
        }
        if (res.rootCauses && res.rootCauses.length) {
          h += '<p class="label" data-style="margin-top:1rem">Root causes</p><ul class="run-crit">' + res.rootCauses.map((rc) => '<li><span class="glyph">·</span><span>' + esc(rc.label) + ' (' + esc(rc.section) + ')</span><span class="why">' + md(rc.behaviorChain) + '</span></li>').join('') + '</ul>';
        }
        const links = [];
        if (run.trajectoriesUrl) links.push('<a href="' + esc(run.trajectoriesUrl) + '">Trajectories (zip)</a>');
        if (run.workspaceSnapshotUrl) links.push('<a href="' + esc(run.workspaceSnapshotUrl) + '">Workspace snapshot</a>');
        if (links.length) h += '<p class="jump-row" data-style="margin-top:.75rem">' + links.join('') + '</p>';
        h += '</td></tr>';
      });
      h += '</tbody></table></div></div></details>';
    });
    return h;
  }

  function renderEvidence() {
    let h = '<section id="section-evidence" class="section" aria-labelledby="evidence-title">';
    h += '<div class="section-head"><span class="label">Supporting evidence</span><h2 id="evidence-title" class="hang">Evidence</h2></div>';
    h += '<div class="ev-groups">';
    h += '<details class="group" id="ev-scores"><summary><h3>Criteria across profiles</h3><span class="label">' + dims.reduce((n, d) => n + d.criteria.length, 0) + ' criteria × ' + profiles.length + ' profiles</span></summary><div class="body">' + renderMatrix() + '</div></details>';
    h += '<details class="group" id="ev-behaviors"><summary><h3>What the agent did</h3><span class="label">behaviors per profile</span></summary><div class="body">' + renderBehaviors() + '</div></details>';
    h += '<details class="group" id="ev-runs"><summary><h3>Runs</h3><span class="label">' + runs.length + ' runs</span></summary><div class="body">' + renderRuns() + '</div></details>';
    h += '</div></section>';
    return h;
  }

  // The webview's CSP blocks inline style attributes, so positions are applied through the CSSOM.
  function applyStyles(root) {
    root.querySelectorAll('[data-style]').forEach((el) => {
      el.getAttribute('data-style').split(';').forEach((decl) => {
        const i = decl.indexOf(':');
        if (i > 0) el.style.setProperty(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
      });
      el.removeAttribute('data-style');
    });
  }

  app.innerHTML = renderHero() + renderLift() + renderActions() + renderEvidence();
  applyStyles(app);
  document.title = meta.title + ' · Scope readout';

  // ─── Interaction ───
  function toggle(trigger, target) {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open));
    target.hidden = !open;
    return open;
  }
  function openProfile(row) {
    const detail = document.getElementById(row.getAttribute('aria-controls'));
    if (!detail.innerHTML) {
      detail.innerHTML = profileDetail(row.dataset.pid);
      applyStyles(detail);
    }
    toggle(row, detail);
  }
  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
  function showRun(runId) {
    const run = runById.get(runId);
    if (!run) { toast('Run ' + runId + ' is not in this readout'); return; }
    document.getElementById('ev-runs').open = true;
    const sub = document.querySelector('[data-runs-pid="' + CSS.escape(run.profileId) + '"]');
    if (sub) sub.open = true;
    const row = document.querySelector('tr[data-run="' + CSS.escape(runId) + '"]');
    if (!row) return;
    const detail = document.getElementById(row.getAttribute('aria-controls'));
    if (detail.hidden) toggle(row, detail);
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.querySelectorAll('td').forEach(flash);
  }
  function showGroup(groupId, attr, pid) {
    document.getElementById(groupId).open = true;
    const sub = document.querySelector('[' + attr + '="' + CSS.escape(pid) + '"]');
    if (!sub) return;
    sub.open = true;
    sub.scrollIntoView({ behavior: 'smooth', block: 'start' });
    flash(sub.querySelector('summary'));
  }
  function openTrajectory(runId) {
    host.openTrajectory(runId);
  }

  function activate(evt) {
    const t = evt.target;
    const traj = t.closest('.traj');
    if (traj) { evt.stopPropagation(); openTrajectory(traj.dataset.run); return true; }
    const runLink = t.closest('.run-link');
    if (runLink) { evt.stopPropagation(); showRun(runLink.dataset.run); return true; }
    const jb = t.closest('.jump-behaviors');
    if (jb) { showGroup('ev-behaviors', 'data-behaviors-pid', jb.dataset.pid); return true; }
    const jr = t.closest('.jump-runs');
    if (jr) { showGroup('ev-runs', 'data-runs-pid', jr.dataset.pid); return true; }
    if (t.closest('a, summary, .cdetail .card button')) return false;
    const crit = t.closest('.crit-row.has-ev');
    if (crit) { toggle(crit, document.getElementById(crit.getAttribute('aria-controls'))); return true; }
    const row = t.closest('.crow');
    if (row) { openProfile(row); return true; }
    const tr = t.closest('tr.clickable');
    if (tr) { toggle(tr, document.getElementById(tr.getAttribute('aria-controls'))); return true; }
    return false;
  }
  document.addEventListener('click', activate);
  document.addEventListener('keydown', (evt) => {
    const t = evt.target;
    if ((evt.key === 'Enter' || evt.key === ' ') && t.matches && t.matches('.crow, .crit-row.has-ev, tr.clickable')) {
      evt.preventDefault();
      activate(evt);
      return;
    }
    if (evt.altKey || evt.ctrlKey || evt.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    const target = { '1': 'section-lift', '2': 'section-change', '3': 'section-evidence' }[evt.key];
    if (target) document.getElementById(target).scrollIntoView({ behavior: 'smooth' });
  });

  let toastTimer;
  function toast(msg) {
    const el = document.querySelector('.toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
})();
