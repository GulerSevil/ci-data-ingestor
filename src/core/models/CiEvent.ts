import { z } from 'zod';

// Canonical CI event schema. Adjust fields as needed for your CI provider mappings.
export const CiEventSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(['github', 'gitlab', 'circleci', 'jenkins', 'azure', 'bitbucket']).optional().default('github'),
  project: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
  commitSha: z.string().min(7),
  status: z.enum(['queued', 'running', 'success', 'failed', 'canceled']),
  eventType: z.enum(['pipeline', 'job', 'deployment']).default('pipeline'),
  workflow_name: z.string().min(1).optional(),
  durationMs: z.number().int().nonnegative().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  actor: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CiEvent = z.infer<typeof CiEventSchema>;


