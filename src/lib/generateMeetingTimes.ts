import { DateTime } from 'luxon'

interface MeetingTime {
	timezone: string
	date: DateTime
}

/**
 * Gets meeting times for multiple timezones with error handling
 */
const getMeetingTimes = (
	timezones: string[],
	date: DateTime,
): MeetingTime[] => {
	const dates: MeetingTime[] = []
	for (const timezone of timezones) {
		try {
			const localAdjustedDate = date.setZone(timezone)
			dates.push({ timezone: timezone, date: localAdjustedDate })
		} catch (error) {
			console.warn(`Failed to convert time to timezone ${timezone}:`, error)
			// Still add it with the original date so the template doesn't break
			dates.push({ timezone: `${timezone} (invalid)`, date })
		}
	}
	return dates
}

/**
 * Generates formatted meeting times for multiple timezones
 */
const generateMeetingTimes = (timezones: string[], date: DateTime): string => {
	let timezoneContent = ''
	const meetingTimes = getMeetingTimes(timezones, date)
	for (const { timezone, date: timezoneDate } of meetingTimes) {
		const localAdjustedDate = timezoneDate.setZone(timezone)
		timezoneContent += `- ${localAdjustedDate
			.toLocaleString(DateTime.TIME_SIMPLE)
			.replaceAll(' ', ' ')} ${timezone}\n`
	}
	return timezoneContent
}

export default generateMeetingTimes
