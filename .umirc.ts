import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  define: {
    'process.env.APPID': process.env.APPID,
    'process.env.REGION': process.env.REGION,
    'process.env.AUTH_KEY': process.env.AUTH_KEY,
  },
  npmClient: 'pnpm',
});

