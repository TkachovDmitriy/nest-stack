## Logger

### How to use

1. Copy the desired files to your project
2. Copy the `configs/logger.config.ts` file
3. Install `pino` and `pino-pretty` libraries

```shell
yarn add pino pino-pretty
```

### Environment Variables

The logger supports the following environment variables (defined in `env.config.ts`):

- `LOG_LEVEL`: Sets the minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). Default: `info`
- `PRETTY_LOGGING`: Enables colorized, human-readable output. Default: `false`
- `NODE_ENV`: When set to `development`, automatically enables pretty logging

### Pretty Logging Configuration

Pretty logging is automatically enabled when:
- `PRETTY_LOGGING=true` is set
- `NODE_ENV=development` 
- Running in a TTY terminal (and not in production)

**Development usage:**
```bash
# Enable pretty logging for development
npm run start:dev

# Or set it manually
PRETTY_LOGGING=true npm start

# With custom log level
LOG_LEVEL=debug PRETTY_LOGGING=true npm start
```

**Production usage:**
```bash
# Production uses JSON logging (no colors) for better performance
NODE_ENV=production npm run start:prod
```

### Pretty Log Format

The pretty formatter shows logs in this format:
```
[Context] Message | trace:12345678 user:abcd1234 GET /api/users 150ms op:fetchUsers type:audit
```

### Example of usage

Creating `QueryLogger`