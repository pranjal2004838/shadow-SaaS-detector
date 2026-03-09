import { describe, it, expect } from 'vitest';
import { simulateSavings, DetectedApp } from '../../backend/services/simulator';

describe('simulateSavings', () => {
  const sampleApps: DetectedApp[] = [
    { id: 3, name: 'ChatGPT Pro', category: 'AI Tools', typical_price: 20 },
    { id: 4, name: 'Jasper.ai', category: 'AI Tools', typical_price: 50 },
    { id: 5, name: 'Copy.ai', category: 'AI Tools', typical_price: 50 },
    { id: 13, name: 'Asana', category: 'Project Management', typical_price: 11 },
    { id: 14, name: 'Monday.com', category: 'Project Management', typical_price: 10 },
    { id: 1, name: 'Copper CRM', category: 'CRM', typical_price: 50 },
    { id: 8, name: 'Slack', category: 'Communication', typical_price: 8 },
  ];

  it('should calculate savings when consolidating AI Tools to ChatGPT', () => {
    const result = simulateSavings(sampleApps, { 'AI Tools': 'ChatGPT Pro' });
    // Removing Jasper.ai ($50) and Copy.ai ($50) = $100 saved
    const aiBreakdown = result.breakdown.find((b) => b.category === 'AI Tools');
    expect(aiBreakdown).toBeDefined();
    expect(aiBreakdown!.keptApp).toBe('ChatGPT Pro');
    expect(aiBreakdown!.removedApps).toContain('Jasper.ai');
    expect(aiBreakdown!.removedApps).toContain('Copy.ai');
    expect(aiBreakdown!.saved).toBe(100);
  });

  it('should calculate savings for Project Management consolidation', () => {
    const result = simulateSavings(sampleApps, {
      'AI Tools': 'ChatGPT Pro',
      'Project Management': 'Asana',
    });
    const pmBreakdown = result.breakdown.find((b) => b.category === 'Project Management');
    expect(pmBreakdown).toBeDefined();
    expect(pmBreakdown!.keptApp).toBe('Asana');
    expect(pmBreakdown!.removedApps).toContain('Monday.com');
    expect(pmBreakdown!.saved).toBe(10);
  });

  it('should not consolidate categories with only one app', () => {
    const result = simulateSavings(sampleApps, { 'AI Tools': 'ChatGPT Pro' });
    const commBreakdown = result.breakdown.find((b) => b.category === 'Communication');
    expect(commBreakdown).toBeUndefined();
  });

  it('should apply adoption multiplier', () => {
    const full = simulateSavings(sampleApps, { 'AI Tools': 'ChatGPT Pro' }, 1.0);
    const half = simulateSavings(sampleApps, { 'AI Tools': 'ChatGPT Pro' }, 0.5);
    expect(half.monthlySavings).toBeCloseTo(full.monthlySavings * 0.5, 1);
    expect(half.annualSavings).toBeCloseTo(full.annualSavings * 0.5, 1);
  });

  it('should calculate correct annual savings (monthly * 12)', () => {
    const result = simulateSavings(sampleApps, { 'AI Tools': 'ChatGPT Pro' });
    expect(result.annualSavings).toBe(result.monthlySavings * 12);
  });

  it('should handle empty apps array', () => {
    const result = simulateSavings([], {});
    expect(result.monthlySavings).toBe(0);
    expect(result.annualSavings).toBe(0);
    expect(result.breakdown).toEqual([]);
  });

  it('should use first app as default when no keepMap entry', () => {
    const result = simulateSavings(sampleApps, {});
    const aiBreakdown = result.breakdown.find((b) => b.category === 'AI Tools');
    expect(aiBreakdown).toBeDefined();
    // Default keeps the first app: ChatGPT Pro
    expect(aiBreakdown!.keptApp).toBe('ChatGPT Pro');
  });
});
