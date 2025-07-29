import { paginateIssues } from './paginateIssues'

/**
 * Fetches all issues and pull requests from the repository or organization that have the specified label.
 *
 * @param {string} org - The organization name.
 * @param {string} repo - The repository name.
 * @param {string} agendaLabel - The label to filter issues by.
 * @param {boolean} orgWide - Whether to search across the entire organization.
 * @returns {Promise<string>} A promise that resolves to a string containing a list of issues and pull requests with the specified label.
 *
 * @throws {Error} If there is an error fetching the issues from the repository.
 *
 * @example
 * const issuesAndPRs = await getLabeledIssuesAndPRs('myorg', 'myrepo', 'meeting-topic', true);
 * console.log(issuesAndPRs);
 */
const getLabeledIssuesAndPRs = async (
	org: string,
	repo: string,
	agendaLabel = 'agenda',
	orgWide = false,
) => {
	const issueContent = ''
	// use octokit to find all issues with the specified agenda label
	try {
		// The label filtering is now performed in the pagination API call
		const issuesAndPRs = await paginateIssues(org, repo, orgWide, agendaLabel)

		return issuesAndPRs.map((item) => `- [ ] ${item.html_url}`).join('\n')
	} catch (err: unknown) {
		console.error('Error fetching issues', (err as Error).message)
	}
	return issueContent
}

export default getLabeledIssuesAndPRs
