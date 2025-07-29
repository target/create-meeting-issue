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
		;(paginateIssues as any).mockResolvedValue(mockIssuesAndPRs)

		const result = await getLabeledIssuesAndPRs('org', 'repo')
		expect(result).toBe(
			'- [ ] https://github.com/org/repo/issues/1\n- [ ] https://github.com/org/repo/pull/4',
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
		;(paginateIssues as any).mockResolvedValue(customLabeledIssues)

		const result = await getLabeledIssuesAndPRs('org', 'repo', 'meeting-topic')

		expect(result).toBe('- [ ] https://github.com/org/repo/issues/1')
		expect(paginateIssues).toHaveBeenCalledWith(
			'org',
			'repo',
			false,
			'meeting-topic',
		)
	})

	test('should handle org-wide search', async () => {
		;(paginateIssues as any).mockResolvedValue(mockOrgWideIssuesAndPRs)

		const result = await getLabeledIssuesAndPRs(
			'org',
			'repo',
			'meeting-topic',
			true,
		)

		expect(result).toBe(
			'- [ ] https://github.com/org/repo1/issues/1\n- [ ] https://github.com/org/repo2/pull/4',
		)
		expect(paginateIssues).toHaveBeenCalledWith(
			'org',
			'repo',
			true,
			'meeting-topic',
		)
	})
})
