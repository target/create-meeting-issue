import type { getOctokit } from '@actions/github'
import { MeetingError } from '../types'

/**
 * Fetches GitHub issues and/or PRs with a specific label
 */
export const fetchAgendaItems = async (
	octokit: ReturnType<typeof getOctokit>,
	org: string,
	repo: string,
	agendaLabel: string,
	orgWide = false,
) => {
	return orgWide
		? octokit.paginate('GET /search/issues', {
				q: `owner:${org} is:open label:"${agendaLabel}"`,
				per_page: 100,
			})
		: octokit.paginate('GET /repos/{owner}/{repo}/issues', {
				owner: org,
				repo: repo,
				state: 'open',
				labels: agendaLabel,
				per_page: 100,
			})
}

/**
 * Creates a GitHub issue with the meeting agenda
 */
export const createMeetingIssue = async (
	octokit: ReturnType<typeof getOctokit>,
	org: string,
	repo: string,
	title: string,
	body: string,
) => {
	try {
		const { data: newIssue } = await octokit.rest.issues.create({
			owner: org,
			repo: repo,
			title,
			body,
		})
		return newIssue
	} catch (error) {
		throw new MeetingError(
			'Failed to create meeting issue',
			'ISSUE_CREATION_ERROR',
			error as Error,
		)
	}
}
