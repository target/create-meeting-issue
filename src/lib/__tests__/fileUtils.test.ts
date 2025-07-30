import { promises as fs } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MeetingError } from '../../types'
import { fileExists, readFile } from '../fileUtils'

vi.mock('node:fs', () => ({
	promises: {
		readFile: vi.fn(),
		access: vi.fn(),
	},
}))

const mockFs = vi.mocked(fs)

describe('fileUtils', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe('readFile', () => {
		it('should read file successfully with string path', async () => {
			const expectedContent = 'Test file content'
			mockFs.readFile.mockResolvedValue(expectedContent)

			const result = await readFile('/path/to/file.txt')

			expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8')
			expect(result).toBe(expectedContent)
		})

		it('should read file successfully with URL path', async () => {
			const expectedContent = 'URL file content'
			const url = new URL('file:///path/to/file.txt')
			mockFs.readFile.mockResolvedValue(expectedContent)

			const result = await readFile(url)

			expect(mockFs.readFile).toHaveBeenCalledWith(url, 'utf8')
			expect(result).toBe(expectedContent)
		})

		it('should handle empty file content', async () => {
			mockFs.readFile.mockResolvedValue('')

			const result = await readFile('/path/to/empty.txt')

			expect(result).toBe('')
		})

		it('should handle large file content', async () => {
			const largeContent = 'A'.repeat(10000)
			mockFs.readFile.mockResolvedValue(largeContent)

			const result = await readFile('/path/to/large.txt')

			expect(result).toBe(largeContent)
		})

		it('should handle files with special characters', async () => {
			const specialContent = 'Content with émojis 🎉 and ünïcödé'
			mockFs.readFile.mockResolvedValue(specialContent)

			const result = await readFile('/path/to/special.txt')

			expect(result).toBe(specialContent)
		})

		it('should throw MeetingError when file read fails', async () => {
			const originalError = new Error('ENOENT: no such file or directory')
			mockFs.readFile.mockRejectedValue(originalError)

			await expect(readFile('/path/to/nonexistent.txt')).rejects.toThrow(
				MeetingError,
			)
			await expect(readFile('/path/to/nonexistent.txt')).rejects.toThrow(
				'Failed to read file: /path/to/nonexistent.txt',
			)
		})

		it('should wrap original error in MeetingError', async () => {
			const originalError = new Error('Permission denied')
			mockFs.readFile.mockRejectedValue(originalError)

			try {
				await readFile('/path/to/restricted.txt')
			} catch (error) {
				expect(error).toBeInstanceOf(MeetingError)
				expect((error as MeetingError).cause).toBe(originalError)
				expect((error as MeetingError).code).toBe('FILE_READ_ERROR')
			}
		})

		it('should handle different file extensions', async () => {
			const testFiles = [
				{ path: '/path/to/file.md', content: '# Markdown content' },
				{ path: '/path/to/file.json', content: '{"key": "value"}' },
				{
					path: '/path/to/file.ics',
					content: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
				},
				{ path: '/path/to/file.txt', content: 'Plain text content' },
			]

			for (const { path, content } of testFiles) {
				mockFs.readFile.mockResolvedValue(content)
				const result = await readFile(path)
				expect(result).toBe(content)
			}
		})

		it('should handle paths with spaces and special characters', async () => {
			const specialPaths = [
				'/path with spaces/file.txt',
				'/path/file with spaces.txt',
				'/path/файл.txt', // Cyrillic
				'/path/文件.txt', // Chinese
			]

			for (const path of specialPaths) {
				mockFs.readFile.mockResolvedValue('content')
				await readFile(path)
				expect(mockFs.readFile).toHaveBeenCalledWith(path, 'utf8')
			}
		})
	})

	describe('fileExists', () => {
		it('should return true when file exists', async () => {
			mockFs.access.mockResolvedValue(undefined)

			const result = await fileExists('/path/to/existing.txt')

			expect(mockFs.access).toHaveBeenCalledWith('/path/to/existing.txt')
			expect(result).toBe(true)
		})

		it('should return false when file does not exist', async () => {
			mockFs.access.mockRejectedValue(new Error('ENOENT'))

			const result = await fileExists('/path/to/nonexistent.txt')

			expect(mockFs.access).toHaveBeenCalledWith('/path/to/nonexistent.txt')
			expect(result).toBe(false)
		})

		it('should work with URL paths', async () => {
			const url = new URL('file:///path/to/file.txt')
			mockFs.access.mockResolvedValue(undefined)

			const result = await fileExists(url)

			expect(mockFs.access).toHaveBeenCalledWith(url)
			expect(result).toBe(true)
		})

		it('should return false for permission errors', async () => {
			mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'))

			const result = await fileExists('/path/to/restricted.txt')

			expect(result).toBe(false)
		})

		it('should return false for any access error', async () => {
			mockFs.access.mockRejectedValue(new Error('Unknown error'))

			const result = await fileExists('/path/to/problematic.txt')

			expect(result).toBe(false)
		})

		it('should handle multiple consecutive calls', async () => {
			const testCases = [
				{ path: '/file1.txt', exists: true },
				{ path: '/file2.txt', exists: false },
				{ path: '/file3.txt', exists: true },
			]

			for (const { path, exists } of testCases) {
				if (exists) {
					mockFs.access.mockResolvedValue(undefined)
				} else {
					mockFs.access.mockRejectedValue(new Error('ENOENT'))
				}

				const result = await fileExists(path)
				expect(result).toBe(exists)
			}
		})

		it('should handle special file paths', async () => {
			const specialPaths = [
				'/path with spaces/file.txt',
				'/path/file with spaces.txt',
				'/very/long/path/that/goes/deep/into/nested/directories/file.txt',
				'relative/path/file.txt',
				'./relative/file.txt',
				'../parent/file.txt',
			]

			for (const path of specialPaths) {
				mockFs.access.mockResolvedValue(undefined)
				const result = await fileExists(path)
				expect(result).toBe(true)
				expect(mockFs.access).toHaveBeenCalledWith(path)
			}
		})

		it('should handle empty string path', async () => {
			mockFs.access.mockRejectedValue(new Error('Invalid path'))

			const result = await fileExists('')

			expect(result).toBe(false)
		})
	})

	describe('integration scenarios', () => {
		it('should handle fileExists and readFile workflow', async () => {
			const filePath = '/path/to/workflow.txt'
			const fileContent = 'Workflow content'

			// File exists
			mockFs.access.mockResolvedValue(undefined)
			const exists = await fileExists(filePath)
			expect(exists).toBe(true)

			// Read the file
			mockFs.readFile.mockResolvedValue(fileContent)
			const content = await readFile(filePath)
			expect(content).toBe(fileContent)
		})

		it('should handle workflow where file does not exist', async () => {
			const filePath = '/path/to/missing.txt'

			// File does not exist
			mockFs.access.mockRejectedValue(new Error('ENOENT'))
			const exists = await fileExists(filePath)
			expect(exists).toBe(false)

			// Attempting to read should fail
			mockFs.readFile.mockRejectedValue(new Error('ENOENT'))
			await expect(readFile(filePath)).rejects.toThrow(MeetingError)
		})

		it('should handle concurrent file operations', async () => {
			const files = ['/file1.txt', '/file2.txt', '/file3.txt']
			const contents = ['content1', 'content2', 'content3']

			// Setup mocks for existence checks
			mockFs.access.mockResolvedValue(undefined)

			// Setup mocks for reading
			files.forEach((file, index) => {
				mockFs.readFile.mockImplementation((path) => {
					const fileIndex = files.indexOf(path as string)
					if (fileIndex >= 0) {
						return Promise.resolve(contents[fileIndex])
					}
					return Promise.reject(new Error('File not found'))
				})
			})

			// Check all files exist concurrently
			const existsResults = await Promise.all(files.map(fileExists))
			expect(existsResults).toEqual([true, true, true])

			// Read all files concurrently
			const readResults = await Promise.all(files.map(readFile))
			expect(readResults).toEqual(contents)
		})
	})
})
