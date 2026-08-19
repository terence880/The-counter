# The Counter

An offline-first progressive web app for running ordered interval routines.

## Development

Requires Node.js 20.

```sh
npm install
npm run dev
```

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

The browser suite uses Playwright Chromium. Install it once with:

```sh
npx playwright install chromium
```

## Documentation

- [Product specification](./design-guide.md)
- [Domain language](./CONTEXT.md)
- [Testing seams](./docs/TESTING.md)
