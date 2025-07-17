import { paginateIssues } from './paginateIssues'

interface Label {
	name?: string | undefined
}

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
 * Fetches all issues and pull requests from the repository that have the 'agenda' label.
 *
 * @returns {Promise<string>} A promise that resolves to a string containing a list of issues and pull requests with the 'agenda' label.
 *
 * @throws {Error} If there is an error fetching the issues from the repository.
 *
 * @example
 * const issuesAndPRs = await getLabeledIssuesAndPRs();
 * console.log(issuesAndPRs);
 */
const getLabeledIssuesAndPRs = async (org: string, repo: string) => {
	let issueContent = ''
	// use octokit to find all issues on the repo with the agenda label
	try {
		const issuesAndPRs = await paginateIssues(org, repo)

		// iterate through each response
		for (const item of issuesAndPRs) {
			if (
				item.labels.some(
					(label: string | Label) =>
						typeof label !== 'string' && label.name === 'agenda',
				)
			) {
				issueContent += `\n- [ ] ${item.pull_request ? 'PR' : 'Issue'} [#${
					item.number
				} ${escapeMarkdownLink(item.title)}](${item.html_url})`
			}
		}
	} catch (err: unknown) {
		console.error('Error fetching issues', (err as Error).message)
	}
	return issueContent
}

export default getLabeledIssuesAndPRs
