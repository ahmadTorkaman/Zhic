import { describe, expect, it, afterEach, vi } from 'vitest';
import { sendSms } from '../index';

describe('SMS_DRY_RUN', () => {
  const originalDryRun = process.env.SMS_DRY_RUN;
  const originalApiKey = process.env.SMS_IR_API_KEY;
  const originalLine = process.env.SMS_IR_LINE_NUMBER;

  afterEach(() => {
    if (originalDryRun === undefined) delete process.env.SMS_DRY_RUN;
    else process.env.SMS_DRY_RUN = originalDryRun;
    if (originalApiKey === undefined) delete process.env.SMS_IR_API_KEY;
    else process.env.SMS_IR_API_KEY = originalApiKey;
    if (originalLine === undefined) delete process.env.SMS_IR_LINE_NUMBER;
    else process.env.SMS_IR_LINE_NUMBER = originalLine;
    vi.restoreAllMocks();
  });

  it('returns ok=true without calling fetch when SMS_DRY_RUN=true, even with creds set', async () => {
    process.env.SMS_DRY_RUN = 'true';
    process.env.SMS_IR_API_KEY = 'fake-key';
    process.env.SMS_IR_LINE_NUMBER = '30001234';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const result = await sendSms({ to: '09120000000', text: 'تست' });

    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[@zhic/sms] DRY_RUN'),
      expect.objectContaining({ to: '09120000000' })
    );
  });

  it('falls through to the no-creds branch when SMS_DRY_RUN unset and creds missing', async () => {
    delete process.env.SMS_DRY_RUN;
    delete process.env.SMS_IR_API_KEY;
    delete process.env.SMS_IR_LINE_NUMBER;

    const result = await sendSms({ to: '09120000000', text: 'تست' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/credentials/i);
  });
});
