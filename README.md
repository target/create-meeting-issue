# create-meeting-issue

Automatically scaffold out a meeting using `.ics` recurrence, timezone info, and agenda topics from the issue log and prs.

## Why?

Meetings should be conducted the same way, with an opinion on the structure needed to support healthy and productive conversations.

Upon invocation, the action will:

- read and validate action input
- read the recurring `.ics`
  - find the next meeting occurrence date and useful timezone info
  - > ⚠️ The recurrence does not know about any moved instances
  - read the location from the meeting, often a zoom, slack huddle, or teams link
- find all issues and pull requests labeled with the specified agenda label (default: `agenda`) and add them to the upcoming meeting agenda
- open a new issue with the collected date, timezones, location info, and agenda items
- output the issue url, location, and next meeting date for further use by downstream actions

<!--
Example output: TODO POST-OPEN SOURCE: run it on the repo and show a live example
-->

## Setup

1. Download the `.ics` associated with the recurring meeting series.
1. Place the `.ics` file at the root of your repository, or specify a different path using the `MEETING_PATH` input.
   - By default, the action will look for `meeting.ics` at the root of the repo.

## Usage

Add the action to your repo as the following:

```yaml
name: Create Meeting

on:
  workflow_dispatch:

jobs:
  create-meeting:
    runs-on: ubuntu-latest

permissions:
  pull-requests: read
  issues: write

steps:
  - uses: actions/checkout@v4 # use an immutable SHA in production

  - uses: target/create-meeting-issue@v1 # use an immutable SHA in production
    id: create-meeting
    with:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Name            | Required | Default       | Description                                                                                                                                                                                                      |
| --------------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`  | ✅       |               | A token with `pull-request` read access and `issues` write to the repository, used to create an issue.                                                                                                           |
| `MEETING_PATH`  | ✅       | `meeting.ics` | The path to the recurring `meeting.ics` file.                                                                                                                                                                    |
| `TIMEZONES`     | ✅       | `Etc/UTC`     | The comma-separated timezones to display for the next meeting. For example, `America/Chicago,Asia/Kolkata`. Use `TZ Identifiers` from [this list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). |
| `SLACK_CHANNEL` |          |               | The slack channel to mention within the issue body.<br />This input is **not used** in any workflow dispatch logic mentioned later, that is a separate process governed by a webhook originating in Slack.       |
| `DRY_RUN`       |          | `false`       | If true, only outputs the issue body instead of creating the issue.                                                                                                                                              |
| `AGENDA_LABEL`  |          | `agenda`      | The label used to identify agenda items to include in the meeting.                                                                                                                                              |
| `ORG_WIDE`      |          | `false`       | If true, searches for agenda items across the entire organization instead of just the repository.                                                                                                               |

### Outputs

| Name                | Example                                        | Description                                 |
| ------------------- | ---------------------------------------------- | ------------------------------------------- |
| `ISSUE_URL`         | `https://github.com/octocat/example/issues/16` | The url of the issue that was created.      |
| `NEXT_MEETING_DATE` | `1/15/2025`                                    | The next meeting date from the `.ics` file. |
| `LOCATION`          | `https://example.zoom.us/j/foo`                | The meeting location from the `.ics` file.  |

### Invoke manually prior to the meeting

[`Run workflow` directly](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow) within the Actions > Create Meeting Workflow screen.

### Messaging Integration

Optionally, you can compose this action together with a messaging solution, such as [slack-github-action](https://github.com/slackapi/slack-github-action) to inform folks about the upcoming meeting and agenda.

```yaml
name: Create Meeting

on:
  workflow_dispatch:

jobs:
  create-meeting:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
      issues: write

    outputs:
      ISSUE_URL: ${{ steps.create-meeting.outputs.ISSUE_URL }}
      LOCATION: ${{ steps.create-meeting.outputs.LOCATION }}
      NEXT_MEETING_DATE: ${{ steps.create-meeting.outputs.NEXT_MEETING_DATE }}

    steps:
      - uses: actions/checkout@v4 # use an immutable SHA in production

      - uses: target/create-meeting-issue@v1 # use an immutable SHA in production
        id: create-meeting
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # this is unaffiliated boilerplate and should be tailored to your needs
  # using https://github.com/slackapi/slack-github-action/tree/main?tab=readme-ov-file#technique-1-slack-workflow-builder is a pretty lightweight way to do this
  notify-slack:
    runs-on: ubuntu-latest
    needs: create-meeting
    permissions: {} # no extra permissions needed

    steps:
      - uses: slackapi/slack-github-action@v2.0.0 # use an immutable SHA in production
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: webhook-trigger
          payload: |
            issue_url: ${{ needs.create-meeting.outputs.ISSUE_URL }}
            location: ${{ needs.create-meeting.outputs.LOCATION }}
            next_meeting_date: ${{ needs.create-meeting.outputs.NEXT_MEETING_DATE }}
```

> [!WARNING] 
> GitHub may omit output like `location` if it thinks it contains a secret, such as a pre-authorized webinar link. If you encounter this, you can combine the steps into a single job, but it does provide more permissions to subsequent steps in the job. Consult security resources as prudent. See [this GitHub discussion for status and potential workarounds](https://github.com/orgs/community/discussions/37942).

## Local Development

Ensure you have the following tools:

- [git](https://git-scm.com)
- [`nvm` recommended on a Mac](https://github.com/nvm-sh/nvm#install--update-script) or [`fnm` for Windows](https://github.com/Schniz/fnm)

```
nvm use
corepack enable
corepack install
pnpm install
pnpm dev
```

### Packaging Process

Run `pnpm package` prior to pushing new versions.

This action uses [ncc](https://github.com/vercel/ncc) to emit JavaScript - at least until:

- [GH Actions support Node 22](https://github.com/actions/runner/discussions/2704)
- Node.js supports `--experimental-strip-types` [within node_modules](https://github.com/nodejs/node/blob/7bc37af0f7150b9c1f90508b491ceff937734188/lib/internal/modules/typescript.js#L185-L187)

> If node22 is unblocked first, the action.yml line can be uncommented and TypeScript compilation can be evaluated for removal.

<!-- TODO POST-OPEN SOURCE - INTRODUCE TOOLING AGAIN, OR USE https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes
### Release Process
-->
