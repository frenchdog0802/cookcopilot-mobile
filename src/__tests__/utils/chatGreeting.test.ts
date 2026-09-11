import { greetingPeriodForHour, greetingPeriodNow } from '../../utils/chatGreeting';

describe('chatGreeting', () => {
  it('maps morning / afternoon / evening hours', () => {
    expect(greetingPeriodForHour(5)).toBe('morning');
    expect(greetingPeriodForHour(11)).toBe('morning');
    expect(greetingPeriodForHour(12)).toBe('afternoon');
    expect(greetingPeriodForHour(17)).toBe('afternoon');
    expect(greetingPeriodForHour(18)).toBe('evening');
    expect(greetingPeriodForHour(0)).toBe('evening');
  });

  it('uses the provided Date for greetingPeriodNow', () => {
    expect(greetingPeriodNow(new Date('2026-09-08T09:00:00'))).toBe('morning');
    expect(greetingPeriodNow(new Date('2026-09-08T15:00:00'))).toBe('afternoon');
    expect(greetingPeriodNow(new Date('2026-09-08T21:00:00'))).toBe('evening');
  });
});
