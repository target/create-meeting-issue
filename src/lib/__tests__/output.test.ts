import assert from 'node:assert/strict'
import { afterEach, describe, mock, test } from 'node:test'
import { DateTime } from 'luxon'

const issuesCreate = mock.fn<(...args: any[]) => Promise<any>>()
const setOutput = mock.fn()

mock.module('../getOctokit.ts', {
	defaultExport: { rest: { issues: { create: issuesCreate } } },
})
mock.module('@actions/core', {
	namedExports: { setOutput },
})

const { default: output } = await import('../output.ts')

const MOCK_OWNER = 'test-owner'
const MOCK_REPO = 'test-repo'
const MOCK_CONTENT = 'test content'
const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')
const MOCK_LOCATION = 'test-location'

// Mirrors vitest's `toHaveBeenCalledWith`: true if any recorded call matches.
const calledWith = (m: typeof setOutput, ...args: unknown[]) =>
	m.mock.calls.some((call) => {
		try {
			assert.deepStrictEqual(call.arguments, args)
			return true
		} catch {
			return false
		}
	})

describe('output', () => {
	afterEach(() => {
		issuesCreate.mock.resetCalls()
		setOutput.mock.resetCalls()
		mock.restoreAll()
	})

	test('creates an issue and sets outputs when not a dry run', async () => {
		const newIssue = {
			html_url: 'https://github.com/test-org/test-repo/issues/1',
		}
		issuesCreate.mock.mockImplementation(async () => ({ data: newIssue }))

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		assert.ok(issuesCreate.mock.callCount() > 0)
		assert.ok(calledWith(setOutput, 'ISSUE_URL', newIssue.html_url))
		assert.ok(
			calledWith(setOutput, 'NEXT_MEETING_DATE', MOCK_DATE.toLocaleString()),
		)
		assert.ok(calledWith(setOutput, 'LOCATION', MOCK_LOCATION))
	})

	test('logs error when issue creation fails', async () => {
		const error = new Error('Issue creation failed')
		issuesCreate.mock.mockImplementation(async () => {
			throw error
		})
		const consoleErrorSpy = mock.method(console, 'error', () => {})

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		assert.deepStrictEqual(consoleErrorSpy.mock.calls[0].arguments, [
			'Error creating issue',
			error.message,
		])
	})

	test('only logs body content when dry run', async () => {
		const consoleLogSpy = mock.method(console, 'log', () => {})

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			true,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		const logArgs = consoleLogSpy.mock.calls.map((call) => call.arguments)
		assert.deepStrictEqual(logArgs, [
			['Dry run, only outputting issue body'],
			[MOCK_CONTENT],
		])
		assert.strictEqual(issuesCreate.mock.callCount(), 0)
	})
})
