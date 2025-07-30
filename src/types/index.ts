import type { DateTime } from 'luxon'
import type { fetchAgendaItems } from '../lib/github'

export interface Input {
	token: string
	org: string
	repo: string
	meetingPath: string
	slackChannel?: string
	meetingTemplate?: string
	timezones: string[]
	dryRun?: boolean
	agendaLabel: string
	orgWide: boolean
}

export interface ParsedMeetingData {
	location: string
	nextMeetingDateAndTimeUTC: DateTime
}

type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never

export interface TemplateData {
	timezones: string[]
	date: DateTime
	label: string
	owner: string
	repo: string
	issues: Unpromise<ReturnType<typeof fetchAgendaItems>>
	location: string
}

export interface MeetingOutput {
	issueUrl?: string
	nextMeetingDate: string
	location?: string
}

export interface MeetingConfig {
	input: Input
	octokit: any
}

export class MeetingError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message)
		this.name = 'MeetingError'
	}
}
