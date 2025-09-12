import type { DateTime } from 'luxon'
import { formatTime } from './formatDate'

interface MeetingTime {
	timezone: string
	date: DateTime
}
const getMeetingTimes = (
	timezones: string[],
	date: DateTime,
): MeetingTime[] => {
	const dates: MeetingTime[] = []
	for (const timezone of timezones) {
		const localAdjustedDate = date.setZone(timezone)
		dates.push({ timezone: timezone, date: localAdjustedDate })
	}
	return dates
}

const generateMeetingTimes = (
	timezones: string[],
	date: DateTime,
	timeFormat: '12' | '24',
): string => {
	let timezoneContent = ''
	const meetingTimes = getMeetingTimes(timezones, date)
	for (const { timezone, date } of meetingTimes) {
		const localAdjustedDate = date.setZone(timezone)
		timezoneContent += `- ${formatTime(localAdjustedDate, timeFormat)} ${timezone}\n`
	}
	return timezoneContent
}

export default generateMeetingTimes
