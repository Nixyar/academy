// @ts-nocheck
import path from 'path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { getPrerenderRoutes } from './src/seo/useRouteSeo';

const require = createRequire(import.meta.url);
type VitePrerenderPlugin = (options: unknown) => unknown;
type VitePrerenderWithRenderer = VitePrerenderPlugin & {
  PuppeteerRenderer: new (options?: any) => { destroy: () => void };
};
const vitePrerender = require('vite-plugin-prerender') as VitePrerenderWithRenderer;

const resolveChromeExecutablePath = (): string | undefined => {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const Renderer = vitePrerender.PuppeteerRenderer;
    class SafePuppeteerRenderer extends Renderer {
      destroy() {
        const browser = (this as any)._puppeteer as { close?: () => void } | null | undefined;
        browser?.close?.();
      }
    }

    const prerenderHost = env.PRERENDER_HOST || process.env.PRERENDER_HOST || '127.0.0.1';
    const prerenderPort = Number(env.PRERENDER_PORT || process.env.PRERENDER_PORT || 4179);
    const enablePrerender = (env.PRERENDER || process.env.PRERENDER) === '1';

    return {
      server: {
        port: 3000,
        host: env.VITE_DEV_HOST || '127.0.0.1',
        proxy: {
          '/api': {
            target: env.VITE_API_BASE_URL || 'https://api.vibecoderai.ru',
            changeOrigin: true,
            secure: true,
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
              });
            },
          },
        },
      },
      plugins: [
        react(),
        ...(enablePrerender
          ? [
            vitePrerender({
              staticDir: path.join(__dirname, 'dist'),
              routes: getPrerenderRoutes(),
              server: {
                host: prerenderHost,
                port: prerenderPort,
              },
              renderer: new SafePuppeteerRenderer({
                executablePath: resolveChromeExecutablePath(),
                maxConcurrentRoutes: 1,
                renderAfterDocumentEvent: 'prerender-ready',
                ...(process.platform === 'linux'
                  ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
                  : null),
              }),
            }),
          ]
          : []),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
