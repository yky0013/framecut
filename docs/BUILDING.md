# 构建指南

## 环境要求

- Windows 10/11 x64
- Node.js 22 LTS
- Git 与 Git LFS
- 建议至少 8 GB 内存和 3 GB 可用磁盘空间

## 首次安装

~~~powershell
git lfs install
git clone <仓库 HTTPS 地址>
cd FrameCut
git lfs pull
npm.cmd ci
~~~

确认以下两个 ONNX 文件不是 Git LFS 指针文本：

~~~powershell
Get-ChildItem models -Recurse -Filter *.onnx | Select-Object Name, Length
~~~

两份权重总大小应超过 70 MB。模型来源和校验值见 [模型说明](../models/README.md)。

## 开发与检查

~~~powershell
npm.cmd run dev
npm.cmd run check
~~~

`npm.cmd run check` 会检查 Electron 脚本语法并构建渲染进程。

## 生成安装包

~~~powershell
npm.cmd run dist
~~~

NSIS 安装包生成在 `release/`。该目录被 Git 忽略，不应提交到仓库。

当前配置未使用商业代码签名证书，因此安装时 Windows 可能显示未知发布者。签名前应保护证书私钥，并只通过 GitHub Actions Secrets 或受控签名服务传递凭据。

## 常见问题

- 模型只有几百字节：运行 `git lfs pull`，再检查 Git LFS 是否安装。
- `npm ci` 报锁文件不一致：先确认没有手工修改依赖；确需升级时运行 `npm.cmd install` 并提交新的锁文件。
- 导出失败：确认临时目录有足够空间，并使用可正常解码的 MP4、MOV、MKV 或 WebM 测试。
- 安装包体积较大：应用包含 Electron、FFmpeg 和离线 Whisper 权重，这是当前离线方案的预期结果。
