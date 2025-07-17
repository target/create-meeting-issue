import octokit from './getOctokit'

export const paginateIssues = async (org: string, repo: string) => {
	const issues = []
	const iterator = octokit.paginate.iterator(
		'GET /repos/{owner}/{repo}/issues',
		{
			owner: org,
			repo: repo,
			state: 'open',
			per_page: 100,
		},
	)

	for await (const { data } of iterator) {
		issues.push(...data)
	}

	return issues
}
