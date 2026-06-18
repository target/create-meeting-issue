import { getOctokit } from '@actions/github'

import extractInput from './extractInput.ts'

const input = extractInput()
const octokit = getOctokit(input.token)

export default octokit
