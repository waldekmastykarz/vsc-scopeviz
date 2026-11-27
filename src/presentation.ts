import { CriteriaBreakdown, CriterionDefinition, Profile, ProfileResult, Readout, Run } from './types';

export type VerdictKind = 'baseline' | 'best' | 'lift' | 'expensive' | 'unclear' | 'drag' | 'none';

export interface Verdict {
  kind: VerdictKind;
  label: string;
  note: string;
}

/** Score and cost of a profile, used to compare it with the baseline. */
export interface Measure {
  score: number | null;
  min: number | null;
  max: number | null;
  /** Cost per run in the readout's cost metric (USD, or tokens for readouts without dollar costs). */
  cost: number | null;
}

export interface ProfileView extends Measure {
  id: string;
  name: string;
  isBaseline: boolean;
  /** True when the score isn't stored in the readout and was computed from gates and criteria. */
  scoreComputed: boolean;
  runScores: number[];
  tokens: number | null;
  scoreDelta: number | null;
  costDelta: number | null;
  costChange: number | null;
  verdict: Verdict;
}

export interface ReadoutPresentation {
  baselineId: string | null;
  baselineCount: number;
  hasComputedScores: boolean;
  costMetric: 'cost' | 'tokens';
  /** Profiles in display order: the baseline first, then alphabetically by name. */
  profiles: ProfileView[];
  /** Score of each run, keyed by run id. */
  runScores: Record<string, number | null>;
}

export function computeLegacyScores(
  profileResult: ProfileResult,
  breakdown: CriteriaBreakdown | undefined,
  criterionDefinitions: CriterionDefinition[] | undefined
): { score: number | null; qualityScore: number | null; reliabilityScore: number | null; computed: true } {
  let gatePassed = 0;
  let gateTotal = 0;
  (['select', 'build', 'test', 'run', 'deploy'] as const).forEach(gate => {
    const passRate = profileResult[gate];
    if (passRate && passRate !== 'N/A') {
      gatePassed += passRate.passed;
      gateTotal += passRate.total;
    }
  });

  let qualityPassed = 0;
  let qualityTotal = 0;
  let criteriaClassified = true;
  if (breakdown) {
    breakdown.dimensions.forEach(dimension => {
      dimension.criteria.forEach(criterion => {
        const definition = criterionDefinitions?.find(candidate =>
          candidate.name === criterion.description || candidate.name === criterion.id
        );
        if (!definition) {
          criteriaClassified = false;
          return;
        }
        if (definition.classification.toLowerCase() !== 'prerequisite') {
          qualityPassed += criterion.passRate.passed;
          qualityTotal += criterion.passRate.total;
        }
      });
    });
  }

  return {
    score: criteriaClassified && (gateTotal + qualityTotal) > 0
      ? (gatePassed + qualityPassed) / (gateTotal + qualityTotal)
      : null,
    qualityScore: criteriaClassified && qualityTotal > 0 ? qualityPassed / qualityTotal : null,
    reliabilityScore: gateTotal > 0 ? gatePassed / gateTotal : null,
    computed: true
  };
}

/**
 * Score of a single run: the readout's runs[].results.score when present, otherwise computed the same way
 * (measured gates plus non-prerequisite criteria) for readouts produced before the field existed.
 */
export function runScore(run: Run, classifications: Map<string, string>): number | null {
  if (typeof run.results.score === 'number') {
    return run.results.score;
  }
  let passed = 0;
  let total = 0;
  Object.values(run.results.gates ?? {}).forEach(gate => {
    if (gate && (gate.status === 'pass' || gate.status === 'fail')) {
      total++;
      if (gate.status === 'pass') {
        passed++;
      }
    }
  });
  Object.entries(run.results.criteriaResults ?? {}).forEach(([name, criterion]) => {
    if (classifications.get(name) === 'prerequisite') {
      return;
    }
    if (criterion.result === 'pass' || criterion.result === 'fail') {
      total++;
      if (criterion.result === 'pass') {
        passed++;
      }
    }
  });
  return total > 0 ? passed / total : null;
}

const MINUS = '\u2212';
const signedPct = (n: number) => (n > 0 ? '+' : n < 0 ? MINUS : '±') + Math.round(Math.abs(n) * 100) + '%';

/**
 * Compares a profile's average score and cost with the baseline's. Cost counts as changed when it moves by at
 * least 10%.
 *
 *              cheaper   about the same   pricier
 *   higher     Lift      Lift             Expensive lift
 *   same       Lift      Unclear          Drag
 *   lower      Drag      Drag             Drag
 */
