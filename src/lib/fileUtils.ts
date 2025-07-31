import { promises as fs } from 'node:fs'
import { MeetingError } from '../types'

/**
 * Safely reads a file with proper error handling
 */
export const readFile = async (filePath: string | URL): Promise<string> => {
	try {
		return await fs.readFile(filePath, 'utf8')
	} catch (error) {
		throw new MeetingError(
			`Failed to read file: ${filePath}`,
			'FILE_READ_ERROR',
			error as Error,
		)
	}
}

/**
 * Checks if a file exists
 */
export const fileExists = async (filePath: string | URL): Promise<boolean> => {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}
