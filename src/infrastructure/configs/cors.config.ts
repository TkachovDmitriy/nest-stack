import { env } from 'process';

const allowedDomains = env.CORS_ORIGIN;

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (allowedDomains === '*') {
      callback(null, true);
      return;
    }

    if (!origin || process.env.NODE_ENV === 'test' || allowedDomains?.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // credentials: true, // Enable credentials (cookies, authorization headers)
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // exposedHeaders: ['Content-Range', 'X-Content-Range'],
  // maxAge: 86400, // Cache preflight request results for 24 hours
} as const;
