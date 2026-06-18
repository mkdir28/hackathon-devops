/**
 * Unit tests for ai/demo-notice.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('../../config.js', () => ({
  config: { demoMode: true },
}));

beforeEach(() => {
  vi.resetModules();
});

describe('logDemoModeWarningIfNeeded', () => {
  it('logs a warning when demoMode is true', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logDemoModeWarningIfNeeded } = await import('../../ai/demo-notice.js');
    logDemoModeWarningIfNeeded();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]![0]).toContain('DEMO MODE');
    warnSpy.mockRestore();
  });

  it('logs only once even when called multiple times', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logDemoModeWarningIfNeeded } = await import('../../ai/demo-notice.js');
    logDemoModeWarningIfNeeded();
    logDemoModeWarningIfNeeded();
    logDemoModeWarningIfNeeded();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

describe('logDemoModeWarningIfNeeded (non-demo mode)', () => {
  it('does not log when demoMode is false', async () => {
    vi.doMock('../../config.js', () => ({ config: { demoMode: false } }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logDemoModeWarningIfNeeded } = await import('../../ai/demo-notice.js');
    logDemoModeWarningIfNeeded();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
    vi.resetModules();
  });
});