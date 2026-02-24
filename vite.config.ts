// @ts-nocheck
import path from 'path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
type VitePrerenderPlugin = (options: unknown) => unknown;
type VitePrerenderWithRenderer = VitePrerenderPlugin & {
  PuppeteerRenderer: new (options?: any) => { destroy: () => void };
};

let vitePrerender: VitePrerenderWithRenderer | null = null;
try {
  vitePrerender = require('vite-plugin-prerender') as VitePrerenderWithRenderer;
} catch {
  // prerender plugin not installed — skip
}

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

    const enablePrerender = vitePrerender && (env.PRERENDER || process.env.PRERENDER) === '1';

    let prerenderPlugins: unknown[] = [];
    if (enablePrerender && vitePrerender) {
      const Renderer = vitePrerender.PuppeteerRenderer;
      class SafePuppeteerRenderer extends Renderer {
        destroy() {
          const browser = (this as any)._puppeteer as { close?: () => void } | null | undefined;
          browser?.close?.();
        }
      }
      const prerenderHost = env.PRERENDER_HOST || process.env.PRERENDER_HOST || '127.0.0.1';
      const prerenderPort = Number(env.PRERENDER_PORT || process.env.PRERENDER_PORT || 4179);

      prerenderPlugins = [
        vitePrerender({
          staticDir: path.join(__dirname, 'dist'),
          routes: ['/', '/library', '/profile'],
          server: { host: prerenderHost, port: prerenderPort },
          renderer: new SafePuppeteerRenderer({
            executablePath: resolveChromeExecutablePath(),
            maxConcurrentRoutes: 1,
            renderAfterDocumentEvent: 'prerender-ready',
            ...(process.platform === 'linux'
              ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
              : null),
          }),
        }),
      ];
    }

    return {
      server: {
        port: 5173,
        host: env.VITE_DEV_HOST || '127.0.0.1',
        proxy: {
          '/api': {
            target: env.VITE_DEV_API || 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react(), ...prerenderPlugins],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      build: {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
    };
});
