/**
 * 本地开发一站式启动：
 *  - 启动 server.js（API + 静态服务），监听 PORT（默认 8787）
 *  - 启动 vite 开发服务器（UI），并把 /api 代理到 8787
 * 这样 `npm run dev` 仍是单条命令，且所有接口都走本地，不再出现远端 401。
 *
 * 健壮性：若 8787 已被占用（如上一次未正确退出的残留进程，或本机已有 server.js 在跑），
 * 则直接复用该服务而不重复启动；vite 仍正常拉起，避免整条 dev 链路崩溃。
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteBin = path.resolve(__dirname, 'node_modules/vite/bin/vite.js');
const API_PORT = Number(process.env.PORT || 8787);

const children = [];

function spawnCmd(cmd, args, env, name) {
  // 注意：不要传 shell:true。在 Windows 下，shell 会把 cmd 中的空格（典型如
  // "C:\Program Files\nodejs\node.exe"）拆成多段命令，导致 'C:\Program' 不是
  // 内部或外部命令 的失败。本函数 cmd 是 process.execPath、args 是脚本绝对路径，
  // 不依赖 cmd.exe 解析，shell:false 反而更安全（同时消除 DEP0190 弃用警告）。
  const p = spawn(cmd, args, {
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: false,
  });
  p.on('exit', (code, signal) => {
    console.log(`[dev-server] ${name} exited (code=${code}, signal=${signal})`);
    if (name === 'server.js') {
      // server.js 退出：若 8787 仍被我们的 API 服务（可能是上一次残留）占据，则复用，不退出
      checkApiReady().then((ok) => {
        if (ok) {
          console.log('[dev-server] 检测到 :' + API_PORT + ' 已有 API 服务，复用既有服务，继续运行 vite');
        } else {
          shutdown();
        }
      });
    } else {
      // vite 退出则整条链路无意义，关闭全部
      shutdown();
    }
  });
  children.push(p);
  return p;
}

function checkApiReady() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${API_PORT}/api/config`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function shutdown() {
  for (const p of children) {
    try {
      p.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 先探测 8787 是否已有 API 服务在跑；有则复用，无则启动 server.js
checkApiReady().then((alreadyUp) => {
  if (alreadyUp) {
    console.log(`[dev-server] 检测到 :${API_PORT} 已有 API 服务，跳过启动 server.js`);
  } else {
    spawnCmd(process.execPath, [path.resolve(__dirname, 'server.js')], { PORT: String(API_PORT) }, 'server.js');
  }
  // 无论如何都启动 vite（UI）
  spawnCmd(process.execPath, [viteBin], {}, 'vite');
});
