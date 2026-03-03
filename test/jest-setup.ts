import '@testing-library/jest-dom'

// jsdom's document.hasFocus() returns false by default (no real window).
// Mock it to return true to match the real browser default state.
if (typeof document !== 'undefined') {
  jest.spyOn(document, 'hasFocus').mockReturnValue(true)
}
