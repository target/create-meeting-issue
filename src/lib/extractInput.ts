import { getInput } from '@actions/core'
import { context } from '@actions/github'

export type Input = {
	token: string
	org: string
	repo: string
	meetingPath: string
	slackChannel?: string
	timezones: string[]
	dryRun?: boolean
	agendaLabel: string
	orgWide: boolean
}

const extractInput = (): Input => {
	return {
		token: getInput('GITHUB_TOKEN', { required: true }),
		org: context.repo.owner,
		repo: context.repo.repo,
		meetingPath: getInput('MEETING_PATH'),
		slackChannel: getInput('SLACK_CHANNEL'),
		timezones: getInput('TIMEZONES').split(','),
		dryRun: getInput('DRY_RUN') === 'true',
		agendaLabel: getInput('AGENDA_LABEL') || 'agenda',
		orgWide: getInput('ORG_WIDE') === 'true',
	}
}

export default extractInput
