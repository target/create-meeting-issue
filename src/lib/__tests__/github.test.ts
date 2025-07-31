import { getOctokit } from '@actions/github'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MeetingError } from '../../types'
import { createMeetingIssue, fetchAgendaItems } from '../github'

vi.mock('@actions/github')

const mockOctokit = {
	paginate: vi.fn(),
	rest: {
		issues: {
			create: vi.fn(),
		},
	},
} as any // Use any type for mock to avoid complex type issues

const mockGetOctokit = vi.mocked(getOctokit)

describe('github', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		mockGetOctokit.mockReturnValue(mockOctokit as any)
	})

	describe('fetchAgendaItems', () => {
		const mockIssues = [
			{
				id: 1,
				title: 'First agenda item',
				html_url: 'https://github.com/test-org/test-repo/issues/1',
				labels: [{ name: 'agenda' }],
			},
			{
				id: 2,
				title: 'Second agenda item',
				html_url: 'https://github.com/test-org/test-repo/issues/2',
				labels: [{ name: 'agenda' }],
			},
		]

		describe('repository-specific search', () => {
			it('should fetch agenda items for specific repository', async () => {
				mockOctokit.paginate.mockResolvedValue(mockIssues)

				const result = await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'agenda',
					false,
				)

				expect(mockOctokit.paginate).toHaveBeenCalledWith(
					'GET /repos/{owner}/{repo}/issues',
					{
						owner: 'test-org',
						repo: 'test-repo',
						state: 'open',
						labels: 'agenda',
						per_page: 100,
					},
				)
				expect(result).toEqual(mockIssues)
			})

			it('should handle empty results', async () => {
				mockOctokit.paginate.mockResolvedValue([])

				const result = await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'agenda',
					false,
				)

				expect(result).toEqual([])
			})

			it('should handle custom agenda label', async () => {
				mockOctokit.paginate.mockResolvedValue(mockIssues)

				await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'custom-agenda',
					false,
				)

				expect(mockOctokit.paginate).toHaveBeenCalledWith(
					'GET /repos/{owner}/{repo}/issues',
					expect.objectContaining({
						labels: 'custom-agenda',
					}),
				)
			})
		})

		describe('organization-wide search', () => {
			it('should fetch agenda items organization-wide when orgWide is true', async () => {
				mockOctokit.paginate.mockResolvedValue(mockIssues)

				const result = await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'agenda',
					true,
				)

				expect(mockOctokit.paginate).toHaveBeenCalledWith(
					'GET /search/issues',
					{
						q: 'owner:test-org is:open label:"agenda"',
						per_page: 100,
					},
				)

				expect(result).toEqual(mockIssues)
			})

			it('should handle organization-wide search with custom label', async () => {
				mockOctokit.paginate.mockResolvedValue([])

				await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'meeting-item',
					true,
				)

				expect(mockOctokit.paginate).toHaveBeenCalledWith(
					'GET /search/issues',
					{
						q: 'owner:test-org is:open label:"meeting-item"',
						per_page: 100,
					},
				)
			})

			it('should handle labels with spaces in organization-wide search', async () => {
				mockOctokit.paginate.mockResolvedValue([])

				await fetchAgendaItems(
					mockOctokit,
					'test-org',
					'test-repo',
					'agenda item',
					true,
				)

				expect(mockOctokit.paginate).toHaveBeenCalledWith(
					'GET /search/issues',
					{
						q: 'owner:test-org is:open label:"agenda item"',
						per_page: 100,
					},
				)
			})
		})
	})

	describe('createMeetingIssue', () => {
		const mockCreatedIssue = {
			id: 123,
			html_url: 'https://github.com/test-org/test-repo/issues/123',
			title: 'Meeting Agenda - Jan 15, 2024',
			body: 'Meeting agenda content',
		}

		it('should create issue successfully', async () => {
			mockOctokit.rest.issues.create.mockResolvedValue({
				data: mockCreatedIssue,
			})

			const result = await createMeetingIssue(
				mockOctokit,
				'test-org',
				'test-repo',
				'Meeting Agenda - Jan 15, 2024',
				'Meeting agenda content',
			)

			expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
				owner: 'test-org',
				repo: 'test-repo',
				title: 'Meeting Agenda - Jan 15, 2024',
				body: 'Meeting agenda content',
			})
			expect(result).toEqual(mockCreatedIssue)
		})

		it('should handle empty body content', async () => {
			mockOctokit.rest.issues.create.mockResolvedValue({
				data: mockCreatedIssue,
			})

			await createMeetingIssue(
				mockOctokit,
				'test-org',
				'test-repo',
				'Test Title',
				'',
			)

			expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
				expect.objectContaining({
					body: '',
				}),
			)
		})

		it('should handle long titles and bodies', async () => {
			const longTitle = 'A'.repeat(1000)
			const longBody = 'B'.repeat(10000)
			mockOctokit.rest.issues.create.mockResolvedValue({
				data: mockCreatedIssue,
			})

			await createMeetingIssue(
				mockOctokit,
				'test-org',
				'test-repo',
				longTitle,
				longBody,
			)

			expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
				owner: 'test-org',
				repo: 'test-repo',
				title: longTitle,
				body: longBody,
			})
		})

		it('should throw MeetingError when issue creation fails', async () => {
			const apiError = new Error('Issue creation failed')
			mockOctokit.rest.issues.create.mockRejectedValue(apiError)

			await expect(
				createMeetingIssue(
					mockOctokit,
					'test-org',
					'test-repo',
					'Test Title',
					'Test Body',
				),
			).rejects.toThrow(MeetingError)

			await expect(
				createMeetingIssue(
					mockOctokit,
					'test-org',
					'test-repo',
					'Test Title',
					'Test Body',
				),
			).rejects.toThrow('Failed to create meeting issue')
		})

		it('should wrap original error in MeetingError', async () => {
			const originalError = new Error('Validation failed')
			mockOctokit.rest.issues.create.mockRejectedValue(originalError)

			try {
				await createMeetingIssue(
					mockOctokit,
					'test-org',
					'test-repo',
					'Test Title',
					'Test Body',
				)
			} catch (error) {
				expect(error).toBeInstanceOf(MeetingError)
				expect((error as MeetingError).cause).toBe(originalError)
				expect((error as MeetingError).code).toBe('ISSUE_CREATION_ERROR')
			}
		})

		it('should handle special characters in title and body', async () => {
			const specialTitle = 'Meeting 📅 & Discussion 💬'
			const specialBody = 'Content with émojis 🎉 and ünïcödé'
			mockOctokit.rest.issues.create.mockResolvedValue({
				data: mockCreatedIssue,
			})

			await createMeetingIssue(
				mockOctokit,
				'test-org',
				'test-repo',
				specialTitle,
				specialBody,
			)

			expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
				owner: 'test-org',
				repo: 'test-repo',
				title: specialTitle,
				body: specialBody,
			})
		})
	})
})
