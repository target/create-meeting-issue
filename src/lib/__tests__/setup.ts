import { vi } from 'vitest'

// Mock @actions/core
vi.mock('@actions/core', () => ({
	getInput: vi.fn(),
	setOutput: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warning: vi.fn(),
	error: vi.fn(),
}))

// Mock @actions/github
vi.mock('@actions/github', () => ({
	context: {
		repo: {
			owner: 'test-org',
			repo: 'test-repo',
		},
	},
	getOctokit: vi.fn(),
}))

// Mock process.cwd()
vi.mock('node:process', () => ({
	cwd: vi.fn(() => '/test/cwd'),
	exit: vi.fn(),
}))
