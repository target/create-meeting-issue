import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

const getInput = mock.fn<(name: string) => string | undefined>()

mock.module('@actions/core', {
	namedExports: { getInput },
})
mock.module('@actions/github', {
	namedExports: {
		context: {
			repo: {
				owner: 'test-owner',
				repo: 'test-repo',
			},
		},
	},
})

const { default: extractInput } = await import('../extractInput.ts')

const MOCK_GITHUB_TOKEN = 'test-token'
const MOCK_OWNER = 'test-owner'
const MOCK_REPO = 'test-repo'
const MOCK_PATH = 'test/path'
const MOCK_SLACK_CHANNEL = 'test-channel'
const MOCK_TIMEZONES = 'UTC,CST'

describe('extractInput', () => {
	describe('extractInput', () => {
		it('should extract input correctly', () => {
			getInput.mock.mockImplementation((name: string) => {
				const inputs: { [key: string]: string } = {
					GITHUB_TOKEN: MOCK_GITHUB_TOKEN,
					MEETING_PATH: MOCK_PATH,
					SLACK_CHANNEL: MOCK_SLACK_CHANNEL,
					TIMEZONES: MOCK_TIMEZONES,
					DRY_RUN: 'true',
				}
				return inputs[name]
			})

			const input = extractInput()

			assert.deepStrictEqual(input, {
				token: MOCK_GITHUB_TOKEN,
				org: MOCK_OWNER,
				repo: MOCK_REPO,
				meetingPath: MOCK_PATH,
				slackChannel: MOCK_SLACK_CHANNEL,
				timezones: ['UTC', 'CST'],
				dryRun: true,
				agendaLabel: 'agenda',
				orgWide: false,
			})
		})

		it('should handle optional inputs correctly', () => {
			getInput.mock.mockImplementation((name: string) => {
				const inputs: { [key: string]: string } = {
					GITHUB_TOKEN: MOCK_GITHUB_TOKEN,
					MEETING_PATH: MOCK_PATH,
					TIMEZONES: MOCK_TIMEZONES,
				}
				return inputs[name]
			})

			const input = extractInput()

			assert.deepStrictEqual(input, {
				token: MOCK_GITHUB_TOKEN,
				org: MOCK_OWNER,
				repo: MOCK_REPO,
				meetingPath: MOCK_PATH,
				slackChannel: undefined,
				timezones: ['UTC', 'CST'],
				dryRun: false,
				agendaLabel: 'agenda',
				orgWide: false,
			})
		})

		it('should handle custom agenda label and org wide search', () => {
			getInput.mock.mockImplementation((name: string) => {
				const inputs: { [key: string]: string } = {
					GITHUB_TOKEN: MOCK_GITHUB_TOKEN,
					MEETING_PATH: MOCK_PATH,
					TIMEZONES: MOCK_TIMEZONES,
					AGENDA_LABEL: 'meeting-topic',
					ORG_WIDE: 'true',
				}
				return inputs[name]
			})

			const input = extractInput()

			assert.deepStrictEqual(input, {
				token: MOCK_GITHUB_TOKEN,
				org: MOCK_OWNER,
				repo: MOCK_REPO,
				meetingPath: MOCK_PATH,
				slackChannel: undefined,
				timezones: ['UTC', 'CST'],
				dryRun: false,
				agendaLabel: 'meeting-topic',
				orgWide: true,
			})
		})
	})
})
