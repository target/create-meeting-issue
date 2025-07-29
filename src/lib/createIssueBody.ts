const createIssueBody = (
	repo: string,
	slackChannel: string | undefined,
	nextMeetingDateAndTimesAcrossTimeZones: string,
	issues: string,
	location: string,
	agendaLabel: string,
) => {
	const bodyContent = `Agenda for ${repo} meeting

## Meeting Details

[Location](${location})${slackChannel ? ` | [Slack](${slackChannel})` : ''}

## Time

${nextMeetingDateAndTimesAcrossTimeZones}

## Agenda Items

> Generated from issues and pull requests with the '${agendaLabel}' label.

${issues}

`
	return bodyContent
}

export default createIssueBody
