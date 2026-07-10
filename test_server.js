const http = require('http');
const fs = require('fs');
const path = require('path');

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

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
}

const handleApiRequests = (req, res, next) => {
  let urlPath = (req.url || '').split('?')[0];
  if (urlPath.includes('://')) {
    try {
      urlPath = new URL(urlPath).pathname;
    } catch (e) {}
  }
  urlPath = urlPath.replace(/\/$/, '');
  console.log('[DEBUG API] Method:', req.method, 'URL:', req.url, 'urlPath:', urlPath);
  
  if (urlPath.startsWith('/api/')) {
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
      req.on('data', (chunk) => { body += chunk; });
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
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const updatedConfig = {
            ...configData,
            ...updates,
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
      req.on('data', (chunk) => { body += chunk; });
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
      req.on('data', (chunk) => { body += chunk; });
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

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } else {
    next();
  }
};

const server = http.createServer((req, res) => {
  handleApiRequests(req, res, () => {
    res.statusCode = 404;
    res.end('Not found (fallback)');
  });
});

server.listen(5176, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:5176');
});
