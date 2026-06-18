import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, mock, test } from 'node:test'

const paginateIssues = mock.fn<(...args: any[]) => Promise<any>>()

mock.module('../paginateIssues.ts', {
	namedExports: { paginateIssues },
})

const { default: getLabeledIssuesAndPRs } = await import(
	'../getLabeledIssuesAndPRs.ts'
)

describe('getLabeledIssuesAndPRs', () => {
	afterEach(() => {
		paginateIssues.mock.resetCalls()
	})

	let mockIssuesAndPRs: any[]
	let mockOrgWideIssuesAndPRs: any[]

	beforeEach(() => {
		mockIssuesAndPRs = [
			{
				number: 1,
				title: 'Issue 1',
				html_url: 'https://github.com/org/repo/issues/1',
				labels: [{ name: 'agenda' }],
				pull_request: null,
			},
			{
				number: 4,
				title: 'PR 4',
				html_url: 'https://github.com/org/repo/pull/4',
				labels: [{ name: 'agenda' }],
				pull_request: {},
			},
		]

		mockOrgWideIssuesAndPRs = [
			{
				number: 1,
				title: 'Issue 1',
				html_url: 'https://github.com/org/repo1/issues/1',
				repository_url: 'https://api.github.com/repos/org/repo1',
				labels: [{ name: 'meeting-topic' }],
				pull_request: null,
			},
			{
				number: 4,
				title: 'PR 4',
				html_url: 'https://github.com/org/repo2/pull/4',
				repository_url: 'https://api.github.com/repos/org/repo2',
				labels: [{ name: 'meeting-topic' }],
				pull_request: {},
			},
		]
	})

	test('should return a list of issues and PRs with the agenda label', async () => {
		paginateIssues.mock.mockImplementation(async () => mockIssuesAndPRs)

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		assert.strictEqual(
			result,
			'- [ ] https://github.com/org/repo/issues/1\n- [ ] https://github.com/org/repo/pull/4',
		)
	})

	test('should return an empty string if no issues or PRs have the agenda label', async () => {
		paginateIssues.mock.mockImplementation(async () => [])

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		assert.strictEqual(result, '')
	})

	test('should handle errors gracefully', async () => {
		paginateIssues.mock.mockImplementation(async () => {
			throw new Error('Network error')
		})

		const consoleErrorSpy = mock.method(console, 'error', () => {})

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		assert.strictEqual(result, '')
		assert.deepStrictEqual(consoleErrorSpy.mock.calls[0].arguments, [
			'Error fetching issues',
			'Network error',
		])

		consoleErrorSpy.mock.restore()
	})

	test('should use custom agenda label', async () => {
		const customLabeledIssues = [
			{
				number: 1,
				title: 'Issue with custom label',
				html_url: 'https://github.com/org/repo/issues/1',
				labels: [{ name: 'meeting-topic' }],
				pull_request: null,
			},
		]
		paginateIssues.mock.mockImplementation(async () => customLabeledIssues)

		const result = await getLabeledIssuesAndPRs('org', 'repo', 'meeting-topic')

		assert.strictEqual(result, '- [ ] https://github.com/org/repo/issues/1')
		assert.deepStrictEqual(paginateIssues.mock.calls[0].arguments, [
			'org',
			'repo',
			false,
			'meeting-topic',
		])
	})

	test('should handle org-wide search', async () => {
		paginateIssues.mock.mockImplementation(async () => mockOrgWideIssuesAndPRs)

		const result = await getLabeledIssuesAndPRs(
			'org',
			'repo',
			'meeting-topic',
			true,
		)

		assert.strictEqual(
			result,
			'- [ ] https://github.com/org/repo1/issues/1\n- [ ] https://github.com/org/repo2/pull/4',
		)
		assert.deepStrictEqual(paginateIssues.mock.calls[0].arguments, [
			'org',
			'repo',
			true,
			'meeting-topic',
		])
	})
})
