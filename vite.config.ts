import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordbooksPath = path.resolve(__dirname, 'wordbooks.json');
const configPath = path.resolve(__dirname, 'config.json');

const defaultConfig = {
  password: '123',
  baiduAppId: '20240607002071839',
  baiduKey: 'EER6yOohPC_NtHszZs2G',
  exportDelimiter: '        ',
  dictationSettings: {
    mode: 'chinese',
    repeatCount: 2,
    interval: 3,
    speed: 'medium',
    type: 'online'
  }
};

// Initialize config.json if not present
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
}

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      // 本地开发：所有 /api 转发到同机运行的 server.js（端口 8787），
      // 由它提供 tts / dictionary / baidu-translate / wordbooks / config / login 等全部接口，
      // 避免代理到旧远端 wordlist.edgeone.dev 导致的 401。
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
