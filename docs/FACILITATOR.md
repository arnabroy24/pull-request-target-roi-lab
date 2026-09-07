# BSides live comparison guide

## Learning objective

Participants should leave able to explain both halves of the decision:

1. `pull_request` is the correct event for executing a proposed contribution
   because fork runs receive a restricted token and no repository secrets.
2. Maintainers still need reliable automation that can label and comment on
   pull requests.
3. `pull_request_target` provides that ROI only while contributor content
   remains data and trusted default-branch code is the only code executed.

## Ten-minute live exercise

1. Publish this directory as a dedicated public repository.
2. Keep the repository's default workflow permission restricted. The workflow
   requests only `contents: read`, `pull-requests: read`, and `issues: write`.
3. Explain that any new PR receives both named checks and a side-by-side
   comparison comment. Use an external fork for the live version because it
   also exposes the fork approval boundary.
4. From another account, fork the repository.
5. In the fork, change `demo/source-marker.txt` from
   `BASE_DEFAULT_BRANCH_VERSION` to `FORK_PULL_REQUEST_VERSION`.
6. Change a Markdown file under `docs/`, a file under `src/`, or a test under
   `tests/`, then open a pull request into the lab repository.
7. Start on the PR conversation. Read the comparison comment that workflow 02
   posted for the author, then point out the two checks created from the same
   PR:
   `01 - pull_request: contribution context` and
   `02 - pull_request_target: trusted metadata automation`.
8. Show workflow 02's label and comment. The comment displays
   `BASE_DEFAULT_BRANCH_VERSION`, proving that the privileged workflow stayed
   on trusted code.
9. If workflow 01 is held, explain the fork-approval control, review the diff,
   and approve it live.
10. Open workflow 01's summary. It displays `FORK_PULL_REQUEST_VERSION`, proving
   that this restricted job executed the contribution revision.
11. Contrast the capabilities: workflow 01 can execute the proposed code but
    cannot write PR metadata; workflow 02 can write metadata but must never
    execute the proposed code.

If organization policy prevents the requested `issues: write` permission, use
a personal repository dedicated to the lab or ask the organization owner to
approve this narrowly scoped permission. Do not enable write tokens for normal
fork `pull_request` workflows.

## Explain the ROI

Run the calculator with the project's actual numbers:

```bash
npm run roi -- --prs 300 --minutes 2 --automation 0.8 --hourly-cost 80
```

The default scenario returns eight maintainer hours per month before accounting
for faster contributor feedback, more consistent labels, or reduced backlog.
The exact number matters less than naming the recurring manual work that the
automation removes.

## Show the boundary

Compare the two enabled workflows with `examples/unsafe-head-checkout.yml.txt`,
which shows the dangerous mutation: combining the privileged event with an
explicit fork-head checkout and execution.

Finish with this rule: privileged event plus trusted code plus untrusted data is
a valid design; privileged event plus untrusted code is a pwn request.
