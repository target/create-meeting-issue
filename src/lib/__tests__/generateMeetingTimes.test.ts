import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DateTime } from 'luxon'
import generateMeetingTimes from '../generateMeetingTimes'

const MOCK_TIMEZONES = ['UTC', 'America/Chicago', 'Asia/Kolkata']
const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')

describe('generateMeetingTimes', () => {
	test('should generate meeting times for multiple timezones with 12-hour format', () => {
		const result = generateMeetingTimes(MOCK_TIMEZONES, MOCK_DATE, '12')
		expect(result).toContain('2:30\u202fPM UTC') //dont ask why UTC formatting adds a unicode space
		expect(result).toContain('8:30 AM America/Chicago')
		expect(result).toContain('8:00 PM Asia/Kolkata')
	})

	test('should generate meeting times for multiple timezones with 24-hour format', () => {
		const result = generateMeetingTimes(MOCK_TIMEZONES, MOCK_DATE, '24')
		expect(result).toContain('14:30 UTC')
		expect(result).toContain('08:30 America/Chicago')
		expect(result).toContain('20:00 Asia/Kolkata')
	})
})
