# Dependabot Configuration

This repository uses GitHub Dependabot to automatically keep dependencies up to date through automated pull requests.

## Configuration Overview

The Dependabot configuration (`.github/dependabot.yml`) is set up with the following features:

### 📦 Package Ecosystems Monitored

1. **npm** (Node.js dependencies)
   - Daily checks at 04:00 UTC
   - Groups related dependencies for easier management
   - Up to 10 open PRs at once

2. **Docker** (Dockerfile dependencies)
   - Weekly checks on Mondays at 04:00 UTC
   - Monitors base image updates

3. **GitHub Actions** (CI/CD workflow dependencies)
   - Weekly checks on Mondays at 04:00 UTC
   - Ready for when GitHub Actions are added

### 🏷️ Dependency Grouping

Dependencies are intelligently grouped to reduce PR noise:

- **NestJS**: All `@nestjs/*` packages (except testing)
- **Testing**: Jest, Supertest, and testing-related packages
- **Build Tools**: TypeScript, ts-node, SWC, and type definitions
- **Code Quality**: ESLint, Prettier, Commitlint, Husky
- **Docker**: Docker-related packages
- **Database**: Prisma and PostgreSQL packages

### 🔄 Update Strategy

- **Versioning Strategy**: `increase` - allows both patch and minor updates
- **Update Types**: Both direct and indirect dependencies
- **Branch Naming**: Uses `/` separator for organized branch names
- **Commit Messages**: Prefixed with `deps`, `deps-dev`, `docker`, or `ci`

### 🏷️ Labels and Assignment

- All PRs are automatically labeled with relevant tags
- PRs are assigned to `jsamuelsen11` for review
- Custom labels help identify the type of updates

## Managing Dependabot PRs

### Best Practices

1. **Review Grouped PRs First**: Start with grouped updates as they're more comprehensive
2. **Check Breaking Changes**: Always review changelogs for major version updates
3. **Run Tests**: Ensure all tests pass before merging
4. **Security Updates**: Prioritize security-related dependency updates

### Ignoring Specific Dependencies

To ignore specific packages or versions, uncomment and modify the `ignore` section in `dependabot.yml`:

```yaml
ignore:
  - dependency-name: 'package-name'
    versions: ['1.x', '2.0.0']
```

### Customizing Update Frequency

You can modify the schedule for each ecosystem:

- `daily`: Every day
- `weekly`: Once per week (specify day)
- `monthly`: Once per month

## Security Features

- Dependabot automatically creates PRs for security vulnerabilities
- Security updates are prioritized over regular updates
- All updates include vulnerability information when applicable

## Monitoring

Monitor Dependabot activity through:

1. **Repository Insights** → **Dependency graph** → **Dependabot**
2. **Pull Requests** with `dependencies` label
3. **Security** tab for vulnerability alerts

## Troubleshooting

If Dependabot stops creating PRs:

1. Check the **Insights** → **Dependency graph** → **Dependabot** tab
2. Verify the configuration syntax in `dependabot.yml`
3. Ensure repository has Dependabot enabled in Settings
4. Check for open PR limits (configured to 10 for npm)

For more information, see the [official Dependabot documentation](https://docs.github.com/en/code-security/dependabot).
