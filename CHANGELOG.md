# Changelog

## [Unreleased]

## [0.2.0] - 2026-05-28

### Changed

- Preview now opens in-place using the Custom Editor API instead of a side panel
- Added "Show Source" button to toggle back to the JSON source from the preview

### Maintenance

- Added .DS_Store to .gitignore
- Bumped @types/node, @types/vscode, eslint, typescript-eslint

## [0.1.3] - 2026-05-20

### Added

- Display scenario instruction in readout header as a collapsible block

### Maintenance

- Added 7-day cooldown for Dependabot updates
- Bumped @types/node from 25.6.0 to 25.6.2
- Bumped typescript-eslint from 8.56.1 to 8.59.2

## [0.1.2] - 2026-05-06

### Fixed

- Show harness name instead of raw profile ID for non-baseline profiles
- Prefix harness name on extension profiles only when different from baseline
- Separate harnesses with `·` in header subtitle instead of comma-separated list
- Sort profiles: baseline first, same-harness next, other harnesses last

## [0.1.1] - 2026-05-04

### Changed

- Renamed extension display name to "Scope readout preview"

### Maintenance

- Bumped eslint and typescript dev dependencies
- Added `types` field to tsconfig.json

## [0.1.0] - 2026-05-01

### Changed

- Updated section layouts and styling
- Sort profile results to prioritize baseline profiles in the output table

### Maintenance

- Bumped @types/node from 20.19.39 to 25.6.0

## [0.0.1]

- Initial release
