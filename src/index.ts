import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import DOMPurify from 'isomorphic-dompurify'

import createIssueBody from './lib/createIssueBody.ts'
import extractInput from './lib/extractInput.ts'
import generateMeetingTimes from './lib/generateMeetingTimes.ts'
import getLabeledIssuesAndPRs from './lib/getLabeledIssuesAndPRs.ts'
import output from './lib/output.ts'
import parseICS from './lib/parseICS.ts'

const {
	dryRun,
	meetingPath,
	org,
	repo,
	slackChannel,
	timezones,
	agendaLabel,
	orgWide,
} = extractInput()

const isDryRun = dryRun || false

let icsContents: string
try {
	icsContents = readFileSync(join(process.cwd(), meetingPath), 'utf8')
} catch (err: unknown) {
	console.error('Error reading .ics', (err as Error).message)
	throw err
}

const { location, nextMeetingDateAndTimeUTC } = await parseICS(icsContents)
const nextMeetingDateAndTimesAcrossTimeZones = generateMeetingTimes(
	timezones,
	nextMeetingDateAndTimeUTC,
)
const issues = await getLabeledIssuesAndPRs(org, repo, agendaLabel, orgWide)

const bodyContent = createIssueBody(
	repo,
	slackChannel,
	nextMeetingDateAndTimesAcrossTimeZones,
	issues,
	location,
	agendaLabel,
)

const sanitizedBodyContent = DOMPurify.sanitize(bodyContent)

output(
	org,
	repo,
	isDryRun,
	sanitizedBodyContent,
	nextMeetingDateAndTimeUTC,
	location,
)
