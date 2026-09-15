import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, mock, test } from 'node:test'
import { DateTime } from 'luxon'

const issuesCreate = mock.fn<(...args: any[]) => Promise<any>>()
const issuesUpdate = mock.fn<(...args: any[]) => Promise<any>>()
const issuesListForRepo = mock.fn()
const paginateIterator = mock.fn<(...args: any[]) => AsyncGenerator<any>>()
const setOutput = mock.fn()

mock.module('../getOctokit.ts', {
	defaultExport: {
		paginate: { iterator: paginateIterator },
		rest: {
			issues: {
				create: issuesCreate,
				update: issuesUpdate,
				listForRepo: issuesListForRepo,
			},
		},
	},
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
const MOCK_TITLE = `Agenda for ${MOCK_DATE.toLocaleString()}`

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
	beforeEach(() => {
		paginateIterator.mock.mockImplementation(async function* () {
			yield { data: [] }
		})
	})

	afterEach(() => {
		issuesCreate.mock.resetCalls()
		issuesUpdate.mock.resetCalls()
		issuesListForRepo.mock.resetCalls()
		paginateIterator.mock.resetCalls()
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
		assert.deepStrictEqual(issuesCreate.mock.calls[0].arguments[0], {
			owner: MOCK_OWNER,
			repo: MOCK_REPO,
			title: MOCK_TITLE,
			body: MOCK_CONTENT,
		})
		assert.deepStrictEqual(paginateIterator.mock.calls[0].arguments, [
			issuesListForRepo,
			{
				owner: MOCK_OWNER,
				repo: MOCK_REPO,
				state: 'all',
				sort: 'updated',
				direction: 'desc',
				per_page: 100,
			},
		])
		assert.ok(calledWith(setOutput, 'ISSUE_URL', newIssue.html_url))
		assert.ok(
			calledWith(setOutput, 'NEXT_MEETING_DATE', MOCK_DATE.toLocaleString()),
		)
		assert.ok(calledWith(setOutput, 'LOCATION', MOCK_LOCATION))
	})

	test('updates the existing issue for the next meeting', async () => {
		const existingIssue = {
			number: 12,
			title: MOCK_TITLE,
			html_url: 'https://github.com/test-org/test-repo/issues/12',
		}
		paginateIterator.mock.mockImplementation(async function* () {
			yield { data: [existingIssue] }
		})
		issuesUpdate.mock.mockImplementation(async () => ({ data: existingIssue }))

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		assert.strictEqual(issuesCreate.mock.callCount(), 0)
		assert.deepStrictEqual(issuesUpdate.mock.calls[0].arguments[0], {
			owner: MOCK_OWNER,
			repo: MOCK_REPO,
			issue_number: existingIssue.number,
			title: MOCK_TITLE,
			body: MOCK_CONTENT,
		})
		assert.ok(calledWith(setOutput, 'ISSUE_URL', existingIssue.html_url))
	})

	test('ignores pull requests with the same title', async () => {
		const pullRequest = {
			number: 10,
			title: MOCK_TITLE,
			pull_request: { url: 'https://api.github.com/pulls/10' },
		}
		const existingIssue = {
			number: 12,
			title: MOCK_TITLE,
			html_url: 'https://github.com/test-org/test-repo/issues/12',
		}
		paginateIterator.mock.mockImplementation(async function* () {
			yield { data: [pullRequest] }
			yield { data: [existingIssue] }
		})
		issuesUpdate.mock.mockImplementation(async () => ({ data: existingIssue }))

		await output(
			MOCK_OWNER,
			MOCK_REPO,
			false,
			MOCK_CONTENT,
			MOCK_DATE,
			MOCK_LOCATION,
		)

		assert.strictEqual(issuesCreate.mock.callCount(), 0)
		assert.strictEqual(issuesUpdate.mock.callCount(), 1)
		assert.strictEqual(
			issuesUpdate.mock.calls[0].arguments[0].issue_number,
			existingIssue.number,
		)
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
			'Error creating or updating issue',
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
		assert.strictEqual(issuesUpdate.mock.callCount(), 0)
		assert.strictEqual(paginateIterator.mock.callCount(), 0)
	})
})