export function classifyVerdict(profile: Measure, baseline: Measure | null): Verdict {
  if (!baseline || profile.score === null || baseline.score === null) {
    return { kind: 'none', label: '—', note: '' };
  }
  const costChange = baseline.cost !== null && baseline.cost > 0 && profile.cost !== null
    ? (profile.cost - baseline.cost) / baseline.cost
    : null;
  const cheaper = costChange !== null && costChange <= -0.1;
  const pricier = costChange !== null && costChange >= 0.1;
  const costNote = costChange === null ? '' : 'cost ' + signedPct(costChange);

  if (profile.score < baseline.score) {
    return { kind: 'drag', label: 'Drag', note: '' };
  }
  if (profile.score > baseline.score) {
    return pricier
      ? { kind: 'expensive', label: 'Expensive lift', note: costNote }
      : { kind: 'lift', label: 'Lift', note: '' };
  }
  if (cheaper) {
    return { kind: 'lift', label: 'Lift', note: 'same score, ' + costNote };
  }
  if (pricier) {
    return { kind: 'drag', label: 'Drag', note: 'same score, ' + costNote };
  }
  return { kind: 'unclear', label: 'Unclear', note: 'same score and cost' };
}

export function profileName(profile: Profile, baseline: Profile | undefined): string {
  if (profile.name) {
    return profile.name;
  }
  if (baseline && profile.id === baseline.id) {
    return 'Bare baseline';
  }
  const diffs: string[] = [];
  if (baseline && profile.harness !== baseline.harness) {
    diffs.push(profile.harness);
  }
  if (baseline && profile.model !== baseline.model) {
    diffs.push(profile.model);
  }
  const additions: string[] = [];
  if (profile.extensions?.length) {
    additions.push(profile.extensions.join(', '));
  }
  if (profile.additionalInstructions) {
    additions.push('instructions: ' + profile.additionalInstructions);
  }
  if (additions.length) {
    diffs.push((diffs.length ? '' : '+ ') + additions.join(', '));
  }
  return diffs.length ? diffs.join(' · ') : profile.harness;
}

export function buildReadoutPresentation(readout: Readout): ReadoutPresentation {
  const { metadata, scorecard } = readout;
  const profileResults = scorecard.profileResults;
  const baselineCount = metadata.profiles.filter(profile => profile.isBaseline).length;
  // Every profile is compared against one baseline: the first one the readout marks.
  const baseline = metadata.profiles.find(profile => profile.isBaseline);
  const costMetric = profileResults.length > 0 && profileResults.every(result => result.avgCostUsd !== undefined && result.avgCostUsd !== null)
    ? 'cost'
    : 'tokens';

  const classifications = new Map((metadata.criteria ?? []).map(criterion => [criterion.name, criterion.classification.toLowerCase()]));
  const runScores: Record<string, number | null> = {};
  const scoresByProfile = new Map<string, number[]>();
  (readout.runs ?? []).forEach(run => {
    const score = runScore(run, classifications);
    runScores[run.id] = score;
    if (score !== null) {
      scoresByProfile.set(run.profileId, [...(scoresByProfile.get(run.profileId) ?? []), score]);
    }
  });

  const views = metadata.profiles.map(profile => {
    const result = profileResults.find(candidate => candidate.profileId === profile.id);
    const breakdown = scorecard.criteriaBreakdowns.find(candidate => candidate.profileId === profile.id);
    let score: number | null = null;
    let scoreComputed = false;
    if (result && typeof result.score === 'number') {
      score = result.score;
    } else if (result) {
      score = computeLegacyScores(result, breakdown, metadata.criteria).score;
      scoreComputed = true;
    }
    const scores = scoresByProfile.get(profile.id) ?? [];
    const cost = costMetric === 'cost' ? result?.avgCostUsd ?? null : result?.tokens ?? null;
    return {
      id: profile.id,
      name: profileName(profile, baseline),
      isBaseline: !!baseline && baseline.id === profile.id,
      score,
      scoreComputed,
      runScores: scores,
      min: scores.length ? Math.min(...scores) : null,
      max: scores.length ? Math.max(...scores) : null,
      cost,
      tokens: result?.tokens ?? null,
      scoreDelta: null,
      costDelta: null,
      costChange: null,
      verdict: { kind: 'none', label: '—', note: '' }
    } as ProfileView;
  });

  const base = views.find(view => view.isBaseline) ?? null;
  views.forEach(view => {
    if (view.isBaseline) {
      view.verdict = { kind: 'baseline', label: 'Baseline', note: '' };
      return;
    }
    view.verdict = classifyVerdict(view, base);
    if (base && view.score !== null && base.score !== null) {
      view.scoreDelta = view.score - base.score;
    }
    if (base && view.cost !== null && base.cost !== null) {
      view.costDelta = view.cost - base.cost;
      view.costChange = base.cost > 0 ? view.costDelta / base.cost : null;
    }
  });

  // Best lift: the top-scoring profile, only when it's a plain lift. Among tied top scores, the cheapest lift.
  const topScore = Math.max(...views.filter(view => !view.isBaseline && view.score !== null).map(view => view.score as number));
  const best = views
    .filter(view => view.verdict.kind === 'lift' && view.score !== null && Math.abs(view.score - topScore) < 1e-9)
    .sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity))[0];
  if (best) {
    best.verdict = { ...best.verdict, kind: 'best', label: 'Best lift' };
  }

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  views.sort((a, b) => (Number(b.isBaseline) - Number(a.isBaseline)) || collator.compare(a.name, b.name));

  return {
    baselineId: baseline?.id ?? null,
    baselineCount,
    hasComputedScores: profileResults.some(result => typeof result.score !== 'number'),
    costMetric,
    profiles: views,
    runScores
  };
}
