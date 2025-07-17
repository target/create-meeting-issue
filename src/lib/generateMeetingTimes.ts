import { DateTime } from 'luxon'

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

const generateMeetingTimes = (timezones: string[], date: DateTime): string => {
	let timezoneContent = ''
	const meetingTimes = getMeetingTimes(timezones, date)
	for (const { timezone, date } of meetingTimes) {
		const localAdjustedDate = date.setZone(timezone)
		timezoneContent += `- ${localAdjustedDate.toLocaleString(
			DateTime.TIME_SIMPLE,
		)} ${timezone}\n`
	}
	return timezoneContent
}

export default generateMeetingTimes
