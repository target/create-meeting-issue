import { getInput } from '@actions/core'
import { context } from '@actions/github'
import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import extractInput from '../extractInput'

const MOCK_GITHUB_TOKEN = 'test-token'
const MOCK_OWNER = 'test-owner'
const MOCK_REPO = 'test-repo'
const MOCK_PATH = 'test/path'
const MOCK_SLACK_CHANNEL = 'test-channel'
const MOCK_TIMEZONES = 'UTC,CST'

describe('extractInput', () => {
	vi.mock('@actions/core')
	vi.mock('@actions/github', () => ({
		context: {
			repo: {
				owner: 'test-owner', // hoisted, so cannot use MOCK_OWNER
				repo: 'test-repo', // hoisted, so cannot use MOCK_REPO
			},
		},
	}))

	describe('extractInput', () => {
		it('should extract input correctly', () => {
			;(getInput as Mock).mockImplementation((name: string) => {
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

			expect(input).toEqual({
				token: MOCK_GITHUB_TOKEN,
				org: MOCK_OWNER,
				repo: MOCK_REPO,
				meetingPath: MOCK_PATH,
				slackChannel: MOCK_SLACK_CHANNEL,
				timezones: ['UTC', 'CST'],
				dryRun: true,
			})
		})

		it('should handle optional inputs correctly', () => {
			;(getInput as Mock).mockImplementation((name: string) => {
				const inputs: { [key: string]: string } = {
					GITHUB_TOKEN: MOCK_GITHUB_TOKEN,
					MEETING_PATH: MOCK_PATH,
					TIMEZONES: MOCK_TIMEZONES,
				}
				return inputs[name]
			})

			const input = extractInput()

			expect(input).toEqual({
				token: MOCK_GITHUB_TOKEN,
				org: MOCK_OWNER,
				repo: MOCK_REPO,
				meetingPath: MOCK_PATH,
				slackChannel: undefined,
				timezones: ['UTC', 'CST'],
				dryRun: false,
			})
		})
	})
})
