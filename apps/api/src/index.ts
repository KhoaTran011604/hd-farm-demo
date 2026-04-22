import { buildServer } from './server.js';

async function start(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ port: Number(process.env['PORT'] ?? 3001), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
