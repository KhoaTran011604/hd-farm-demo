# Turborepo v2 + pnpm Monorepo Setup Report
**Date:** 2026-04-22 | **Status:** Current (2025-2026 best practices)

## Overview
Latest Turborepo v2 + pnpm monorepo for Fastify API + Next.js 14 + Expo setup. Key advantage: Expo SDK 52+ auto-detects monorepos, eliminating Metro bundler headaches. Turborepo rewritten in Rust (stable). Remote caching speeds up CI/CD 10-20x.

---

## 1. pnpm-workspace.yaml Structure
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'

public-hoist-pattern:
  - '*react*'
  - '*react-dom*'
  - '@react-native*'
```

**Structure:**
```
monorepo/
├── apps/
│   ├── api/              # Fastify TypeScript backend
│   ├── web/              # Next.js 14 App Router
│   └── mobile/           # Expo React Native
├── packages/
│   ├── shared/           # Types, constants, validators
│   ├── db/               # Drizzle ORM schemas
│   ├── ui/               # Shared React components
│   └── eslint-config/    # Shared linting rules
├── tools/
│   └── turbo/            # Custom Turbo plugins (optional)
└── pnpm-workspace.yaml
```

---

## 2. turbo.json Pipeline Config
```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "version": "2",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**"],
      "cache": true,
      "env": ["NODE_ENV"],
      "globalDependencies": ["tsconfig.json", "tsconfig.base.json"]
    },
    "dev": {
      "cache": false,
      "interactive": true,
      "dependsOn": ["^build"]
    },
    "lint": {
      "cache": true,
      "outputs": ["lint-report.json"],
      "globalDependencies": [".eslintrc.json", ".eslintignore"]
    },
    "test": {
      "cache": true,
      "outputs": ["coverage/**"],
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false,
      "inputs": ["packages/db/migrations/**"]
    }
  },
  "globalDependencies": ["pnpm-lock.yaml"],
  "globalEnv": ["NODE_ENV"]
}
```

**Key patterns:**
- `"^build"`: Dependencies must be built first
- `"cache": false`: Dev/watch tasks never cached
- `"interactive": true`: For Expo Metro dev server

---

## 3. Shared TypeScript Configs

**tsconfig.base.json** (root):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@db/*": ["packages/db/src/*"],
      "@ui/*": ["packages/ui/src/*"]
    }
  }
}
```

**Per-package tsconfig.json** (inherits base):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

---

## 4. Shared Packages Setup

**packages/shared/package.json:**
```json
{
  "name": "@monorepo/shared",
  "version": "1.0.0",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.js",
    "./constants": "./dist/constants.js",
    "./validators": "./dist/validators.js"
  },
  "main": "./dist/index.js"
}
```

**packages/db/package.json** (Drizzle schema):
```json
{
  "name": "@monorepo/db",
  "scripts": {
    "generate": "drizzle-kit generate:sqlite",
    "migrate": "drizzle-kit migrate:sqlite"
  },
  "devDependencies": {
    "drizzle-orm": "^0.30.0",
    "drizzle-kit": "^0.20.0"
  }
}
```

**Consuming in apps:**
```json
{
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/db": "workspace:*"
  }
}
```

---

## 5. Expo Metro Bundler Solutions

**apps/mobile/metro.config.js:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable monorepo support (Expo SDK 52+)
config.watchFolders = [
  path.resolve(__dirname, '../../packages'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, '../../node_modules'),
];

// Symlink resolution for workspace packages
config.resolver.extraNodeModules = {
  '@monorepo/shared': path.resolve(__dirname, '../../packages/shared'),
  '@monorepo/db': path.resolve(__dirname, '../../packages/db'),
};

// Clear cache on environment changes (Turborepo integration)
if (process.env.TURBO_HASH !== process.env.PREVIOUS_TURBO_HASH) {
  config.cacheStores = [];
}

module.exports = config;
```

**turbo.json task for mobile** (Expo-specific):
```json
{
  "tasks": {
    "dev:mobile": {
      "cache": false,
      "interactive": true,
      "env": ["EXPO_DEBUG", "NODE_ENV"],
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 6. Dev Scripts (package.json root)

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:all": "pnpm --filter='./apps/**' -r --parallel run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "turbo run db:migrate --filter=@monorepo/db",
    "clean": "turbo clean && rm -rf node_modules pnpm-lock.yaml"
  }
}
```

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Metro can't find packages | Use `watchFolders` + `nodeModulesPaths` in metro.config.js |
| TSConfig paths not resolving | Use `workspace:*` protocol in package.json |
| Cache invalidation issues | Set `globalDependencies` on lock file + env vars |
| Expo rebuild fails | Clear Metro cache: `expo start --clear` |
| pnpm hoisting conflicts | Use `public-hoist-pattern` for React/React-Native |
| Next.js build hangs | Set `cache: false` on `dev` task in turbo.json |

---

## Performance Checklist
- ✅ Remote caching enabled (Vercel free for hobby)
- ✅ `globalDependencies` on tsconfig.json + lock file
- ✅ Task dependencies use `^build` pattern
- ✅ Interactive tasks marked `"cache": false`
- ✅ Expo Metro configured with monorepo support

---

## References
- [Turborepo Docs: Configuration](https://turborepo.dev/docs/reference/configuration)
- [pnpm Workspaces Guide](https://pnpm.io/workspaces)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [Turborepo v2 Blog](https://turborepo.dev/blog/turbo-2-0)
- [Fuelstack Template](https://github.com/riipandi/fuelstack) - Fastify + Drizzle + Turborepo example
- [Expo Monorepo Example](https://github.com/byCedric/expo-monorepo-example)
