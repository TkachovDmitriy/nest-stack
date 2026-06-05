import concurrently from 'concurrently';
import { ProcessCloseCondition } from 'concurrently/dist/src/flow-control/kill-others';

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds timeout for graceful shutdown

async function startServices() {
  const { result } = concurrently(
    [
      {
        command: 'docker compose up',
        name: 'docker',
        prefixColor: 'blue',
      },
      {
        command: 'pnpm start',
        name: 'backend',
        prefixColor: 'green',
      },
    ],
    {
      prefix: 'name',
      timestampFormat: 'HH:mm:ss',
      killOthers: ['failure', 'success'] as ProcessCloseCondition[],
      restartTries: 3,
      restartDelay: 3000,
    },
  );

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.info(`Received ${signal}, starting graceful shutdown...`);

    const timeoutId = setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
      await result;
      clearTimeout(timeoutId);
      console.info('All services shut down gracefully');
      process.exit(0);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await result;
  } catch (error) {
    console.error('Service error:', error);
    process.exit(1);
  }
}

startServices().catch((error) => {
  console.error('Failed to start services:', error);
  process.exit(1);
});
