# GitHub Repository Setup

Apply these settings in GitHub to enforce production-grade collaboration.

## Branch protection (`master`)
1. Open repository `Settings -> Branches`.
2. Add rule for `master`.
3. Enable:
   - Require a pull request before merging
   - Require approvals: `1` (or `2` for stricter flow)
   - Dismiss stale approvals when new commits are pushed
   - Require review from Code Owners
   - Require status checks to pass before merging
   - Require conversation resolution before merging
   - Do not allow force pushes
   - Do not allow deletions

## Required status checks
Use the CI checks from `.github/workflows/ci.yml`:
- `quality (20)`
- `quality (22)`

## Optional hardening
- Enforce linear history.
- Enable auto-delete branch after merge.
- Enable Dependabot updates and security alerts.
