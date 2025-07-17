import { afterEach, describe, expect, test, vi } from 'vitest'

import { setOutput } from '@actions/core'
import { DateTime } from 'luxon'

import octokit from '../getOctokit'
import output from '../output'

const MOCK_OWNER = 'test-owner'
const MOCK_REPO = 'test-repo'
const MOCK_CONTENT = 'test content'
const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')
const MOCK_LOCATION = 'test-location'

describe('output', () => {
	vi.mock('../getOctokit', () => ({
		__esModule: true,
		default: { rest: { issues: { create: vi.fn() } } },
	}))

	vi.mock('@actions/core')

	afterEach(() => {
		vi.resetAllMocks()
	})

	test('creates an issue and sets outputs when not a dry run', async () => {
		const newIssue = {
			html_url: 'https://github.com/test-org/test-repo/issues/1',
		}
		vi.spyOn(octokit.rest.issues, 'create').mockResolvedValue({
			//@ts-ignore - we don't need the whole thing
			data: newIssue,
		})

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		expect(octokit.rest.issues.create).toHaveBeenCalled()
		expect(setOutput).toHaveBeenCalledWith('ISSUE_URL', newIssue.html_url)
		expect(setOutput).toHaveBeenCalledWith(
			'NEXT_MEETING_DATE',
			MOCK_DATE.toLocaleString(),
		)
		expect(setOutput).toHaveBeenCalledWith('LOCATION', MOCK_LOCATION)
	})

	test('logs error when issue creation fails', async () => {
		const error = new Error('Issue creation failed')
		vi.spyOn(octokit.rest.issues, 'create').mockRejectedValue(error)
		const consoleErrorSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {})

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error creating issue',
			error.message,
		)
	})

	test('only logs body content when dry run', async () => {
		const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			true,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		expect(consoleLogSpy).toHaveBeenCalledWith(
			'Dry run, only outputting issue body',
		)
		expect(consoleLogSpy).toHaveBeenCalledWith(MOCK_CONTENT)
		expect(octokit.rest.issues.create).not.toHaveBeenCalled()
	})
})
