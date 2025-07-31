import { join } from 'node:path'
import { getOctokit } from '@actions/github'
import type { Input, MeetingOutput } from '../types'
import { MeetingError } from '../types'
import createIssueBody from './createIssueBody'
import extractInput from './extractInput'
import { readFile } from './fileUtils'
import { fetchAgendaItems } from './github'
import generateOutput from './output'
import parseICS from './parseICS'

/**
 * Main service class for managing meeting issue creation
 */
export class MeetingService {
	private input: Input
	private octokit: ReturnType<typeof getOctokit>

	constructor(input?: Input) {
		this.input = input || extractInput()
		this.octokit = getOctokit(this.input.token)
	}

	/**
	 * Creates a meeting issue with agenda items
	 */
	async createMeetingIssue(): Promise<MeetingOutput> {
		try {
			// Read and parse ICS file
			const icsContents = await readFile(
				join(process.cwd(), this.input.meetingPath),
			)
			const { location, nextMeetingDateAndTimeUTC } =
				await parseICS(icsContents)

			// Fetch agenda items
			const issues = await fetchAgendaItems(
				this.octokit,
				this.input.org,
				this.input.repo,
				this.input.agendaLabel,
				this.input.orgWide,
			)

			// Generate issue body
			const bodyContent = await createIssueBody(
				{
					timezones: this.input.timezones,
					date: nextMeetingDateAndTimeUTC,
					label: this.input.agendaLabel,
					owner: this.input.org,
					repo: this.input.repo,
					issues,
					location,
				},
				this.input.meetingTemplate,
			)

			// Generate output (create issue or dry run)
			return await generateOutput(
				this.octokit,
				this.input.org,
				this.input.repo,
				this.input.dryRun || false,
				bodyContent,
				nextMeetingDateAndTimeUTC,
				location,
			)
		} catch (error) {
			if (error instanceof MeetingError) {
				throw error
			}
			throw new MeetingError(
				'Failed to create meeting issue',
				'MEETING_CREATION_ERROR',
				error as Error,
			)
		}
	}

	/**
	 * Validates the current configuration
	 */
	async validateConfiguration(): Promise<void> {
		const errors: string[] = []

		// Check ICS file exists
		try {
			await readFile(this.input.meetingPath)
		} catch {
			errors.push(`Meeting ICS file not found: ${this.input.meetingPath}`)
		}

		// Check template file exists if custom template specified
		if (this.input.meetingTemplate) {
			try {
				await readFile(this.input.meetingTemplate)
			} catch {
				errors.push(
					`Custom template file not found: ${this.input.meetingTemplate}`,
				)
			}
		}

		if (errors.length > 0) {
			throw new MeetingError(
				`Configuration validation failed: ${errors.join(', ')}`,
				'CONFIGURATION_ERROR',
			)
		}
	}
}

/**
 * Main entry point for the action
 */
export const main = async (): Promise<void> => {
	try {
		const service = new MeetingService()
		await service.validateConfiguration()
		const result = await service.createMeetingIssue()

		console.log('✅ Meeting creation completed successfully')
		if (result.issueUrl) {
			console.log(`Issue URL: ${result.issueUrl}`)
		}
	} catch (error) {
		if (error instanceof MeetingError) {
			console.error(
				`❌ Meeting creation failed [${error.code}]: ${error.message}`,
			)
			if (error.cause) {
				console.error('Underlying error:', error.cause.message)
			}
		} else {
			console.error('❌ Unexpected error:', error)
		}
		process.exit(1)
	}
}
