import { DateTime } from 'luxon'
import { describe, expect, it, vi } from 'vitest'
import generateMeetingTimes from '../generateMeetingTimes'

describe('generateMeetingTimes', () => {
	const testDate = DateTime.fromISO('2024-01-15T14:00:00Z', { zone: 'utc' })

	describe('valid timezone formatting', () => {
		it('should format meeting times for multiple valid timezones', () => {
			const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('America/New_York')
			expect(result).toContain('Europe/London')
			expect(result).toContain('Asia/Tokyo')
			expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/g) // Time format
		})

		it('should handle UTC timezone', () => {
			const timezones = ['UTC']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('UTC')
			expect(result).toContain('2:00 PM')
		})

		it('should handle Etc/UTC timezone', () => {
			const timezones = ['Etc/UTC']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('Etc/UTC')
			expect(result).toContain('2:00 PM')
		})

		it('should format times correctly for different timezones', () => {
			const timezones = ['America/New_York', 'Europe/London']

			const result = generateMeetingTimes(timezones, testDate)

			// EST should be 5 hours behind UTC (9:00 AM)
			expect(result).toContain('9:00 AM America/New_York')
			// GMT should be same as UTC (2:00 PM)
			expect(result).toContain('2:00 PM Europe/London')
		})

		it('should return empty string for empty timezone array', () => {
			const result = generateMeetingTimes([], testDate)
			expect(result).toBe('')
		})

		it('should handle single timezone', () => {
			const timezones = ['America/Los_Angeles']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('America/Los_Angeles')
			expect(result.split('\n').filter((line) => line.trim()).length).toBe(1)
		})
	})

	describe('invalid timezone handling', () => {
		it('should handle invalid timezones gracefully', () => {
			const timezones = ['Invalid/Timezone', 'America/New_York']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('Invalid DateTime Invalid/Timezone')
			expect(result).toContain('America/New_York')
		})

		it('should handle all invalid timezones', () => {
			const timezones = ['Invalid/One', 'Invalid/Two']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('Invalid DateTime Invalid/One')
			expect(result).toContain('Invalid DateTime Invalid/Two')
		})
	})

	describe('edge cases', () => {
		it('should handle DateTime with different zones', () => {
			const nycDate = DateTime.fromISO('2024-01-15T09:00:00', {
				zone: 'America/New_York',
			})
			const timezones = ['UTC', 'Europe/London']

			const result = generateMeetingTimes(timezones, nycDate)

			expect(result).toContain('UTC')
			expect(result).toContain('Europe/London')
		})

		it('should handle DST transitions', () => {
			// Use a date during DST for EST (Eastern Daylight Time)
			const dstDate = DateTime.fromISO('2024-07-15T14:00:00Z', { zone: 'utc' })
			const timezones = ['America/New_York']

			const result = generateMeetingTimes(timezones, dstDate)

			// EDT should be 4 hours behind UTC (10:00 AM)
			expect(result).toContain('10:00 AM America/New_York')
		})

		it('should handle unusual timezones', () => {
			const timezones = ['Pacific/Kiritimati', 'Pacific/Midway']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('Pacific/Kiritimati')
			expect(result).toContain('Pacific/Midway')
		})

		it('should preserve line breaks between timezones', () => {
			const timezones = ['UTC', 'America/New_York', 'Europe/London']

			const result = generateMeetingTimes(timezones, testDate)

			const lines = result.split('\n').filter((line) => line.trim())
			expect(lines).toHaveLength(3)
			lines.forEach((line) => {
				expect(line).toMatch(/^- \d{1,2}:\d{2} [AP]M /)
			})
		})

		it('should handle very long timezone names', () => {
			const timezones = ['America/Argentina/ComodRivadavia']

			const result = generateMeetingTimes(timezones, testDate)

			expect(result).toContain('America/Argentina/ComodRivadavia')
		})
	})

	describe('time formatting', () => {
		it('should use 12-hour time format', () => {
			const timezones = ['UTC']
			const morningDate = DateTime.fromISO('2024-01-15T08:00:00Z', {
				zone: 'utc',
			})
			const eveningDate = DateTime.fromISO('2024-01-15T20:00:00Z', {
				zone: 'utc',
			})

			const morningResult = generateMeetingTimes(timezones, morningDate)
			const eveningResult = generateMeetingTimes(timezones, eveningDate)

			expect(morningResult).toContain('8:00 AM')
			expect(eveningResult).toContain('8:00 PM')
		})

		it('should handle midnight and noon correctly', () => {
			const timezones = ['UTC']
			const midnightDate = DateTime.fromISO('2024-01-15T00:00:00Z', {
				zone: 'utc',
			})
			const noonDate = DateTime.fromISO('2024-01-15T12:00:00Z', { zone: 'utc' })

			const midnightResult = generateMeetingTimes(timezones, midnightDate)
			const noonResult = generateMeetingTimes(timezones, noonDate)

			expect(midnightResult).toContain('12:00 AM')
			expect(noonResult).toContain('12:00 PM')
		})
	})
})
