import { getOctokit } from '@actions/github'

import extractInput from './extractInput'

const input = extractInput()
const octokit = getOctokit(input.token)

export default octokit
