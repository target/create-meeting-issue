import { DateTime } from 'luxon'

/**
 * Format a DateTime object according to the specified date format preference
 * @param date - The DateTime object to format
 * @param format - 'iso' for ISO-8601 format (YYYY-MM-DD) or 'locale' for system locale
 * @returns Formatted date string
 */
export const formatDate = (
	date: DateTime,
	format: 'iso' | 'locale',
): string => {
	if (format === 'iso') {
		return date.toISODate() || date.toLocaleString()
	}
	return date.toLocaleString()
}

/**
 * Format a DateTime object for time display according to the specified time format preference
 * @param date - The DateTime object to format
 * @param format - '24' for 24-hour format or '12' for 12-hour format
 * @returns Formatted time string
 */
export const formatTime = (date: DateTime, format: '12' | '24'): string => {
	if (format === '24') {
		return date.toFormat('HH:mm')
	}
	return date.toLocaleString(DateTime.TIME_SIMPLE)
}

/**
 * Format a DateTime object for full date and time display
 * @param date - The DateTime object to format
 * @param dateFormat - 'iso' for ISO-8601 format (YYYY-MM-DD) or 'locale' for system locale
 * @param timeFormat - '24' for 24-hour format or '12' for 12-hour format
 * @returns Formatted date and time string
 */
export const formatDateTime = (
	date: DateTime,
	dateFormat: 'iso' | 'locale',
	timeFormat: '12' | '24',
): string => {
	const formattedDate = formatDate(date, dateFormat)
	const formattedTime = formatTime(date, timeFormat)
	return `${formattedDate} ${formattedTime}`
}
