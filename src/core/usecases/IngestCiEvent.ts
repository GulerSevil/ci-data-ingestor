import type { CiEvent } from '../models/CiEvent.js';
import { CiEventSchema } from '../models/CiEvent.js';
import type { LogsPort } from '../ports/LogsPort.js';

export class IngestCiEventUseCase {
  private readonly logs: LogsPort;

  constructor(deps: { logs: LogsPort }) {
    this.logs = deps.logs;
  }

  async execute(input: unknown): Promise<CiEvent> {
    const parsed = CiEventSchema.parse(input);

    const computedDuration = computeDurationInMs(parsed.startedAt, parsed.finishedAt);
    const eventToIndex: CiEvent = (parsed.durationMs === undefined && computedDuration !== undefined)
      ? { ...parsed, durationMs: computedDuration }
      : parsed;

    await this.logs.indexCiEvent(eventToIndex);
    return eventToIndex;
  }
}

function computeDurationInMs(startedAt?: string, finishedAt?: string): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  const diff = end - start;
  if (diff < 0) return undefined;
  return Math.trunc(diff);
}

