# Release Process

## Versioning

- Use SemVer tags: `vMAJOR.MINOR.PATCH`.
- Follow Conventional Commits for changelog-friendly history.

## Release checklist

1. Ensure CI green on `master`.
2. Run locally:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test:ci`
   - `npm run e2e:critical`
   - `npm run build`
   - `npm run build:lib`
3. Update docs/ADR entries if architecture or behavior changed.
4. Ensure npm trusted publishing is configured (GitHub Actions OIDC publisher for this repository/package).
5. Create release commit (if needed) and push.
6. Create Git tag (`git tag vX.Y.Z`) and push tag (`git push origin vX.Y.Z`).
7. Verify the release workflow published:
   - npm package from `dist/formly-builder`
   - GitHub release assets (`formly-form-builder-dist.tar.gz` and library `.tgz`)
8. Publish release notes (highlights, migration notes, known issues).

## Hotfix process

1. Branch from latest release tag.
2. Apply minimal fix + tests.
3. Bump patch version and tag.
4. Cherry-pick/merge back to `master`.

## Rollback

- Revert problematic commit(s) on `master`, rerun CI, and publish patch release.
