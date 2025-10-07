import { describe, it, expect, vi } from 'vitest';
import { IngestCiEventUseCase } from '../src/core/usecases/IngestCiEvent.js';

describe('IngestCiEventUseCase', () => {
  it('indexes parsed event unchanged when durationMs provided', async () => {
    const logs = { indexCiEvent: vi.fn().mockResolvedValue(undefined) };
    const usecase = new IngestCiEventUseCase({ logs });
    const input = {
      id: '1',
      project: 'org/repo',
      repo: 'org/repo',
      branch: 'main',
      commitSha: 'deadbeef',
      status: 'success',
      durationMs: 1000,
    };
    const out = await usecase.execute(input);
    expect(logs.indexCiEvent).toHaveBeenCalledWith(out);
    expect(out.durationMs).toBe(1000);
  });

  it('computes duration when timestamps provided and duration missing', async () => {
    const logs = { indexCiEvent: vi.fn().mockResolvedValue(undefined) };
    const usecase = new IngestCiEventUseCase({ logs });
    const input = {
      id: '1',
      project: 'org/repo',
      repo: 'org/repo',
      branch: 'main',
      commitSha: 'deadbeef',
      status: 'success',
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.500Z',
    };
    const out = await usecase.execute(input);
    expect(out.durationMs).toBe(1500);
    expect(logs.indexCiEvent).toHaveBeenCalledWith(out);
  });

  it('omits duration when invalid or negative', async () => {
    const logs = { indexCiEvent: vi.fn().mockResolvedValue(undefined) };
    const usecase = new IngestCiEventUseCase({ logs });
    const input = {
      id: '1',
      project: 'org/repo',
      repo: 'org/repo',
      branch: 'main',
      commitSha: 'deadbeef',
      status: 'success',
      startedAt: '2024-01-01T00:00:01.000Z',
      finishedAt: '2024-01-01T00:00:00.000Z',
    };
    const out = await usecase.execute(input);
    expect(out.durationMs).toBeUndefined();
    expect(logs.indexCiEvent).toHaveBeenCalledWith(out);
  });
});


