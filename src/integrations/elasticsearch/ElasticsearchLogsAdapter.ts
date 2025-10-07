import type { LogsPort } from '../../core/ports/LogsPort.js';
import type { CiEvent } from '../../core/models/CiEvent.js';

export interface ElasticsearchClientLike {
  index(params: { index: string; id?: string; document: unknown }): Promise<unknown>;
}

export class ElasticsearchLogsAdapter implements LogsPort {
  private readonly client: ElasticsearchClientLike;
  private readonly indexName: string;

  constructor(client: ElasticsearchClientLike, indexName: string) {
    this.client = client;
    this.indexName = indexName;
  }

  async indexCiEvent(event: CiEvent): Promise<void> {
    const id = `${event.id}`;
    console.log('Indexing event:', event);
    console.log('Index name:', this.indexName);
    console.log('ID:', id);
    console.log('Document:', event);
    try {
      await this.client.index({ index: this.indexName, id, document: event });
    } catch (error) {
      console.error('Error indexing event:', error);
      throw error;
    }


    await this.client.index({ index: this.indexName, id, document: event });
  }
}


