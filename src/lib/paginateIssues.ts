import octokit from './getOctokit'
/**
 * Fetches GitHub issues and/or PRs with a specific label
 */
export const paginateIssues = async (
	org: string,
	repo: string,
	orgWide = false,
	agendaLabel = 'agenda',
) => {
	if (orgWide) {
		return await octokit.paginate('GET /search/issues', {
			q: `owner:${org} is:open label:"${agendaLabel}"`,
			per_page: 100,
		})
	}

	return await octokit.paginate('GET /repos/{owner}/{repo}/issues', {
		owner: org,
		repo: repo,
		state: 'open',
		labels: agendaLabel,
		per_page: 100,
	})
}
