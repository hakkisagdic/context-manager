# Integration Tests

This directory contains integration tests that verify interactions between multiple components.

## Structure

- `api/` - Tests for REST API endpoints
- `git/` - Tests for Git integration features
- `watch/` - Tests for watch mode functionality
- `workflows/` - Tests for end-to-end workflows

## Running Integration Tests

```bash
npm run test:integration
```

## Guidelines

- Test component interactions
- Verify data flow between modules
- Test realistic usage scenarios
- May use temporary files/directories
