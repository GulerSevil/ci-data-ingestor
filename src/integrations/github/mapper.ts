import type { CiEvent } from '../../core/models/CiEvent.js';

type GithubEventPayload = Record<string, unknown> & {
  repository?: { full_name?: string; name?: string };
  sender?: { login?: string };
  workflow_run?: {
    id?: number;
    head_branch?: string;
    head_sha?: string;
    status?: string;
    conclusion?: string | null;
    name?: string;
    run_started_at?: string;
    updated_at?: string;
  };
  workflow_job?: {
    id?: number;
    head_branch?: string;
    head_sha?: string;
    status?: string;
    conclusion?: string | null;
    workflow_name?: string;
    started_at?: string;
    completed_at?: string;
  };
  check_suite?: {
    id?: number;
    head_branch?: string;
    head_sha?: string;
    status?: string;
    conclusion?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  ref?: string;
  after?: string;
};

export function mapGithubToCiEvent(eventName: string, deliveryId: string, payload: GithubEventPayload): CiEvent {
  const repoFullName = payload.repository?.full_name ?? payload.repository?.name ?? 'unknown';
  const actor = payload.sender?.login;

  if (eventName === 'workflow_run' && payload.workflow_run) {
    const wr = payload.workflow_run;
    return {
      id: `${deliveryId}`,
      provider: 'github',
      project: repoFullName,
      repo: repoFullName,
      branch: wr.head_branch ?? 'unknown',
      commitSha: wr.head_sha ?? 'unknown',
      status: mapStatus(wr.status, wr.conclusion),
      eventType: 'pipeline',
      workflow_name: wr.name,
      startedAt: wr.run_started_at,
      finishedAt: wr.updated_at,
      actor,
      metadata: { event: eventName },
    };
  }

  if (eventName === 'workflow_job' && payload.workflow_job) {
    const wj = payload.workflow_job;
    return {
      id: `${deliveryId}`,
      provider: 'github',
      project: repoFullName,
      repo: repoFullName,
      branch: wj.head_branch ?? 'unknown',
      commitSha: wj.head_sha ?? 'unknown',
      status: mapStatus(wj.status, wj.conclusion),
      eventType: 'job',
      workflow_name: wj.workflow_name,
      startedAt: wj.started_at,
      finishedAt: wj.completed_at ?? undefined,
      actor,
      metadata: { event: eventName },
    } as CiEvent;
  }

  if (eventName === 'check_suite' && payload.check_suite) {
    const cs = payload.check_suite;
    return {
      id: `${deliveryId}`,
      provider: 'github',
      project: repoFullName,
      repo: repoFullName,
      branch: cs.head_branch ?? 'unknown',
      commitSha: cs.head_sha ?? 'unknown',
      status: mapStatus(cs.status, cs.conclusion),
      eventType: 'pipeline',
      startedAt: cs.created_at,
      finishedAt: cs.updated_at,
      actor,
      metadata: { event: eventName },
    } as CiEvent;
  }

  

  // Fallback: general push mapping
  return {
    id: `${deliveryId}`,
    provider: 'github',
    project: repoFullName,
    repo: repoFullName,
    branch: payload.ref ? payload.ref.replace('refs/heads/', '') : 'unknown',
    commitSha: (payload.after as string | undefined) ?? 'unknown',
    status: 'queued',
    eventType: 'pipeline',
    actor,
    metadata: { event: eventName },
  } as CiEvent;
}

function mapStatus(status?: string, conclusion?: string | null): CiEvent['status'] {
  const normalizedStatus = (status ?? '').toLowerCase();
  const normalizedConclusion = (conclusion ?? '').toLowerCase();
  if (normalizedStatus === 'queued') return 'queued';
  if (normalizedStatus === 'in_progress' || normalizedStatus === 'running') return 'running';
  if (normalizedStatus === 'completed') {
    if (normalizedConclusion === 'success' || normalizedConclusion === 'neutral' || normalizedConclusion === 'skipped') return 'success';
    if (normalizedConclusion === 'cancelled' || normalizedConclusion === 'canceled') return 'canceled';
    return 'failed';
  }
  return 'queued';
}


