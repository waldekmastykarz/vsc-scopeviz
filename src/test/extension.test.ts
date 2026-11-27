import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildReadoutPresentation, classifyVerdict, computeLegacyScores, Measure } from '../presentation';
import { CriteriaBreakdown, CriterionDefinition, ProfileResult, Readout, Run } from '../types';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('computes legacy scores without counting prerequisite criteria twice', () => {
		const profileResult: ProfileResult = {
			profileId: 'haiku-json',
			select: { passed: 5, total: 5 },
			tokens: 0
		};
		const breakdown: CriteriaBreakdown = {
			profileId: 'haiku-json',
			dimensions: [{
				name: 'Select',
				passRate: { passed: 5, total: 5 },
				criteria: [{ description: 'Uses the CLI', passRate: { passed: 5, total: 5 } }]
			}, {
				name: 'Configuration correctness',
				passRate: { passed: 2, total: 5 },
				criteria: [{ description: 'Matches ground truth', passRate: { passed: 2, total: 5 } }]
			}]
		};
		const definitions: CriterionDefinition[] = [
			{ name: 'Uses the CLI', classification: 'prerequisite' },
			{ name: 'Matches ground truth', classification: 'configurationCorrectness' }
		];

		assert.deepStrictEqual(computeLegacyScores(profileResult, breakdown, definitions), {
			score: 0.7,
			qualityScore: 0.4,
			reliabilityScore: 1,
			computed: true
		});

		breakdown.dimensions[1].passRate = { passed: 3, total: 5 };
		breakdown.dimensions[1].criteria[0].passRate = { passed: 3, total: 5 };
		assert.strictEqual(computeLegacyScores(profileResult, breakdown, definitions).score, 0.8);
	});

	test('does not guess a legacy score when criterion classification is unavailable', () => {
		const profileResult: ProfileResult = {
			profileId: 'legacy',
			select: { passed: 5, total: 5 },
			tokens: 0
		};
		const breakdown: CriteriaBreakdown = {
			profileId: 'legacy',
			dimensions: [{
				name: 'Quality',
				passRate: { passed: 4, total: 5 },
				criteria: [{ description: 'Unknown criterion', passRate: { passed: 4, total: 5 } }]
			}]
		};

		assert.deepStrictEqual(computeLegacyScores(profileResult, breakdown, undefined), {
			score: null,
			qualityScore: null,
			reliabilityScore: 1,
			computed: true
		});
	});

	test('classifies a profile against the baseline runs, average and cost', () => {
		const baseline: Measure = { score: 0.47, min: 0.41, max: 0.59, cost: 0.49 };
		const verdict = (profile: Measure) => classifyVerdict(profile, baseline);

		// Every run at or above the baseline's best run is a lift, even when the ranges touch.
		assert.strictEqual(verdict({ score: 0.94, min: 0.59, max: 1, cost: 0.4 }).kind, 'lift');
		assert.deepStrictEqual(verdict({ score: 0.94, min: 0.88, max: 1, cost: 1.24 }), { kind: 'expensive', label: 'Expensive lift', note: 'cost +153%' });
		// A lower average is drag, even when the runs overlap the baseline.
		assert.deepStrictEqual(verdict({ score: 0.32, min: 0.24, max: 0.47, cost: 0.009 }), { kind: 'drag', label: 'Drag', note: 'average below the baseline' });
		assert.deepStrictEqual(verdict({ score: 0.27, min: 0.24, max: 0.41, cost: 0.03 }), { kind: 'drag', label: 'Drag', note: '' });
		// Overlapping runs with a higher average: cost decides when it changes by at least 10%.
		assert.strictEqual(verdict({ score: 0.59, min: 0.47, max: 0.71, cost: 0.33 }).note, 'score unclear, cost \u221233%');
		assert.strictEqual(verdict({ score: 0.59, min: 0.47, max: 0.71, cost: 0.5 }).kind, 'unclear');
		assert.strictEqual(verdict({ score: 0.47, min: 0.41, max: 0.59, cost: 0.6 }).kind, 'drag');
		assert.strictEqual(verdict({ score: 0.47, min: 0.41, max: 0.59, cost: 0.5 }).note, 'same score as the baseline');
		assert.strictEqual(classifyVerdict({ score: 0.5, min: null, max: null, cost: null }, null).kind, 'none');
	});

	test('compares every profile with the first baseline, baseline first, then by name', () => {
		const readout = createReadout([
			{ profileId: 'baseline', select: { passed: 5, total: 5 }, score: 0.5, tokens: 10, avgCostUsd: 0.1 },
			{ profileId: 'candidate', select: { passed: 5, total: 5 }, score: 0.9, tokens: 20, avgCostUsd: 0.12 },
			{ profileId: 'other', select: { passed: 5, total: 5 }, score: 0.9, tokens: 20, avgCostUsd: 0.11 }
		]);
		readout.metadata.profiles = [
			{ id: 'candidate', name: 'Skill v1.10', harness: 'h', model: 'm' },
			{ id: 'other', name: 'Skill v1.9', harness: 'h', model: 'm', isBaseline: true },
			{ id: 'baseline', name: 'Bare', harness: 'h', model: 'm', isBaseline: true }
		];
		readout.scorecard.profileResults[2].score = 0.5;

		const presentation = buildReadoutPresentation(readout);
		assert.strictEqual(presentation.baselineId, 'other');
		assert.strictEqual(presentation.baselineCount, 2);
		assert.deepStrictEqual(presentation.profiles.map(p => p.name), ['Skill v1.9', 'Bare', 'Skill v1.10']);
		assert.strictEqual(presentation.profiles[2].scoreDelta, 0.4);
	});

	test('marks the highest-scoring, then cheapest, lift as the best lift', () => {
		const readout = createReadout([
			{ profileId: 'baseline', select: { passed: 5, total: 5 }, score: 0.5, tokens: 10, avgCostUsd: 0.1 },
			{ profileId: 'candidate', select: { passed: 5, total: 5 }, score: 1, tokens: 20, avgCostUsd: 0.12 },
			{ profileId: 'cheaper', select: { passed: 5, total: 5 }, score: 1, tokens: 20, avgCostUsd: 0.11 },
			{ profileId: 'pricey', select: { passed: 5, total: 5 }, score: 1, tokens: 20, avgCostUsd: 0.2 }
		]);
		readout.metadata.profiles.push(
			{ id: 'cheaper', harness: 'Cheaper harness', model: 'm' },
			{ id: 'pricey', harness: 'Pricey harness', model: 'm' }
		);

		const kinds = Object.fromEntries(buildReadoutPresentation(readout).profiles.map(p => [p.id, p.verdict.kind]));
		assert.deepStrictEqual(kinds, { baseline: 'baseline', candidate: 'lift', cheaper: 'best', pricey: 'expensive' });
	});

	test('uses stored run scores and computes them for older readouts without counting prerequisites', () => {
		const readout = createReadout([
			{ profileId: 'baseline', select: { passed: 2, total: 2 }, score: 0.5, tokens: 10, avgCostUsd: 0.1 }
		]);
		readout.metadata.criteria = [
			{ name: 'Upgraded', classification: 'prerequisite' },
			{ name: 'Pinned', classification: 'dependencyCurrency' },
			{ name: 'Configured', classification: 'configurationCorrectness' }
		];
		const run = (id: string, score?: number): Run => ({
			id,
			profileId: 'baseline',
			status: 'Done',
			results: {
				score,
				gates: { select: { status: 'pass' }, build: { status: 'skipped' } },
				criteriaResults: {
					Upgraded: { result: 'fail', reason: '' },
					Pinned: { result: 'pass', reason: '' },
					Configured: { result: 'fail', reason: '' }
				}
			}
		});
		readout.runs = [run('stored', 0.25), run('computed')];

		const presentation = buildReadoutPresentation(readout);
		assert.deepStrictEqual(presentation.runScores, { stored: 0.25, computed: 2 / 3 });
		assert.strictEqual(presentation.profiles[0].min, 0.25);
	});

	test('uses dollar cost only when every profile provides it', () => {
		const readout = createReadout([
			{ profileId: 'baseline', select: { passed: 5, total: 5 }, score: 1, tokens: 10, avgCostUsd: 0.1 },
			{ profileId: 'candidate', select: { passed: 5, total: 5 }, score: 1, tokens: 20, avgCostUsd: 0.2 }
		]);

		assert.strictEqual(buildReadoutPresentation(readout).costMetric, 'cost');
		assert.strictEqual(buildReadoutPresentation(readout).hasComputedScores, false);
	});
});

function createReadout(profileResults: ProfileResult[]): Readout {
	return {
		metadata: {
			title: 'Readout',
			date: '2026-09-16',
			scenarioType: 'code',
			runsPerProfile: 5,
			model: 'All models',
			harness: 'All harnesses',
			instruction: 'Test',
			profiles: [{
				id: 'baseline',
				harness: 'Baseline harness',
				model: 'Baseline model',
				isBaseline: true
			}, {
				id: 'candidate',
				harness: 'Candidate harness',
				model: 'Candidate model'
			}]
		},
		scorecard: { profileResults, criteriaBreakdowns: [] },
		behaviorAnalysis: { profiles: [] },
		actionList: {}
	};
}
