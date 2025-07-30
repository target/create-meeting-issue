import { getInput } from '@actions/core'
import { context } from '@actions/github'
import { type Input, MeetingError } from '../types/index.js'

/**
 * Validates timezone string format
 */
const isValidTimezone = (timezone: string): boolean => {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone })
		return true
	} catch {
		return false
	}
}

/**
 * Validates and extracts input from GitHub Actions environment
 */
const extractInput = (): Input => {
	try {
		const token = getInput('GITHUB_TOKEN', { required: true })
		if (!token) {
			throw new MeetingError('GITHUB_TOKEN is required', 'MISSING_TOKEN')
		}

		const meetingPath = getInput('MEETING_PATH') || 'meeting.ics'
		const timezonesInput = getInput('TIMEZONES') || 'Etc/UTC'
		const timezones = timezonesInput.split(',').map((tz) => tz.trim())

		// Validate timezones
		const invalidTimezones = timezones.filter((tz) => !isValidTimezone(tz))
		if (invalidTimezones.length > 0) {
			throw new MeetingError(
				`Invalid timezones: ${invalidTimezones.join(', ')}`,
				'INVALID_TIMEZONE',
			)
		}

		const agendaLabel = getInput('AGENDA_LABEL') || 'agenda'
		if (!agendaLabel.trim()) {
			throw new MeetingError(
				'AGENDA_LABEL cannot be empty',
				'INVALID_AGENDA_LABEL',
			)
		}

		return {
			token,
			org: context.repo.owner,
			repo: context.repo.repo,
			meetingPath,
			slackChannel: getInput('SLACK_CHANNEL') || undefined,
			meetingTemplate: getInput('MEETING_TEMPLATE') || undefined,
			timezones,
			dryRun: getInput('DRY_RUN') === 'true',
			agendaLabel,
			orgWide: getInput('ORG_WIDE') === 'true',
		}
	} catch (error) {
		if (error instanceof MeetingError) {
			throw error
		}
		throw new MeetingError(
			'Failed to extract input',
			'INPUT_EXTRACTION_ERROR',
			error as Error,
		)
	}
}

export default extractInput
