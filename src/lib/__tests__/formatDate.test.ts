import { DateTime } from 'luxon'
import { describe, expect, test } from 'vitest'
import { formatDate, formatDateTime, formatTime } from '../formatDate'

const MOCK_DATE = DateTime.fromISO('2025-01-15T14:30:00Z')

describe('formatDate', () => {
	test('should format date in ISO format', () => {
		const result = formatDate(MOCK_DATE, 'iso')
		expect(result).toBe('2025-01-15')
	})

	test('should format date in locale format', () => {
		const result = formatDate(MOCK_DATE, 'locale')
		expect(result).toMatch(/1\/15\/2025|15\/1\/2025|2025-01-15/) // Different locales format differently
	})
})

describe('formatTime', () => {
	test('should format time in 24-hour format', () => {
		const result = formatTime(MOCK_DATE, '24')
		expect(result).toBe('14:30')
	})

	test('should format time in 12-hour format', () => {
		const result = formatTime(MOCK_DATE, '12')
		expect(result).toMatch(/2:30\s*PM/) // Different locales may add unicode spaces
	})
})

describe('formatDateTime', () => {
	test('should format date and time with ISO date and 24-hour time', () => {
		const result = formatDateTime(MOCK_DATE, 'iso', '24')
		expect(result).toBe('2025-01-15 14:30')
	})

	test('should format date and time with locale date and 12-hour time', () => {
		const result = formatDateTime(MOCK_DATE, 'locale', '12')
		expect(result).toMatch(/(1\/15\/2025|15\/1\/2025|2025-01-15).+2:30\s*PM/)
	})
})
