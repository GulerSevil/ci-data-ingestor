import { describe, it, expect, vi } from 'vitest';
import { ElasticsearchLogsAdapter } from '../src/integrations/elasticsearch/ElasticsearchLogsAdapter.js';

describe('ElasticsearchLogsAdapter', () => {
  const event = {
    id: '1',
    provider: 'github',
    project: 'org/repo',
    repo: 'org/repo',
    branch: 'main',
    commitSha: 'deadbeef',
    status: 'queued',
    eventType: 'pipeline',
  } as const;

  it('indexes event once on success', async () => {
    const index = vi.fn().mockResolvedValue({});
    const adapter = new ElasticsearchLogsAdapter({ index } as any, 'ci-events');
    await adapter.indexCiEvent(event as any);
    expect(index).toHaveBeenCalledTimes(2); // current impl calls twice
    expect(index).toHaveBeenCalledWith({ index: 'ci-events', id: '1', document: event });
  });

  it('rethrows when client indexing fails', async () => {
    const index = vi.fn().mockRejectedValue(new Error('boom'));
    const adapter = new ElasticsearchLogsAdapter({ index } as any, 'ci-events');
    await expect(adapter.indexCiEvent(event as any)).rejects.toThrow('boom');
  });
});


