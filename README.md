[README.md](https://github.com/user-attachments/files/30641539/README.md)
# FrameCut

FrameCut 是一款面向 Windows 的本地桌面视频剪辑器。它聚焦单视频快速裁剪、视觉特效、成片模板和离线语音转字幕；媒体文件与语音识别都在本机处理。

> 当前版本：0.3.0 Beta · Windows 10/11 x64 · 本地优先 · 离线 Whisper

## 主要功能

- 本地视频导入、实时预览、播放、跳转与音量控制
- 拖动入点和出点，精确选择保留片段
- 电影感、鲜亮、暖阳、清冷、黑白和复古胶片特效
- 特效强度、片头淡入和片尾淡出控制
- 六套一键风格模板，联动画面、淡化与字幕外观
- 手动字幕编辑、SRT 导入导出、字幕时间轴与预览
- 内置 Whisper Base ONNX 模型，离线语音转字幕
- 经典白、活力黄、霓虹青和电影底条字幕样式
- 使用内置 FFmpeg 导出 H.264/AAC MP4 并烧录字幕
- 内置八步图文使用教程

## 图文使用教程

![FrameCut 导入视频教程](docs/images/tutorial/01-import.png)

从导入视频到导出成片的完整八步说明，见 [FrameCut 图文使用教程](docs/TUTORIAL.md)。应用内也可点击右上角“帮助”，随时打开同一套教程。

## 获取安装包

正式上传 GitHub 后，请在仓库的 **Releases** 页面下载 FrameCut Setup x.y.z.exe。安装包不提交到 Git 历史，由 Release 工作流自动构建和发布。

当前测试版尚未配置商业代码签名证书，Windows 可能显示“未知发布者”。

## 开发环境

- Windows 10/11 x64
- Node.js 22
- Git 2.40+
- Git LFS 3+

~~~powershell
git lfs install
git clone <你的仓库地址>
cd FrameCut
npm.cmd ci
npm.cmd run dev
~~~

仓库使用 Git LFS 保存 Whisper ONNX 权重。克隆后如果 models/**/*.onnx 只是很小的文本指针，请执行：

~~~powershell
git lfs pull
~~~

## 构建 Windows 安装包

~~~powershell
npm.cmd run check
npm.cmd run dist
~~~

安装包会生成到 release 文件夹。完整环境说明见 [构建指南](docs/BUILDING.md)，首次上传见 [GitHub 上传指南](docs/GITHUB_UPLOAD.md)，版本发布见 [发布指南](docs/RELEASING.md)。

## 项目结构

~~~text
FrameCut/
├─ electron/          Electron 主进程、预加载脚本与转写工作进程
├─ models/            Whisper Base ONNX 模型（Git LFS）
├─ src/               React 界面、字幕、特效和模板
├─ test-fixtures/     烟雾测试素材与脚本
├─ docs/              构建、架构与发布文档
└─ .github/           CI、Release、Issue 与 Dependabot 配置
~~~

更多实现说明见 [架构文档](docs/ARCHITECTURE.md)。

## 隐私

FrameCut 不需要账号。视频、音频和 Whisper 推理均保留在本机；软件不会主动上传媒体文件。

## 当前边界

当前仍是单视频、单轨版本。多轨拼接、素材库、转场时间轴、关键帧、撤销/重做和说话人分离尚未实现。

## 贡献与安全

提交代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 的非公开流程报告。

## 许可证

项目代码目前标记为 UNLICENSED，尚未授予公开复制、修改或再分发许可。准备公开仓库前，请由仓库所有者选择合适的代码许可证。第三方组件与模型保留各自许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
