import { DateTime } from 'luxon'
import ical from 'node-ical'
import type { RRule } from 'rrule'
import { MeetingError, type ParsedMeetingData } from '../types/index.js'

/**
 * Recursively searches for a property in an object
 */
const findPropertyRecursively = (obj: any, needle: string): any => {
	if (obj?.[needle]) {
		return obj[needle]
	}
	for (const key in obj) {
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			const result = findPropertyRecursively(obj[key], needle)
			if (result) {
				return result
			}
		}
	}
	return null
}

/**
 * Extracts recurrence rule and location from ICS data
 */
const extractICSData = (icsData: any): { rrule: RRule; location: string } => {
	let rrule: RRule | null = null
	let location = ''

	const icsEntries = Object.entries(icsData)

	for (const [_key, value] of icsEntries) {
		if (!rrule) {
			rrule = findPropertyRecursively(value, 'rrule')
		}
		if (!location) {
			location = findPropertyRecursively(value, 'location') || ''
		}

		// Early exit if we have both
		if (rrule && location) {
			break
		}
	}

	if (!rrule) {
		throw new MeetingError(
			'Could not find recurrence rule (rrule) in .ics file',
			'MISSING_RRULE',
		)
	}

	return { rrule, location }
}

/**
 * Calculates the next meeting date
 */
const calculateNextMeetingDate = (rrule: RRule): DateTime => {
	const now = new Date()
	const nextMeeting = rrule.after(now, true)

	if (!nextMeeting) {
		throw new MeetingError(
			'Could not find next meeting date in .ics file. The recurrence rule may have ended.',
			'NO_NEXT_MEETING',
		)
	}

	return DateTime.fromJSDate(nextMeeting)
}

/**
 * Parses ICS content and extracts meeting information
 */
const parseICS = async (icsContents: string): Promise<ParsedMeetingData> => {
	if (!icsContents.trim()) {
		throw new MeetingError('ICS content is empty', 'EMPTY_ICS_CONTENT')
	}

	try {
		const icsData = await ical.async.parseICS(icsContents)

		if (!icsData || Object.keys(icsData).length === 0) {
			throw new MeetingError('Invalid or empty ICS data', 'INVALID_ICS_DATA')
		}

		const { rrule, location } = extractICSData(icsData)
		const nextMeetingDateAndTimeUTC = calculateNextMeetingDate(rrule)

		return {
			location,
			nextMeetingDateAndTimeUTC,
		}
	} catch (error) {
		if (error instanceof MeetingError) {
			throw error
		}
		throw new MeetingError(
			'Failed to parse .ics file',
			'ICS_PARSE_ERROR',
			error as Error,
		)
	}
}

export default parseICS
