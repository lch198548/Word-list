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

const handleApiRequests = (req: any, res: any, next: any) => {
  let urlPath = (req.url || '').split('?')[0];
  if (urlPath.includes('://')) {
    try {
      urlPath = new URL(urlPath).pathname;
    } catch (e) {}
  }
  urlPath = urlPath.replace(/\/$/, '');
  console.log('[DEBUG API] Method:', req.method, 'URL:', req.url, 'urlPath:', urlPath);
  
  if (urlPath.startsWith('/api/')) {
    if (urlPath.startsWith('/api/baidu-translate')) {
      next();
      return;
    }
    res.setHeader('Content-Type', 'application/json');

    // GET /api/wordbooks
    if (urlPath === '/api/wordbooks' && req.method === 'GET') {
      try {
        if (fs.existsSync(wordbooksPath)) {
          const data = fs.readFileSync(wordbooksPath, 'utf-8');
          res.end(data);
        } else {
          res.end(JSON.stringify([]));
        }
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to read wordbooks' }));
      }
      return;
    }

    // POST /api/wordbooks
    if (urlPath === '/api/wordbooks' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed)) {
            fs.writeFileSync(wordbooksPath, JSON.stringify(parsed, null, 2), 'utf-8');
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid data format' }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to write wordbooks' }));
        }
      });
      return;
    }

    // GET /api/config
    if (urlPath === '/api/config' && req.method === 'GET') {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        // Strip password for security when sending to frontend
        const { password, ...safeConfig } = configData;
        res.end(JSON.stringify(safeConfig));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to read config' }));
      }
      return;
    }

    // POST /api/config
    if (urlPath === '/api/config' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          
          // Merge updates, keeping the password intact
          const updatedConfig = {
            ...configData,
            ...updates,
            // Deep merge dictationSettings if provided
            dictationSettings: updates.dictationSettings 
              ? { ...configData.dictationSettings, ...updates.dictationSettings }
              : configData.dictationSettings
          };

          fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to update config' }));
        }
      });
      return;
    }

    // POST /api/login
    if (urlPath === '/api/login' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const { password } = JSON.parse(body);
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (configData.password === password) {
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ success: false, error: 'Incorrect password' }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Login failed' }));
        }
      });
      return;
    }

    // POST /api/change-password
    if (urlPath === '/api/change-password' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const { oldPassword, newPassword } = JSON.parse(body);
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (configData.password === oldPassword) {
            configData.password = newPassword;
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf-8');
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: '旧密码输入错误' }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: '修改密码失败' }));
        }
      });
      return;
    }

    // Default 404 for unmatched /api routes
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } else {
    next();
  }
};

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
      '/api': {
        target: 'https://wordlist.edgeone.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
