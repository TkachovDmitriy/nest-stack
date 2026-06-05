import 'dotenv/config';

import { ApplicationBootstrap } from '@infrastructure/bootstrap/application.bootstrap';

async function bootstrap(): Promise<void> {
  const application = new ApplicationBootstrap();

  await application.start();
}

bootstrap();
