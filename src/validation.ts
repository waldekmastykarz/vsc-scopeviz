import { Readout } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUIRED_TOP_LEVEL = ['metadata', 'scorecard', 'behaviorAnalysis', 'actionList'] as const;

const REQUIRED_METADATA = ['title', 'date', 'scenarioType', 'runsPerProfile', 'model', 'harness', 'profiles'] as const;

export function validate(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['File is not a JSON object.'] };
  }

  const obj = data as Record<string, unknown>;

  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in obj)) {
      errors.push(`Missing required field: "${key}"`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const metadata = obj.metadata as Record<string, unknown>;
  if (typeof metadata === 'object' && metadata !== null) {
    for (const key of REQUIRED_METADATA) {
      if (!(key in metadata)) {
        errors.push(`Missing metadata field: "${key}"`);
      }
    }
    if (metadata.profiles && !Array.isArray(metadata.profiles)) {
      errors.push('"metadata.profiles" must be an array.');
    }
  }

  const scorecard = obj.scorecard as Record<string, unknown>;
  if (typeof scorecard === 'object' && scorecard !== null) {
    if (!Array.isArray(scorecard.profileResults)) {
      errors.push('Missing or invalid "scorecard.profileResults".');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function tryParse(text: string): { readout?: Readout; errors: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { errors: ['Invalid JSON — could not parse file.'] };
  }

  const result = validate(data);
  if (!result.valid) {
    return { errors: result.errors };
  }

  return { readout: data as Readout, errors: [] };
}
