import { Readout } from './types';

export interface ReadoutPresentation {
  hasComputedScores: boolean;
  costMetric: 'cost' | 'tokens';
  subtitle: string;
}

export function buildReadoutPresentation(readout: Readout): ReadoutPresentation {
  const profileResults = readout.scorecard.profileResults;
  const baselines = readout.metadata.profiles.filter(profile => profile.isBaseline);

  return {
    hasComputedScores: profileResults.some(result => typeof result.score !== 'number'),
    costMetric: profileResults.length > 0 && profileResults.every(result => result.avgCostUsd !== undefined && result.avgCostUsd !== null)
      ? 'cost'
      : 'tokens',
    subtitle: buildBaselineSubtitle(readout, baselines)
  };
}

function buildBaselineSubtitle(readout: Readout, baselines: Readout['metadata']['profiles']): string {
  const runs = `${readout.metadata.runsPerProfile} runs/profile`;
  if (baselines.length === 0) {
    return `${readout.metadata.harness} · ${readout.metadata.model} · ${runs}`;
  }
  if (baselines.length === 1) {
    return `Baseline: ${baselines[0].harness} · ${baselines[0].model} · ${runs}`;
  }

  const labels = baselines.map(profile => profile.name ?? `${profile.harness} / ${profile.model}`);
  return `Baselines: ${labels.join('; ')} · ${runs}`;
}