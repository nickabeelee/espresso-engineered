import { isOriginAllowed } from './origin-validation.js';

describe('isOriginAllowed', () => {
  const allowedSuffixes = ['.espressoengineered.com', '.netlify.app'];

  it('allows missing origin header', () => {
    expect(isOriginAllowed(undefined, allowedSuffixes)).toBe(true);
  });

  it('allows production apex domain', () => {
    expect(isOriginAllowed('https://espressoengineered.com', allowedSuffixes)).toBe(true);
  });

  it('allows www subdomain', () => {
    expect(isOriginAllowed('https://www.espressoengineered.com', allowedSuffixes)).toBe(true);
  });

  it('allows Netlify deploy previews', () => {
    expect(
      isOriginAllowed('https://deploy-preview-123--espresso-engineered.netlify.app', allowedSuffixes)
    ).toBe(true);
  });

  it('rejects lookalike domains', () => {
    expect(isOriginAllowed('https://espressoengineered.com.evil.com', allowedSuffixes)).toBe(false);
  });

  it('rejects malformed origin safely', () => {
    expect(isOriginAllowed('not a url', allowedSuffixes)).toBe(false);
  });
});
