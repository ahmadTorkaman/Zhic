import { describe, expect, it } from 'vitest';
import { easing } from '@zhic/design-system';

describe('design-system motion tokens', () => {
  it('exposes the spring-overshoot easing used by the bedroom-set rotating headline', () => {
    expect(easing.spring).toBe('cubic-bezier(0.34, 1.45, 0.5, 1)');
  });
});
