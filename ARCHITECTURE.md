# Accented Project Architecture & Contributor Guide

*A concise reference for understanding and contributing to the Accented accessibility testing library*

## Project Overview

**Accented** is a frontend library for continuous accessibility testing and issue highlighting. It runs axe-core scans on web pages and displays visual indicators for accessibility issues in real-time.

## Monorepo Structure

```
accented/
├── packages/
│   ├── accented/          # Main library (published to NPM)
│   ├── website/           # Documentation site (accented.dev)
│   ├── devapp/            # Development/testing app
│   └── common/            # Shared utilities
├── .github/workflows/     # CI/CD pipelines
└── .changeset/           # Version management
```

## Core Architecture

### Main Library (`packages/accented/`)

**Entry Point**: `src/accented.ts` - Main API function that returns a disable function
**Key Dependencies**: axe-core, @preact/signals-core

#### Core Components:

1. **Scanner** (`scanner.ts`)
   - Runs axe-core accessibility scans
   - Uses TaskQueue for throttled execution
   - Handles mutation observation via shadow-DOM-aware observer

2. **State Management** (`state.ts`)
   - Uses Preact signals for reactive state
   - Tracks enabled status, elements with issues, root nodes
   - Computed values for scrollable ancestors

3. **Custom Elements** (`elements/`)
   - `AccentedTrigger`: Visual indicators for accessibility issues
   - `AccentedDialog`: Issue details popup
   - Uses Shadow DOM with CSS anchor positioning (when supported)

4. **DOM Management**
   - `dom-updater.ts`: Manages trigger placement and updates
   - `register-elements.ts`: Custom element registration
   - Position calculation utilities

5. **Event Handling**
   - Scroll, resize, fullscreen, intersection observers
   - Recalculates positions and scrollable ancestors reactively

#### Key Utilities (`utils/`):
- Position calculation and anchor positioning support
- Shadow DOM mutation observation
- Context normalization and scanning
- Element comparison and deduplication

### Development App (`packages/devapp/`)
- Vite-based development environment
- Playwright E2E tests
- Test pages for various scenarios

### Website (`packages/website/`)
- Astro-based documentation site
- Custom rehype plugins for heading links and code copy buttons
- Deployed to Netlify

### Common Package (`packages/common/`)
- Shared tokens and strings
- Copied to main library during build

## Development Workflow

### Setup Requirements
- Node.js ≥ 23.6.0 (uses native TypeScript support)
- pnpm package manager

### Key Commands
```bash
pnpm dev          # Start devapp + library watch mode
pnpm website:dev  # Start website development
pnpm build        # Build all packages
pnpm test:unit    # Run unit tests
pnpm test:e2e     # Run Playwright tests
```

### Development Scripts
- Library builds with TypeScript, copies common files
- Watch mode rebuilds on changes
- Type checking for tests separate from main build

## Release Management

### Changesets Workflow
1. **Create changeset**: `pnpm changeset` for any consumer-affecting change
2. **Automated releases**: Changesets GitHub Action manages versioning
3. **Snapshot releases**: Push to `snapshot/*` branch for testing versions

### Version Types
- **Patch**: Bug fixes, dependency updates
- **Minor**: New features, API additions
- **Major**: Breaking changes

### Publishing
- Automated via GitHub Actions on main branch merge
- NPM provenance enabled
- Creates GitHub releases with changelog

## Testing Strategy

### Unit Tests
- Node.js native test runner with tsx
- JSDOM for DOM testing
- Located alongside source files (`.test.ts`)

### E2E Tests
- Playwright for browser testing
- Tests positioning, interaction, accessibility
- Multiple test scenarios in devapp

### CI/CD Pipeline
- Biome for linting/formatting
- Build verification
- Unit and E2E test execution
- Automated publishing

## Code Quality

### Tools
- **Biome**: Linting, formatting, import organization
- **TypeScript**: Strict typing with import extensions
- **Changesets**: Version management
- **GitHub Actions**: CI/CD automation

### Standards
- ESM modules only
- Import extensions required in library code
- Shadow DOM for style isolation
- Preact signals for reactive state
- Error handling with meaningful messages

## Key Technologies

### Runtime
- **axe-core**: Accessibility testing engine
- **Preact Signals**: Reactive state management
- **CSS Anchor Positioning**: Modern positioning (with fallback)
- **Shadow DOM**: Style isolation

### Build/Dev
- **TypeScript**: Type safety and modern JS features
- **Astro**: Static site generation for docs
- **Vite**: Development server and bundling
- **Playwright**: Browser automation testing

## Browser Support
- Modern browsers with specific version support policy
- Graceful fallbacks for newer features (anchor positioning)
- Known limitations documented (Safari zoom, Firefox text-only zoom)

## Contributing Guidelines

### Before Making Changes
1. Check if change needs a changeset (`pnpm changeset`)
2. Follow error handling philosophy (meaningful messages)
3. Add try-catch blocks for async custom element methods
4. Test positioning and accessibility features

### Code Organization
- Keep utilities small and focused
- Use signals for reactive data
- Maintain browser compatibility fallbacks
- Document known limitations clearly

## Architecture Decisions

### Key Design Choices
- **Trigger Placement**: Next to elements (not centralized) for modal dialog support
- **Positioning**: Anchor positioning preferred, fixed fallback
- **Shadow DOM**: Complete style isolation with `!important` styles
- **Error Handling**: Rethrow with context, suggest browser updates
- **License**: MIT for maximum permissiveness

This architecture balances performance, accessibility, and developer experience while maintaining broad browser compatibility and robust error handling.
