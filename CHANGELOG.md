# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-01-18
### Added
- **Themes**: Added "Ocean", "Sunset", and "Retro" color themes.
- **Default Theme**: Changed the default theme to "Dark".

### Changed
- Refactored theme management logic to support easier expansion.

## [1.1.0] - 2026-01-18
### Added
- **File Manager**: Integrated a file browser to select and open CSV files dynamically.
- **Theme Support**: Added basic theming engine with "Default", "Dark", "Matrix", and "High Contrast" themes.
- **Settings**: Added a settings form to change themes and toggle table borders.

### Fixed
- Improved `conf` compatibility by downgrading to version 10.2.0 to support CommonJS.

## [1.0.0] - 2026-01-18
### Initial Release
- Basic CSV viewing capabilities.
- Sorting (ASC/DESC).
- Column visibility filtering.
- Export to CSV functionality.
- Persistent column preferences per file.
- Basic "Info" and "Quit" menu options.
