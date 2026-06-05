# Scripts

Maintenance and tooling scripts for the project.

## `generate-swagger.ts`

Generates the OpenAPI spec into `swagger/` without starting the HTTP server.

```bash
pnpm generate:swagger
```

Add project-specific maintenance or data-migration scripts here and wire them
up as `pnpm` scripts in `package.json`.
