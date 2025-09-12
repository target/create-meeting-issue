import { setOutput } from '@actions/core'
import type { DateTime } from 'luxon'

import { formatDate } from './formatDate'
import octokit from './getOctokit'

const output = async (
	org: string,
	repo: string,
	isDryRun: boolean,
	bodyContent: string,
	date: DateTime,
	location?: string,
	dateFormat: 'iso' | 'locale' = 'locale',
) => {
	if (isDryRun) {
		console.log('Dry run, only outputting issue body')
		console.log(bodyContent)
	} else {
		try {
			const formattedDate = formatDate(date, dateFormat)
			const { data: newIssue } = await octokit.rest.issues.create({
				owner: org,
				repo: repo,
				title: `Agenda for ${formattedDate}`,
				body: bodyContent,
			})
			console.log(`Next meeting on ${formattedDate}`)
			console.log(`Created issue ${newIssue.html_url}`)
			setOutput('ISSUE_URL', newIssue.html_url)
			setOutput('NEXT_MEETING_DATE', formattedDate)
			if (location) {
				setOutput('LOCATION', location)
			}
		} catch (err: unknown) {
			console.error('Error creating issue', (err as Error).message)
		}
	}
}

export default output
