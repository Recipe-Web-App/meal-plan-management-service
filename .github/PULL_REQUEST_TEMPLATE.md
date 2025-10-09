# Pull Request

## Description

<!-- Provide a clear and concise description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Security fix
- [ ] Dependency update
- [ ] Configuration change
- [ ] Database schema change
- [ ] Other (please describe):

## Related Issues

<!-- Link to related issues using keywords: Fixes #123, Resolves #456, Related to #789 -->

Fixes #

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Authentication/Security Impact

<!-- Does this change affect authentication, authorization, or security? -->

- [ ] This PR affects authentication/authorization
- [ ] This PR has security implications
- [ ] No authentication/security impact

<!-- If checked, please describe the security implications -->

## Breaking Changes

<!-- List any breaking changes and migration steps -->

- [ ] This PR introduces breaking changes

<!-- If checked, describe the breaking changes and how users should migrate -->

## Testing

### Test Coverage

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass
- [ ] Code coverage maintained (>80%)

### Test Details

<!-- Describe the testing you performed -->

**Manual Testing:**

- <!-- Add manual testing details -->

**Automated Tests:**

- <!-- Add automated test details -->

**Test Coverage:**

- Current coverage:
- Coverage change:

## Configuration Changes

<!-- Are there new environment variables or configuration options? -->

- [ ] New environment variables added
- [ ] Configuration defaults changed
- [ ] No configuration changes

<!-- If checked, list the new/changed configuration -->

**New Configuration:**

```bash
# Add environment variables here
```

## Database/Storage Changes

<!-- Does this affect the database schema via Prisma? -->

- [ ] Database schema changes (Prisma migration required)
- [ ] Prisma Client regeneration needed
- [ ] Seed data changes
- [ ] No database/storage changes

<!-- If checked, describe the migration path -->

**Migration Commands:**

```bash
# Add Prisma migration commands if needed
```

## Performance Impact

<!-- Has performance been tested? Are there any impacts? -->

- [ ] Performance tested
- [ ] No performance impact expected
- [ ] Performance improvement
- [ ] Potential performance degradation (explained below)

<!-- If there's a performance impact, provide details -->

## Deployment Notes

<!-- Any special deployment considerations? -->

- [ ] Requires database migration
- [ ] Requires configuration changes
- [ ] Requires service restart
- [ ] Requires dependency updates
- [ ] Safe to deploy with rolling update
- [ ] Standard deployment

<!-- Provide deployment instructions if needed -->

## Documentation

<!-- Has documentation been updated? -->

- [ ] README.md updated
- [ ] CLAUDE.md updated
- [ ] API documentation updated (Swagger)
- [ ] Database documentation updated (docs/DATABASE.md)
- [ ] Code comments added/updated
- [ ] No documentation needed

## Checklist

<!-- Ensure all items are completed before requesting review -->

- [ ] Code follows the project's style guidelines (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Self-review of code performed
- [ ] Code commented, particularly in hard-to-understand areas
- [ ] No new security vulnerabilities introduced
- [ ] All tests pass locally (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] No sensitive information (secrets, keys, tokens) committed
- [ ] Commit messages follow conventional commit format
- [ ] Branch is up to date with target branch
- [ ] Prisma schema changes include migration (if applicable)

## Screenshots/Logs (if applicable)

<!-- Add screenshots, API response examples, or logs -->

## Additional Context

<!-- Add any additional context, concerns, or notes for reviewers -->

## Reviewer Notes

<!-- Specific areas where you'd like reviewer focus -->

Please pay special attention to:

- <!-- Add areas of focus -->
- <!-- Add areas of focus -->

---

**For Reviewers:**

- [ ] Code review completed
- [ ] Security implications reviewed
- [ ] Test coverage is adequate
- [ ] Documentation is clear and complete
- [ ] Database migrations tested (if applicable)
- [ ] API changes validated against Swagger docs
