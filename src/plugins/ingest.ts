import fp from 'fastify-plugin';
import { IngestCiEventUseCase } from '../core/usecases/IngestCiEvent.js';
import { ElasticsearchLogsAdapter, type ElasticsearchClientLike } from '../integrations/elasticsearch/ElasticsearchLogsAdapter.js';
import { createElasticsearchClient } from '../integrations/elasticsearch/client.js';
import { NoProviderAdapter } from '../integrations/no-op/NoProviderAdapter.js';

declare module 'fastify' {
  interface FastifyInstance {
    ingestCiEvent: IngestCiEventUseCase
  }
}

export default fp(async (app) => {
  const { OBSERVABILITY_PROVIDER } = app.config;

  switch (OBSERVABILITY_PROVIDER) {
    case 'elasticsearch': {
      const { ELASTICSEARCH_INDEX, ELASTICSEARCH_API_KEY } = app.config;
      if (!ELASTICSEARCH_API_KEY) {
        throw app.httpErrors.internalServerError('ELASTICSEARCH_API_KEY is required');
      }
      let client: ElasticsearchClientLike;
      try {
        client = createElasticsearchClient(app.config) as unknown as ElasticsearchClientLike;
      } catch (error) {
        throw app.httpErrors.internalServerError((error as Error).message);
      }
      const logsAdapter = new ElasticsearchLogsAdapter(client, ELASTICSEARCH_INDEX);
      const usecase = new IngestCiEventUseCase({ logs: logsAdapter });
      app.decorate('ingestCiEvent', usecase);
      break;
    }
    case 'none': {
      const logsAdapter = new NoProviderAdapter();
      const usecase = new IngestCiEventUseCase({ logs: logsAdapter });
      app.decorate('ingestCiEvent', usecase);
      break;
    }
    default: {
      throw app.httpErrors.internalServerError(`Unsupported observability provider: ${OBSERVABILITY_PROVIDER}`);
    }
  }
});


