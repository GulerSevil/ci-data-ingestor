import fp from 'fastify-plugin';
import rawBody from 'fastify-raw-body';

export default fp(async (app) => {
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: false,
    runFirst: true,
  });
});


