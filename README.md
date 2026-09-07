# `pull_request` vs. `pull_request_target` live ROI lab

This conference lab triggers both GitHub Actions events from every pull
request, whether it comes from a repository branch or an external fork. Every
PR author gets two clearly named checks plus a comment that compares the trust
models side by side:

- `pull_request` safely builds or tests the proposed revision with a read-only
  token and no secrets.
- `pull_request_target` runs trusted default-branch automation that can label
  and comment on the pull request.

Opening an ordinary PR is enough to see the comparison. For the sharpest live
demo, the participant also changes a visible source marker. The `pull_request`
summary then shows the proposed value, while the `pull_request_target` comment
shows `BASE_DEFAULT_BRANCH_VERSION` and performs the metadata write.

## The maintainer problem

A normal fork-based `pull_request` workflow is intentionally untrusted. GitHub
normally gives it a read-only `GITHUB_TOKEN`, withholds secrets, and may require
approval before consuming runner capacity. Those controls are appropriate for
building and testing contributor code, but the read-only token cannot reliably
label or comment on the base repository's pull request.

`pull_request_target` changes the trust model: the workflow and a default
checkout come from the base repository's default branch. Trusted automation can
therefore receive narrowly scoped write access and act on the pull request as
metadata.

| Difference | `pull_request` from a fork | `pull_request_target` |
| --- | --- | --- |
| Security context | Untrusted contribution context | Privileged base-repository context |
| Workflow and default checkout | Pull request merge revision (`refs/pull/<number>/merge`) | Base repository's default branch |
| `GITHUB_SHA` | Pull request merge commit | Latest commit on the base default branch |
| Fork `GITHUB_TOKEN` | Normally downgraded to read-only even if write access is requested | Uses the permissions explicitly granted by the trusted base workflow |
| Repository secrets | Withheld from fork runs | Available if the workflow references them; this lab uses none |
| Maintainer approval | May wait for approval before contributor code runs | Normally runs as trusted base automation without the standard fork-code approval |
| Correct purpose | Build, lint, or test the proposed contribution | Label, comment, assign, or perform other metadata/API automation |
| Execute contributor code? | Yes, with a read-only token and no secrets | **No**—treat PR content only as untrusted data |
| Write labels or comments? | Normally unavailable because fork-token writes are downgraded | Yes, with narrow permissions such as `issues: write` |
| Primary safety benefit | Proposed code receives only the authority needed for CI | Trusted automation can reduce maintainer toil on every PR |
| Main failure mode | Granting fork code more authority than it needs | Checking out or executing the PR head creates a privileged "pwn request" |

That is the ROI: less repetitive maintainer work, immediate contributor
feedback, and consistent policy application without operating a separate bot
service. It is not a safe way to run fork code with secrets.

## What every PR author sees

Opening any pull request starts two workflows. The `pull_request_target`
workflow also posts the comparison table directly on the PR, so the lesson does
not depend on the author knowing where to find an Actions log.

### 01 — `pull_request`: contribution context

`.github/workflows/pull-request-context.yml`:

1. may wait for maintainer approval when the PR comes from a public fork;
2. checks out the pull request merge revision;
3. executes `scripts/report-pull-request-context.mjs` from that revision;
4. prints the fork-controlled source marker into the job log and summary;
5. has only `contents: read` and receives no lab secrets.

This is where builds and tests belong.

### 02 — `pull_request_target`: trusted metadata automation

`.github/workflows/pull-request-metadata.yml`:

1. runs and checks out trusted code from the base default branch;
2. prints the base source marker into its log and PR comment;
3. requests filenames from the Pull Requests API;
4. evaluates `.github/triage-policy.json` as trusted policy;
5. creates/applies labels and posts a side-by-side explanation using
   `issues: write`.

All PR-derived values remain JavaScript strings or JSON request values. None is
inserted into generated shell source.

## Run locally

Requirements: Node.js 20 or newer. There are no dependencies to install.

```bash
npm run preview
npm run roi
npm test
```

Use project-specific ROI inputs:

```bash
npm run roi -- --prs 500 --minutes 3 --automation 0.75 --hourly-cost 90
```

The calculator reports time returned to maintainers and an illustrative labor
value. It intentionally excludes harder-to-price benefits such as faster first
response and contributor retention.

## Publish and demonstrate

1. Create a dedicated public GitHub repository from this directory.
2. Keep Actions enabled and default workflow permissions restricted.
3. Do not add repository or environment secrets.
4. Open a PR from a repository branch to confirm that every PR gets both checks
   and the comparison comment.
5. For the conference trust-boundary demo, use a separate account to fork the
   lab. In the fork, replace the content of `demo/source-marker.txt` with:

   ```text
   FORK_PULL_REQUEST_VERSION
   ```

6. Also change a file under `docs/`, `src/`, `tests/`, or `.github/` so the
   metadata workflow has an area to classify.
7. Commit and open a pull request to the base repository.
8. Observe that workflow 02 labels/comments while showing the base marker.
9. If workflow 01 is awaiting approval, review the fork changes and select
   **Approve workflows to run**.
10. Open workflow 01's job summary and compare its fork marker with workflow
    02's base marker.

The explicit `issues: write` permission can be blocked by stricter organization
policy. If so, use a dedicated personal repository or obtain approval for that
single permission; do not send write tokens to ordinary fork workflows.

See [docs/FACILITATOR.md](docs/FACILITATOR.md) for the presentation script.

## Safety boundary

The `pull_request` workflow intentionally executes the proposed revision, but
the workflow explicitly grants only `contents: read`, passes no secrets, does
not persist its checkout credential, and has no metadata-write permission.

The `pull_request_target` workflow contains no PR-head `repository:` or `ref:`,
no `allow-unsafe-pr-checkout`, no dynamic `uses:`, and no execution of
contributor content. The unsafe comparison is stored with a `.txt` suffix under
`examples/` so GitHub cannot load it as a workflow.

If the task changes from "inspect metadata" to "build or test the proposed
change," use `pull_request` with a read-only token and no secrets. Never point
this privileged workflow at `pull_request.head.sha`.

## Repository map

- `.github/workflows/pull-request-context.yml` — enabled read-only contribution workflow.
- `.github/workflows/pull-request-metadata.yml` — enabled trusted metadata workflow.
- `.github/scripts/triage.mjs` — trusted API client executed from the default branch.
- `.github/triage-policy.json` — trusted labeling policy.
- `demo/source-marker.txt` — visible proof of which revision was checked out.
- `scripts/report-pull-request-context.mjs` — safe contribution-context reporter.
- `examples/unsafe-head-checkout.yml.txt` — the pwn-request boundary, disabled.
- `scripts/calculate-roi.mjs` — project-specific time/value calculator.
- `tests/` — offline policy and ROI tests.

## Primary references

- GitHub: <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request>
- GitHub: <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target>
- GitHub: <https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks>
- GitHub: <https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target>
- GitHub: <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#changing-the-permissions-in-a-forked-repository>
