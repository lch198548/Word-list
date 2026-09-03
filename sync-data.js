import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ONLINE_URL = 'https://wordlist.edgeone.dev';

const wordbooksPath = path.resolve(__dirname, 'wordbooks.json');
const configPath = path.resolve(__dirname, 'config.json');

const wordbooksData = JSON.parse(fs.readFileSync(wordbooksPath, 'utf-8'));
const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('=== 本地数据 ===');
console.log('单词本数量:', wordbooksData.length);
const totalWords = wordbooksData.reduce((sum, book) => sum + book.words.length, 0);
console.log('单词总数:', totalWords);
console.log('密码:', configData.password);
console.log('');

console.log('=== 同步数据到线上 ===');
console.log('请在浏览器中打开开发者工具（F12），切换到控制台（Console），粘贴以下代码运行：');
console.log('');
console.log('// 同步单词本数据');
console.log('fetch("' + ONLINE_URL + '/api/wordbooks", {');
console.log('  method: "POST",');
console.log('  headers: { "Content-Type": "application/json" },');
console.log('  body: JSON.stringify(' + JSON.stringify(wordbooksData) + ')');
console.log('}).then(r => r.json()).then(console.log);');
console.log('');
console.log('// 同步配置数据');
console.log('fetch("' + ONLINE_URL + '/api/config", {');
console.log('  method: "POST",');
console.log('  headers: { "Content-Type": "application/json" },');
console.log('  body: JSON.stringify(' + JSON.stringify(configData) + ')');
console.log('}).then(r => r.json()).then(console.log);');
console.log('');
console.log('=== 运行说明 ===');
console.log('1. 先在浏览器中登录线上网站');
console.log('2. 打开开发者工具（F12）');
console.log('3. 切换到 Console 标签');
console.log('4. 分别复制粘贴上面两段代码运行');
console.log('5. 返回 {"success": true} 表示同步成功');