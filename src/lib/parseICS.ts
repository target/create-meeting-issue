import isDST from 'is-dst'
import { DateTime } from 'luxon'
import ical from 'node-ical'
import type { RRule } from 'rrule'

const parseICS = async (icsContents: string) => {
	let rrule: RRule | undefined = undefined
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

	// apply my local timezone to nextMeeting
	const localNextMeeting = DateTime.fromJSDate(nextMeeting)

	// this is done wrong, so we need to manually get the offset hours and add them
	const offsetHours = localNextMeeting.offset / 60

	// apply the offset hours to localNextMeeting
	let adjustedLocalNextMeeting: DateTime
	if (offsetHours < 0) {
		adjustedLocalNextMeeting = localNextMeeting.plus({
			hours: Math.abs(offsetHours),
		})
	} else {
		adjustedLocalNextMeeting = localNextMeeting.minus({
			hours: Math.abs(offsetHours),
		})
	}

	// convert nextMeeting to UTC
	const UTCNextMeeting = adjustedLocalNextMeeting.toUTC()

	// if it is not DST, add an hour. this is due to a bug in Rrule coming from the ics parser in that recurrences do not account for DST traversal
	// see https://github.com/jkbrzt/rrule/issues/610
	// node-ical is using rrule, FWIW https://github.com/jens-maus/node-ical/blob/master/package.json#L23
	const adjustedDate = isDST()
		? UTCNextMeeting
		: UTCNextMeeting.plus({ hours: 1 })
	return { location, nextMeetingDateAndTimeUTC: adjustedDate }
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
