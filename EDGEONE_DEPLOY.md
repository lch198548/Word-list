# 腾讯云 EdgeOne Makers (Blob 存储) 部署与配置指南

本项目已全面适配 **腾讯云 EdgeOne Makers** 的 Serverless 边缘托管环境。
基于 EdgeOne 原生的 **EdgeOne Blob 存储** API，数据（单词本、配置、密码）会在**首次调用时自动创建并持久化存储，无需在控制台进行任何手动的命名空间创建和资源绑定配置。**

以下是极简的手动部署流程：

---

## 1. 本地打包编译

在您本地的项目根目录下，运行前端构建指令：

```bash
pnpm run build
```
*(该命令会完成 TypeScript 检查并生成 `dist` 静态资源目录)*。

---

## 2. 准备要上传的代码包

腾讯云 EdgeOne Makers 要求将边缘服务端的 API 代码放置于 **`edge-functions`** 文件夹中：

1. **将项目根目录下的 `edge-functions` 文件夹复制并粘贴到 `dist` 目录中**。
   - 复制完成后，确保 `dist` 内部结构如下：
     ```text
     dist/
       assets/
       edge-functions/  <-- 必须是这个名称！
         api/
           login.js
           change-password.js
           config.js
           wordbooks.js
           baidu-translate.js
       index.html
     ```
2. 将 `dist` 文件夹内部的**所有文件和文件夹（全选）**，压缩为一个 **`zip` 格式的压缩文件**（例如 `deploy-edgeone.zip`）。

---

## 3. 在 EdgeOne Makers 网页端部署上线

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)，进入 **EdgeOne -> Makers** 服务页。
2. 点击 **创建项目 (Create Project)** -> 选择 **直接上传**。
3. 输入您的项目名称（例如 `dictation-app`）。
4. **上传压缩包**：将刚才生成的 `deploy-edgeone.zip` 拖拽或上传到页面中。
5. 点击 **部署 (Deploy)**。

---

### 🎉 部署完成！
部署成功后，Makers 会为您生成一个默认的预览网址（如 `https://xxx.edgeone.site`）。
当您第一次访问网页并输入默认密码 `123` 登录时，EdgeOne 边缘函数会自动在后台创建所需的 Blob 存储空间并存入初始配置，您不需要做任何数据库或存储的额外绑定。直接即可开始使用！
