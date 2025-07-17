import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import getLabeledIssuesAndPRs from '../getLabeledIssuesAndPRs'
import { paginateIssues } from '../paginateIssues'

describe('getLabeledIssuesAndPRs', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	vi.mock('../paginateIssues', () => ({
		paginateIssues: vi.fn(),
	}))

	let mockIssuesAndPRs: any[]

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
				number: 2,
				title: 'PR 2',
				html_url: 'https://github.com/org/repo/pull/2',
				labels: [{ name: 'foo' }],
				pull_request: {},
			},
			{
				number: 3,
				title: 'Issue 3',
				html_url: 'https://github.com/org/repo/pull/3',
				labels: [{ name: 'foo' }],
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
	})

	test('should return a list of issues and PRs with the agenda label', async () => {
		;(paginateIssues as any).mockResolvedValue(mockIssuesAndPRs)

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		expect(result).toBe(
			'\n- [ ] Issue [#1 Issue 1](https://github.com/org/repo/issues/1)\n- [ ] PR [#4 PR 4](https://github.com/org/repo/pull/4)',
		)
	})

	test('should return an empty string if no issues or PRs have the agenda label', async () => {
		;(paginateIssues as any).mockResolvedValue([])

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		expect(result).toBe('')
	})

	test('should handle errors gracefully', async () => {
		;(paginateIssues as any).mockRejectedValue(new Error('Network error'))

		const consoleErrorSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {})

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		expect(result).toBe('')
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error fetching issues',
			'Network error',
		)

		consoleErrorSpy.mockRestore()
	})

	test('should escape special characters in issue titles', async () => {
		;(paginateIssues as any).mockResolvedValue([
			{
				number: 5,
				title: 'Can I inject?](https://example.com) [',
				html_url: 'https://github.com/org/repo/issues/5',
				labels: [{ name: 'agenda' }],
				pull_request: null,
			},
		])

		const result = await getLabeledIssuesAndPRs('org', 'repo')

		expect(result).toBe(
			`
- [ ] Issue [#5 Can I inject?\\]\\(https://example.com\\) \\[](https://github.com/org/repo/issues/5)`,
		)
	})
})
