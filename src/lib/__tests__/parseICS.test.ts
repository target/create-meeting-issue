import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import parseICS from '../parseICS'

const MOCK_RECURRENCE = `
BEGIN:VCALENDAR
METHOD:PUBLISH
VERSION:2.0
BEGIN:VTIMEZONE
TZID:tzone://Microsoft/Utc
BEGIN:STANDARD
DTSTART:16010101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:16010101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
RRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=3WE
EXDATE;TZID="tzone://Microsoft/Utc":20241016T000000
SUMMARY:Recurring Meeting Title
DTSTART:20240417T133000Z
DTEND:20240417T140000Z
CLASS:PUBLIC
PRIORITY:5
DTSTAMP:20241218T151431Z
TRANSP:OPAQUE
STATUS:CONFIRMED
LOCATION:https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5
 HFPUT09&from=addon
X-MICROSOFT-CDO-BUSYSTATUS:BUSY
X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY
X-MICROSOFT-CDO-ALLDAYEVENT:FALSE
X-MICROSOFT-CDO-IMPORTANCE:1
X-MICROSOFT-CDO-INSTTYPE:1
X-MICROSOFT-ONLINEMEETINGEXTERNALLINK:
X-MICROSOFT-ONLINEMEETINGCONFLINK:
X-MICROSOFT-DONOTFORWARDMEETING:FALSE
X-MICROSOFT-DISALLOW-COUNTER:TRUE
X-MICROSOFT-LOCATIONDISPLAYNAME:https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5&from=addon
BEGIN:VALARM
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:-PT15M
ACTION:DISPLAY
END:VALARM
END:VEVENT
BEGIN:VEVENT
RECURRENCE-ID:20240619T133000Z
SUMMARY:Recurring Meeting Title
DTSTART:20240620T133000Z
DTEND:20240620T140000Z
CLASS:PUBLIC
PRIORITY:5
DTSTAMP:20241017T051729Z
TRANSP:OPAQUE
STATUS:CONFIRMED
LOCATION:https://example.zoom.us/j/123456789?pwd=a1b2c3d4e5
 HFPUT09&from=addon
X-MICROSOFT-CDO-BUSYSTATUS:BUSY
X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY
X-MICROSOFT-CDO-ALLDAYEVENT:FALSE
X-MICROSOFT-CDO-IMPORTANCE:1
X-MICROSOFT-CDO-INSTTYPE:3
X-MICROSOFT-ONLINEMEETINGEXTERNALLINK:
X-MICROSOFT-ONLINEMEETINGCONFLINK:
X-MICROSOFT-DONOTFORWARDMEETING:FALSE
X-MICROSOFT-DISALLOW-COUNTER:TRUE
X-MICROSOFT-LOCATIONDISPLAYNAME:https://example.zoom.us/j/123456789?pwd=Ya1b2c3d4e5&from=addon
BEGIN:VALARM
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:-PT15M
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR
`

const MOCK_DATE = new Date(2024, 11, 16) // December 16, 2024

describe('parseICS', () => {
	beforeEach(() => {
		vi.setSystemTime(MOCK_DATE)
	})
	afterEach(() => {
		vi.useRealTimers()
	})

	test('should throw an error if rrule is not found', async () => {
		expect(async () => await parseICS('')).rejects.toThrow(
			'Could not find rrule within .ics file',
		)
	})

	test('should find rrule if defined', async () => {
		const { nextMeetingDateAndTimeUTC } = await parseICS(MOCK_RECURRENCE)
		await expect(nextMeetingDateAndTimeUTC).toBeDefined()
	})

	test('should find the next calculated recurrence', async () => {
		const { nextMeetingDateAndTimeUTC } = await parseICS(MOCK_RECURRENCE)
		expect(nextMeetingDateAndTimeUTC.toLocaleString()).toEqual('12/18/2024')
	})

	test('during daylight savings time, should not add an hour to the next calculated recurrence', async () => {
		vi.setSystemTime(new Date(2024, 5, 1)) // June 1, 2024
		const { nextMeetingDateAndTimeUTC } = await parseICS(MOCK_RECURRENCE)
		expect(nextMeetingDateAndTimeUTC.toISOTime()).toEqual('13:30:00.000Z')
	})

	test('when it is not daylight savings time, should add an hour to the next calculated recurrence', async () => {
		vi.setSystemTime(new Date(2024, 11, 16)) // December 16, 2024
		const { nextMeetingDateAndTimeUTC } = await parseICS(MOCK_RECURRENCE)
		expect(nextMeetingDateAndTimeUTC.toISOTime()).toEqual('14:30:00.000Z')
	})

	test('should find location if defined', async () => {
		const { location } = await parseICS(MOCK_RECURRENCE)
		expect(location).toBeDefined()
	})
})
