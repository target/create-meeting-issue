import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { DateTime } from 'luxon'
import generateMeetingTimes from '../generateMeetingTimes.ts'

const MOCK_TIMEZONES = ['UTC', 'America/Chicago', 'Asia/Kolkata']
const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')

describe('generateMeetingTimes', () => {
	test('should generate meeting times for multiple timezones', () => {
		const result = generateMeetingTimes(MOCK_TIMEZONES, MOCK_DATE)
		assert.ok(result.includes('2:30\u202fPM UTC')) //dont ask why UTC formatting adds a unicode space
		assert.ok(result.includes('8:30 AM America/Chicago'))
		assert.ok(result.includes('8:00 PM Asia/Kolkata'))
	})
})
