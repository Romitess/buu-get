/**
 * Launch TypeORM CLI with ts-node + path aliases.
 * Uses Node module resolution so this works with both npm workspace hoist
 * (root node_modules) and pnpm (apps/backend/node_modules).
 */
'use strict';

require('tsconfig-paths/register');
require('typeorm/cli-ts-node-commonjs');
