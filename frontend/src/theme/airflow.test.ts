import { describe, it, expect } from 'vitest';
import { airflowTheme } from './airflow';

describe('airflowTheme', () => {
  it('uses Airflow teal as primary', () => {
    expect(airflowTheme.palette.primary.main).toBe('#017CEE');
  });

  it('defaults to dark mode', () => {
    expect(airflowTheme.palette.mode).toBe('dark');
  });

  it('uses Pretendard for body font stack', () => {
    expect(airflowTheme.typography.fontFamily).toContain('Pretendard');
  });

  it('exposes JetBrains Mono via monospace typography variant', () => {
    const mono = (airflowTheme.typography as unknown as {
      monospace?: { fontFamily?: string };
    }).monospace;
    expect(mono?.fontFamily).toContain('JetBrains Mono');
  });
});
