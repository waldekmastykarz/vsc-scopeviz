import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildReadoutPresentation } from '../presentation';
import { computeLegacyScores, formatPassRate } from '../views/script';
import { CriteriaBreakdown, CriterionDefinition, ProfileResult, Readout } from '../types';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('formats pass rates and inapplicable gates', () => {
		assert.strictEqual(formatPassRate({ passed: 5, total: 5 }), '5/5');
		assert.strictEqual(formatPassRate('N/A'), 'N/A');
		assert.strictEqual(formatPassRate(undefined), '—');
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

	test('builds presentation capabilities and subtitle from the baseline', () => {
		const readout = createReadout([
			{ profileId: 'baseline', select: { passed: 5, total: 5 }, score: 1, tokens: 10, avgCostUsd: 0.1 },
			{ profileId: 'candidate', select: { passed: 5, total: 5 }, tokens: 20 }
		]);

		assert.deepStrictEqual(buildReadoutPresentation(readout), {
			hasComputedScores: true,
			costMetric: 'tokens',
			subtitle: 'Baseline: Baseline harness · Baseline model · 5 runs/profile'
		});

		readout.metadata.profiles[1].isBaseline = true;
		assert.strictEqual(
			buildReadoutPresentation(readout).subtitle,
			'Baselines: Baseline harness / Baseline model; Candidate harness / Candidate model · 5 runs/profile'
		);
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
