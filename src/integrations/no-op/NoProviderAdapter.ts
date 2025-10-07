import type { LogsPort } from '../../core/ports/LogsPort.js';
import type { CiEvent } from '../../core/models/CiEvent.js';

export class NoProviderAdapter implements LogsPort {
  async indexCiEvent(_event: CiEvent): Promise<void> {
    console.log(_event);
  }
}


