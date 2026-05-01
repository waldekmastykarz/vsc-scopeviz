export interface Readout {
  metadata: Metadata;
  scorecard: Scorecard;
  behaviorAnalysis: BehaviorAnalysis;
  actionList: ActionList;
  summary?: Summary;
  runs?: Run[];
}

export interface Metadata {
  title: string;
  date: string;
  scenarioType: 'code' | 'response';
  runsPerProfile: number;
  model: string;
  harness: string;
  instruction: string;
  benchmarkId?: string;
  batchDate?: string;
  workspaceSnapshot?: string;
  profiles: Profile[];
  criteria?: CriterionDefinition[];
}

export interface Profile {
  id: string;
  harness: string;
  model: string;
  extensions?: string[];
  os?: string;
  isBaseline?: boolean;
}

export interface CriterionDefinition {
  name: string;
  classification: string;
  instructions?: string;
}

export interface PassRate {
  passed: number;
  total: number;
}

export interface ProfileResult {
  profileId: string;
  runIds?: string[];
  deltaLift?: number;
  deltaDefects?: number;
  deltaTokens?: number;
  codeGenerationRate?: number;
  select: PassRate;
  build?: PassRate;
  test?: PassRate;
  run?: PassRate;
  deploy?: PassRate;
  idiomatic?: PassRate;
  dependencyCurrency?: PassRate;
  configurationCorrectness?: PassRate;
  defects?: number;
  tokens: number;
  requests?: number;
}

export interface CriteriaBreakdown {
  profileId: string;
  dimensions: Dimension[];
}

export interface Dimension {
  name: string;
  passRate: PassRate;
  criteria: CriterionItem[];
}

export interface CriterionItem {
  id?: string;
  description: string;
  passRate: PassRate;
  annotation?: string;
  evidence?: EvidenceRef[];
}

export interface EvidenceRef {
  runId: string;
  stepId?: string;
  turnNumber?: number;
  criterionName?: string;
  excerpt?: string;
}

export interface Scorecard {
  keyFinding?: string;
  criteriaAnalysis?: string;
  profileResults: ProfileResult[];
  criteriaBreakdowns: CriteriaBreakdown[];
}

export interface BehaviorProfile {
  profileId: string;
  narrative?: string;
  behaviors: Behavior[];
}

export interface Behavior {
  category: string;
  behavior: string;
  rate: PassRate;
  surface?: string;
  source: string;
  evidence?: EvidenceRef[];
}

export interface BehaviorAnalysis {
  profiles: BehaviorProfile[];
}

export interface ActionFix {
  priority: number;
  rootCause: string;
  runs: PassRate;
  description: string;
  fixTarget: string;
  ownership?: 'in_profile' | 'external_dependency';
  evidence?: EvidenceRef[];
}

export interface ActionCreate {
  priority: number;
  gap: string;
  runs: PassRate;
  whatToBuild: string;
  type?: 'skill' | 'mcp_tool' | 'instructions' | 'docs';
  rationale?: string;
  evidence?: EvidenceRef[];
}

export interface ActionConstraint {
  priority: number;
  rootCause: string;
  runs: PassRate;
  description: string;
  affected: string;
  mitigation?: string;
  evidence?: EvidenceRef[];
}

export interface ActionList {
  narrative?: string;
  fix?: ActionFix[];
  create?: ActionCreate[];
  constraints?: ActionConstraint[];
}

export interface Summary {
  narrative?: string;
  profileVerdicts?: { profileId: string; verdict: string }[];
}

export interface GateResult {
  status: 'pass' | 'fail' | 'na' | 'skipped';
}

export interface CriterionResult {
  result: 'pass' | 'fail' | 'skipped';
  reason: string;
  trajectoryRef?: string;
}

export interface Run {
  id: string;
  profileId: string;
  batchId?: string;
  name?: string;
  status: 'Done' | 'Failed' | 'Cancelled';
  trajectoryRef?: string;
  trajectoriesUrl?: string;
  workspaceSnapshotUrl?: string;
  owner?: string;
  updatedAt?: string;
  metadata?: { agentVersion?: string; [key: string]: unknown };
  results: RunResults;
}

export interface RunResults {
  durations?: { codingSeconds?: number; evaluationSeconds?: number };
  tokens?: number;
  requests?: number;
  codeGenerated?: boolean;
  defects?: number | null | { rawCount: number; rootCauses?: { category: string; count: number; description: string }[] };
  gates: {
    select: GateResult;
    build?: GateResult;
    test?: GateResult;
    run?: GateResult;
    deploy?: GateResult;
  };
  criteriaResults: Record<string, CriterionResult>;
  behaviorObservations?: {
    behavior: string;
    category: string;
    extensionPointSurface?: string;
    sourceArtifact?: string;
    evidence: string;
    turnNumber?: number;
  }[];
  rootCauses?: {
    label: string;
    section: string;
    source: string;
    affectedDimensions: string[];
    behaviorChain: string;
    evidence?: string;
  }[];
  reason?: string;
}
