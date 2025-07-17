import { paginateIssues } from './paginateIssues'

/**
 * Escapes special characters in a string that are used in Markdown links.
 * This ensures that the characters `[`, `]`, `(`, and `)` are treated as plain text
 * rather than being interpreted as part of a Markdown link.
 *
 * @param text - The input string to escape.
 * @returns A new string with Markdown link characters escaped.
 */
const escapeMarkdownLink = (text: string): string => {
	return text.replace(/([\[\]\(\)])/g, '\\$1')
}

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
	let issueContent = ''
	// use octokit to find all issues with the specified agenda label
	try {
		// The label filtering is now performed in the pagination API call
		const issuesAndPRs = await paginateIssues(org, repo, orgWide, agendaLabel)

		// iterate through each response
		for (const item of issuesAndPRs) {
			let repoInfo = ''
			if (orgWide && item.repository_url) {
				// Extract the repo name from the repository_url, which is in the format
				// https://api.github.com/repos/{owner}/{repo}
				const urlParts = item.repository_url.split('/')
				if (urlParts.length >= 2) {
					repoInfo = `${urlParts[urlParts.length - 1]}/`
				}
			}

			issueContent += `\n- [ ] ${item.pull_request ? 'PR' : 'Issue'} [${repoInfo}#${
				item.number
			} ${escapeMarkdownLink(item.title)}](${item.html_url})`
		}
	} catch (err: unknown) {
		console.error('Error fetching issues', (err as Error).message)
	}
	return issueContent
}

export default getLabeledIssuesAndPRs
