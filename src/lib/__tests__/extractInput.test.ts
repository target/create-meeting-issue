import { getInput } from '@actions/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MeetingError } from '../../types'
import extractInput from '../extractInput'

process.env.GITHUB_REPOSITORY = 'test-org/test-repo'

const mockGetInput = vi.mocked(getInput)

describe('extractInput', () => {
	describe('valid inputs', () => {
		it('should extract input with all required fields', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					MEETING_PATH: 'custom-meeting.ics',
					TIMEZONES: 'America/New_York,Europe/London',
					AGENDA_LABEL: 'meeting-agenda',
					SLACK_CHANNEL: '#team-chat',
					MEETING_TEMPLATE: 'custom-template.md',
					DRY_RUN: 'true',
					ORG_WIDE: 'false',
				}
				return inputs[key] || ''
			})

			const result = extractInput()

			expect(result).toEqual({
				token: 'test-token',
				org: 'test-org',
				repo: 'test-repo',
				meetingPath: 'custom-meeting.ics',
				slackChannel: '#team-chat',
				meetingTemplate: 'custom-template.md',
				timezones: ['America/New_York', 'Europe/London'],
				dryRun: true,
				agendaLabel: 'meeting-agenda',
				orgWide: false,
			})
		})

		it('should use defaults for optional fields', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
				}
				return inputs[key] || ''
			})

			const result = extractInput()

			expect(result).toEqual({
				token: 'test-token',
				org: 'test-org',
				repo: 'test-repo',
				meetingPath: 'meeting.ics',
				slackChannel: undefined,
				meetingTemplate: undefined,
				timezones: ['Etc/UTC'],
				dryRun: false,
				agendaLabel: 'agenda',
				orgWide: false,
			})
		})

		it('should handle multiple timezones with whitespace', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					TIMEZONES: 'America/New_York, Europe/London , Asia/Tokyo',
				}
				return inputs[key] || ''
			})

			const result = extractInput()

			expect(result.timezones).toEqual([
				'America/New_York',
				'Europe/London',
				'Asia/Tokyo',
			])
		})

		it('should parse DRY_RUN correctly', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					DRY_RUN: 'true',
				}
				return inputs[key] || ''
			})

			const result = extractInput()
			expect(result.dryRun).toBe(true)
		})

		it('should parse ORG_WIDE correctly', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					ORG_WIDE: 'true',
				}
				return inputs[key] || ''
			})

			const result = extractInput()
			expect(result.orgWide).toBe(true)
		})
	})

	describe('validation errors', () => {
		it('should throw MeetingError when GITHUB_TOKEN is missing', () => {
			mockGetInput.mockImplementation(() => '')

			expect(() => extractInput()).toThrow(MeetingError)
			expect(() => extractInput()).toThrow('GITHUB_TOKEN is required')
		})

		it('should throw MeetingError for invalid timezones', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					TIMEZONES: 'Invalid/Timezone,America/New_York',
				}
				return inputs[key] || ''
			})

			expect(() => extractInput()).toThrow(MeetingError)
			expect(() => extractInput()).toThrow(
				'Invalid timezones: Invalid/Timezone',
			)
		})

		it('should throw MeetingError for empty agenda label', () => {
			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					AGENDA_LABEL: '   ',
				}
				return inputs[key] || ''
			})

			expect(() => extractInput()).toThrow(MeetingError)
			expect(() => extractInput()).toThrow('AGENDA_LABEL cannot be empty')
		})

		it('should wrap unexpected errors in MeetingError', () => {
			mockGetInput.mockImplementation(() => {
				throw new Error('Unexpected error')
			})

			expect(() => extractInput()).toThrow(MeetingError)
			expect(() => extractInput()).toThrow('Failed to extract input')
		})
	})

	describe('timezone validation', () => {
		it('should accept valid timezones', () => {
			const validTimezones = [
				'America/New_York',
				'Europe/London',
				'Asia/Tokyo',
				'UTC',
				'Etc/UTC',
			]

			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					TIMEZONES: validTimezones.join(','),
				}
				return inputs[key] || ''
			})

			const result = extractInput()
			expect(result.timezones).toEqual(validTimezones)
		})

		it('should reject invalid timezone formats', () => {
			const invalidTimezones = [
				'Invalid/Zone',
				'Not_A_Timezone',
				'America/Invalid_City',
			]

			mockGetInput.mockImplementation((key) => {
				const inputs: Record<string, string> = {
					GITHUB_TOKEN: 'test-token',
					TIMEZONES: invalidTimezones.join(','),
				}
				return inputs[key] || ''
			})

			expect(() => extractInput()).toThrow(MeetingError)
		})
	})
})
