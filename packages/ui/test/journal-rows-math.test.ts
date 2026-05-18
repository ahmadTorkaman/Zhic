import { describe, it, expect } from 'vitest';
import { computeRowOffset } from '../src/journal-rows-math';

describe('computeRowOffset', () => {
  const vh = 800;
  const sectionHeight = 1200;

  it('returns 0 when section is exactly centered', () => {
    // rectTop = (vh - sectionHeight) / 2 = -200
    // progress = (vh - rectTop) / (vh + sectionHeight) = 1000/2000 = 0.5
    // t = (0.5 - 0.5) * 2 = 0
    expect(computeRowOffset({ rectTop: -200, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(0, 5);
  });

  it('returns max positive offset when t = +1 (section fully past viewport top)', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(105, 1);
  });

  it('returns max negative offset when t = -1 (section just entering)', () => {
    expect(computeRowOffset({ rectTop: vh, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(-105, 1);
  });

  it('negative speed reverses direction', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, -0.55, 300)).toBeCloseTo(-165, 1);
  });

  it('respects the max displacement cap', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, 0.5, 140)).toBeCloseTo(70, 1);
  });
});
