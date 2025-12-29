# Renovate Configuration

This repository uses Renovate to automatically keep dependencies up to date through automated pull requests. Renovate
has native support for Bun lockfiles (`bun.lock`).

## Configuration Overview

The Renovate configuration (`.github/renovate.json`) is set up with the following features:

### Package Ecosystems Monitored

1. **Bun** (JavaScript/TypeScript dependencies)
   - Weekly checks on Mondays before 10:00 AM Eastern
   - Groups related dependencies for easier management
   - Up to 100 concurrent PRs

2. **Docker** (Dockerfile dependencies)
   - Weekly checks on Mondays
   - Monitors base image updates
   - Grouped as `docker-dependencies`

3. **GitHub Actions** (CI/CD workflow dependencies)
   - Weekly checks on Mondays
   - Grouped as `github-actions`

### Dependency Grouping

Dependencies are grouped to reduce PR noise:

| Group                     | Description                   | Commit Prefix |
| ------------------------- | ----------------------------- | ------------- |
| `production-minor-patch`  | Production deps (minor/patch) | `deps`        |
| `development-minor-patch` | Dev deps (minor/patch)        | `deps-dev`    |
| `docker-dependencies`     | Docker base images            | `docker`      |
| `github-actions`          | GitHub Actions                | `ci`          |

Major version updates are not grouped and create individual PRs for careful review.

### Update Strategy

- **Schedule**: Weekly on Mondays before 10:00 AM Eastern
- **Versioning**: Preserves semver ranges (e.g., `^1.0.0` stays as `^1.x.x`)
- **Rebase**: Automatic when PRs become conflicted or behind base branch
- **Commit Messages**: Semantic commits with type prefixes (`deps`, `deps-dev`, `docker`, `ci`)

### Labels and Assignment

- All PRs are labeled with `dependencies` plus ecosystem-specific labels (`bun`, `docker`, `github-actions`)
- PRs are assigned to `jsamuelsen11` for review

### Dependency Dashboard

Renovate creates a "Dependency Dashboard" issue that:

- Shows pending updates
- Allows manual triggering of updates
- Provides visibility into Renovate's operations

## Managing Renovate PRs

### Best Practices

1. **Review Grouped PRs First**: Start with grouped updates as they're more comprehensive
2. **Check Breaking Changes**: Always review changelogs for major version updates
3. **Run Tests**: Ensure all tests pass before merging
4. **Security Updates**: Prioritize security-related dependency updates

### Ignoring Specific Dependencies

To ignore specific packages, add to `packageRules` in `renovate.json`:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["package-name"],
      "enabled": false
    }
  ]
}
```

### Customizing Update Frequency

Modify the `schedule` option in `renovate.json`:

- `["before 10am on Monday"]`: Weekly on Mondays
- `["every weekend"]`: Every Saturday and Sunday
- `["before 5am"]`: Daily before 5 AM

## Monitoring

Monitor Renovate activity through:

1. **Dependency Dashboard** issue in the repository
2. **Pull Requests** with `dependencies` label
3. **Security** tab for vulnerability alerts

## Troubleshooting

If Renovate stops creating PRs:

1. Check the **Dependency Dashboard** issue for status
2. Verify the configuration syntax in `renovate.json`
3. Ensure the Renovate GitHub App is installed and has access
4. Check for rate limits or scheduling constraints

For more information, see the [official Renovate documentation](https://docs.renovatebot.com/).
