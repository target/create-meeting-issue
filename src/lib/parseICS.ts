import { DateTime } from 'luxon'
import ical from 'node-ical'
import type { RRule } from 'rrule'

const parseICS = async (icsContents: string) => {
	let rrule: RRule | undefined
	let location = ''
	try {
		const icsData = await ical.async.parseICS(icsContents)

		// find the next meeting
		const icsEntries = Object.entries(icsData)
		icsEntries.forEach((entry) => {
			const [_key, value] = entry
			const foundRRule = findPropertyRecursively(value, 'rrule')
			if (foundRRule) {
				rrule = foundRRule
			}
		})

		// find the location
		icsEntries.forEach((entry) => {
			const [_key, value] = entry
			const foundLocation = findPropertyRecursively(value, 'location')
			if (foundLocation) {
				location = foundLocation
			}
		})
	} catch (err: unknown) {
		console.error('Error parsing .ics file: %s', (err as Error).message)
		throw err
	}

	if (rrule === undefined) {
		throw new Error('Could not find rrule within .ics file')
	}

	const nextMeeting = (rrule as RRule).after(new Date(), true)

	if (nextMeeting === null) {
		throw new Error('Could not find next meeting date in .ics file')
	}

	const nextMeetingDateAndTimeUTC = DateTime.fromJSDate(nextMeeting).toUTC()
	return { location, nextMeetingDateAndTimeUTC }
}

//recursively look for needle within obj
const findPropertyRecursively = (obj: any, needle: string) => {
	if (obj?.[needle]) {
		return obj[needle]
	}
	for (const key in obj) {
		if (typeof obj[key] === 'object') {
			return findPropertyRecursively(obj[key], needle)
		}
	}
}

export default parseICS
