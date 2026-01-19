# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1] - 2026-01-18
### Changed
- Updated author information to `@not_jarod`.
- Updated contact information to GitHub repository.
- Updated application title to "TUIcsv Viewer" with dynamic filename display.

## [1.3.0] - 2026-01-18
### Added
- **Search**: Global search functionality to filter rows by text.
- **Performance**: Implemented virtual scrolling to handle large CSV files efficiently.
- **Status Bar**: Added a bottom status bar showing row counts and search status.

### Changed
- Optimized table rendering to only draw visible rows.
- Updated key bindings (PageUp/Down, Home/End) to support virtual scrolling.

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