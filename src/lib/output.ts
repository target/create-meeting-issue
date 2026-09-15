import { setOutput } from '@actions/core'
import type { DateTime } from 'luxon'

import octokit from './getOctokit.ts'

type IssueSummary = {
	number: number
	title: string
	pull_request?: unknown
}

const findIssueByTitle = async (org: string, repo: string, title: string) => {
	for await (const response of octokit.paginate.iterator(
		octokit.rest.issues.listForRepo,
		{
			owner: org,
			repo,
			state: 'all',
			sort: 'updated',
			direction: 'desc',
			per_page: 100,
		},
	)) {
		const issue = (response.data as IssueSummary[]).find(
			(candidate) => candidate.title === title && !candidate.pull_request,
		)
		if (issue) {
			return issue
		}
	}
}

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
			const title = `Agenda for ${date.toLocaleString()}`
			const existingIssue = await findIssueByTitle(org, repo, title)
			const { data: meetingIssue } = existingIssue
				? await octokit.rest.issues.update({
						owner: org,
						repo,
						issue_number: existingIssue.number,
						title,
						body: bodyContent,
					})
				: await octokit.rest.issues.create({
						owner: org,
						repo,
						title,
						body: bodyContent,
					})
			console.log(`Next meeting on ${date.toLocaleString()}`)
			console.log(
				`${existingIssue ? 'Updated' : 'Created'} issue ${meetingIssue.html_url}`,
			)
			setOutput('ISSUE_URL', meetingIssue.html_url)
			setOutput('NEXT_MEETING_DATE', date.toLocaleString())
			if (location) {
				setOutput('LOCATION', location)
			}
		} catch (err: unknown) {
			console.error('Error creating or updating issue', (err as Error).message)
		}
	}
}

export default output
