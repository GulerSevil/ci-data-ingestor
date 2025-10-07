import { Client, type ClientOptions } from '@elastic/elasticsearch';
import type { Env } from '../../config/env.js';
import type { ElasticsearchClientLike } from './ElasticsearchLogsAdapter.js';

export function createElasticsearchClient(config: Env): ElasticsearchClientLike {
  const { ELASTICSEARCH_NODE, ELASTICSEARCH_API_KEY } = config;
  const options: ClientOptions = { node: ELASTICSEARCH_NODE };
  if (!ELASTICSEARCH_API_KEY) {
    throw new Error('ELASTICSEARCH_API_KEY is required');
  }
  (options as any).auth = { apiKey: ELASTICSEARCH_API_KEY };
  return new Client(options) as unknown as ElasticsearchClientLike;
}


