import * as assert from 'assert';
import * as vscode from 'vscode';
import { formatPassRate } from '../views/script';

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
});
