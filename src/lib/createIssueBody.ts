import { join } from 'node:path'

import Handlebars from 'handlebars'
import { DateTime } from 'luxon'
import { MeetingError, type TemplateData } from '../types'
import { fileExists, readFile } from './fileUtils'

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date: DateTime, timezone: string) => {
	try {
		return date.setZone(timezone).toLocaleString(DateTime.DATETIME_MED)
	} catch (error) {
		console.warn(`Failed to format date for timezone ${timezone}:`, error)
		return date.toLocaleString(DateTime.DATETIME_FULL)
	}
})

Handlebars.registerHelper('formatDateISO', (date: DateTime) =>
	date.toISO({ includeOffset: false }),
)

/**
 * Creates issue body content using Handlebars template
 */
const createIssueBody = async (
	templateData: TemplateData,
	customTemplatePath?: string,
): Promise<string> => {
	try {
		const templatePath = customTemplatePath
			? join(process.cwd(), customTemplatePath)
			: new URL('../templates/meetings.md', import.meta.url)

		// Check if template file exists
		if (!(await fileExists(templatePath))) {
			throw new MeetingError(
				`Template file not found: ${templatePath}`,
				'TEMPLATE_NOT_FOUND',
			)
		}

		const templateContent = await readFile(templatePath)

		if (!templateContent.trim()) {
			throw new MeetingError('Template file is empty', 'EMPTY_TEMPLATE')
		}

		const template = Handlebars.compile(templateContent)
		return template(templateData)
	} catch (error) {
		if (error instanceof MeetingError) {
			throw error
		}
		throw new MeetingError(
			'Failed to create issue body from template',
			'TEMPLATE_PROCESSING_ERROR',
			error as Error,
		)
	}
}

export default createIssueBody
