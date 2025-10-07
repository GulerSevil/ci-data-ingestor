import type { CiEvent } from '../models/CiEvent.js';

export interface LogsPort {
  indexCiEvent(event: CiEvent): Promise<void>;
}

