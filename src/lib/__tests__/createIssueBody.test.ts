import { describe, expect, it } from 'vitest'
import createIssueBody from '../createIssueBody'

const MOCK_REPO = 'test-repo'
const MOCK_SLACK = 'https://slack.com/test'
const MOCK_NEXT_MEETING = 'Tomorrow'
const MOCK_ISSUES = '- Issue 1\n- Issue 2'
const MOCK_LOCATION = 'https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5'

describe('createIssueBody', () => {
	it('should generate issue body with all details', () => {
		const result = createIssueBody(
			MOCK_REPO,
			MOCK_SLACK,
			MOCK_NEXT_MEETING,
			MOCK_ISSUES,
			MOCK_LOCATION,
		)

		expect(result).toBe(`Agenda for test-repo meeting

## Meeting Details

[Location](https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5) | [Slack](https://slack.com/test)

## Time

Tomorrow

## Agenda Items

> Generated from issues and pull requests with the 'agenda' label.

- Issue 1
- Issue 2

`)
	})

	it('should generate issue body without slack link', () => {
		const result = createIssueBody(
			MOCK_REPO,
			undefined,
			MOCK_NEXT_MEETING,
			MOCK_ISSUES,
			MOCK_LOCATION,
		)

		expect(result).toBe(`Agenda for test-repo meeting

## Meeting Details

[Location](https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5)

## Time

Tomorrow

## Agenda Items

> Generated from issues and pull requests with the 'agenda' label.

- Issue 1
- Issue 2

`)
	})

	it('should generate issue body with empty issues', () => {
		const result = createIssueBody(
			MOCK_REPO,
			MOCK_SLACK,
			MOCK_NEXT_MEETING,
			'',
			MOCK_LOCATION,
		)

		expect(result).toBe(`Agenda for test-repo meeting

## Meeting Details

[Location](https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5) | [Slack](https://slack.com/test)

## Time

Tomorrow

## Agenda Items

> Generated from issues and pull requests with the 'agenda' label.



`)
	})
})
