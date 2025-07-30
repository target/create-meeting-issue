import { setOutput } from '@actions/core'
import type { DateTime } from 'luxon'
import { MeetingError, type MeetingOutput } from '../types/index.js'
import { createMeetingIssue } from './github'

/**
 * Handles output generation - either creates issue or logs for dry run
 */
const generateOutput = async (
	octokit: any,
	org: string,
	repo: string,
	isDryRun: boolean,
	bodyContent: string,
	date: DateTime,
	location?: string,
): Promise<MeetingOutput> => {
	const nextMeetingDate = date.toLocaleString()

	if (isDryRun) {
		console.log('=== DRY RUN MODE ===')
		console.log('Issue body that would be created:')
		console.log(bodyContent)
		console.log('===================')
		return {
			nextMeetingDate,
			location,
		}
	}

	try {
		const title = `Meeting Agenda - ${date.toFormat('MMM d, yyyy')}`
		const newIssue = await createMeetingIssue(
			octokit,
			org,
			repo,
			title,
			bodyContent,
		)

		const output: MeetingOutput = {
			issueUrl: newIssue.html_url,
			nextMeetingDate,
			location,
		}

		// Set GitHub Actions outputs
		setOutput('ISSUE_URL', newIssue.html_url)
		setOutput('NEXT_MEETING_DATE', nextMeetingDate)
		if (location) {
			setOutput('LOCATION', location)
		}

		console.log(`✅ Meeting issue created: ${newIssue.html_url}`)
		console.log(`📅 Next meeting: ${nextMeetingDate}`)
		if (location) {
			console.log(`📍 Location: ${location}`)
		}

		return output
	} catch (error) {
		throw new MeetingError(
			'Failed to generate output',
			'OUTPUT_GENERATION_ERROR',
			error as Error,
		)
	}
}

export default generateOutput
