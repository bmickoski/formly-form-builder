# Release Process

## Versioning

- Use SemVer tags: `vMAJOR.MINOR.PATCH`.
- Follow Conventional Commits for changelog-friendly history.

## Release checklist

1. Ensure CI green on `master`.
2. Run locally:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test -- --watch=false --browsers=ChromeHeadless`
   - `npm run build`
3. Update docs/ADR entries if architecture or behavior changed.
4. Create release commit (if needed) and push.
5. Create Git tag (`git tag vX.Y.Z`) and push tag (`git push origin vX.Y.Z`).
6. Publish GitHub Release notes (highlights, migration notes, known issues).

## Hotfix process

1. Branch from latest release tag.
2. Apply minimal fix + tests.
3. Bump patch version and tag.
4. Cherry-pick/merge back to `master`.

## Rollback

- Revert problematic commit(s) on `master`, rerun CI, and publish patch release.
