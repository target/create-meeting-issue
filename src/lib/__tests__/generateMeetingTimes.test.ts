import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DateTime } from 'luxon'
import generateMeetingTimes from '../generateMeetingTimes'

const MOCK_TIMEZONES = ['UTC', 'America/Chicago', 'Asia/Kolkata']
const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')

describe('generateMeetingTimes', () => {
	test('should generate meeting times for multiple timezones', () => {
		const result = generateMeetingTimes(MOCK_TIMEZONES, MOCK_DATE)
		expect(result).toContain('2:30\u202fPM UTC') //dont ask why UTC formatting adds a unicode space
		expect(result).toContain('8:30 AM America/Chicago')
		expect(result).toContain('8:00 PM Asia/Kolkata')
	})
})
