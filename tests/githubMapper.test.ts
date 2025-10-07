import { describe, it, expect } from 'vitest';
import { mapGithubToCiEvent } from '../src/integrations/github/mapper.js';

describe('mapGithubToCiEvent', () => {
  const deliveryId = 'd1';
  const repo = { repository: { full_name: 'org/repo' } } as any;

  it('maps workflow_run event', () => {
    const payload = {
      ...repo,
      sender: { login: 'alice' },
      workflow_run: {
        head_branch: 'main',
        head_sha: 'deadbeef',
        status: 'completed',
        conclusion: 'success',
        name: 'CI',
        run_started_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:10.000Z',
      },
    };
    const e = mapGithubToCiEvent('workflow_run', deliveryId, payload);
    expect(e.status).toBe('success');
    expect(e.eventType).toBe('pipeline');
    expect(e.workflow_name).toBe('CI');
    expect(e.actor).toBe('alice');
  });

  it('maps workflow_job event', () => {
    const payload = {
      ...repo,
      sender: { login: 'bob' },
      workflow_job: {
        head_branch: 'dev',
        head_sha: 'cafebabe',
        status: 'completed',
        conclusion: 'cancelled',
        workflow_name: 'build',
        started_at: '2024-01-01T00:00:00.000Z',
        completed_at: '2024-01-01T00:00:05.000Z',
      },
    };
    const e = mapGithubToCiEvent('workflow_job', deliveryId, payload);
    expect(e.status).toBe('canceled');
    expect(e.eventType).toBe('job');
    expect(e.branch).toBe('dev');
  });

  it('maps check_suite event', () => {
    const payload = {
      ...repo,
      check_suite: {
        head_branch: 'main',
        head_sha: 'feedf00d',
        status: 'completed',
        conclusion: 'failure',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:03.000Z',
      },
    };
    const e = mapGithubToCiEvent('check_suite', deliveryId, payload);
    expect(e.status).toBe('failed');
    expect(e.eventType).toBe('pipeline');
    expect(e.commitSha).toBe('feedf00d');
  });

  it('falls back to push-like mapping', () => {
    const payload = { ...repo, ref: 'refs/heads/feature/x', after: 'beaded00' } as any;
    const e = mapGithubToCiEvent('push', deliveryId, payload);
    expect(e.status).toBe('queued');
    expect(e.branch).toBe('feature/x');
    expect(e.commitSha).toBe('beaded00');
  });
});


