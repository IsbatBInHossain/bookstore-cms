# --- STAGE 1: Base ---
# Purpose: Create a common foundation with the correct Node.js version,
# OS, and package manager (pnpm) ready to be used by other stages.
FROM node:22-alpine AS base
WORKDIR /app

# Add a compatibility layer often needed by native modules (like Prisma's query engine)
# to work correctly on the minimal Alpine Linux distribution.
RUN apk add --no-cache libc6-compat

# Enable Corepack, the official tool for managing package manager versions,
# and ensure it uses the specific pnpm version for our project.
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate


# --- STAGE 2: Pruner ---
# Purpose: Use Turborepo's `prune` command to calculate the smallest possible
# subset of the monorepo needed to build just the 'account-service'.
FROM base AS prune

# Install the Turborepo CLI globally, just for this temporary stage.
RUN npm i -g turbo

# Copy the entire monorepo source code. The root .dockerignore file will
# exclude unnecessary files like local node_modules, .git, and .turbo cache.
COPY . .

# Run `turbo prune` to create a minimal version of the monorepo in the `/app/out`
# directory. This contains only the code and package manifests required.
RUN turbo prune --scope=account-service --docker


# --- STAGE 3: Installer ---
# Purpose: Create a valid pnpm workspace with all dependencies (prod and dev)
# installed, based on the pruned configuration from the previous stage.
FROM base AS deps

# Copy the pruned package manifests and the crucial lockfile.
COPY --from=prune /app/out/json/ ./
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install all dependencies. We need devDependencies (like TypeScript and Prisma)
# to be present in the next stage to build the application.
RUN pnpm install --frozen-lockfile


# --- STAGE 4: Builder ---
# Purpose: Compile the TypeScript source code into JavaScript and then create
# a clean, production-only bundle of the service.
FROM deps AS build

# Start from the 'deps' stage. This provides a complete pnpm workspace with
# all node_modules and the pnpm-lock.yaml file already in place.

# Copy the pruned source code into the fully installed workspace.
COPY --from=prune /app/out/full/ ./

# Run the build script from the monorepo root. Turborepo will correctly
# build only the 'account-service' because it has the full workspace context.
RUN pnpm turbo build --filter=account-service

# After building, use `pnpm deploy` to create a clean, production-only bundle
# in the /out directory. This includes the compiled code (`dist/`) and only the
# production node_modules needed to run the service.
WORKDIR /app
RUN pnpm --filter=account-service deploy --prod --legacy /out


# --- STAGE 5: Runner ---
# Purpose: Create the final, minimal, and optimized production image. This image
# contains nothing from the build process (no devDependencies, no source code).
FROM node:22-alpine AS runner
WORKDIR /app

# Set the environment to production. This is crucial for performance and security.
ENV NODE_ENV=production

# Copy the production-ready bundle from the final step of the 'build' stage.
COPY --from=build /out ./

# Expose the port that the application will listen on.
EXPOSE 3001

# The command to start the service, pointing to the compiled JavaScript entry file.
CMD ["node", "dist/index.js"]