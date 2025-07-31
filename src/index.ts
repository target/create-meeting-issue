import { main } from './lib/meetingService.js'

// Execute the main function
main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
