import { setOutput } from '@actions/core'
import type { DateTime } from 'luxon'

import octokit from './getOctokit'

const output = async (
	org: string,
	repo: string,
	isDryRun: boolean,
	bodyContent: string,
	date: DateTime,
	location?: string,
) => {
	if (isDryRun) {
		console.log('Dry run, only outputting issue body')
		console.log(bodyContent)
	} else {
		try {
			const { data: newIssue } = await octokit.rest.issues.create({
				owner: org,
				repo: repo,
				title: `Agenda for ${date.toLocaleString()}`,
				body: bodyContent,
			})
			console.log(`Next meeting on ${date.toLocaleString()}`)
			console.log(`Created issue ${newIssue.html_url}`)
			setOutput('ISSUE_URL', newIssue.html_url)
			setOutput('NEXT_MEETING_DATE', date.toLocaleString())
			if (location) {
				setOutput('LOCATION', location)
			}
		} catch (err: unknown) {
			console.error('Error creating issue', (err as Error).message)
		}
	}
}

export default output
