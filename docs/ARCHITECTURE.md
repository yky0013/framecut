# 架构说明

FrameCut 采用 Electron + React + FFmpeg 的本地桌面结构。

~~~text
React 渲染进程
  ├─ 视频预览、时间范围、字幕、特效和模板状态
  └─ 通过受限 preload API 发起任务
                  │ IPC
Electron 主进程 ─┼─ 文件选择、SRT 读写和任务调度
                  ├─ FFmpeg 视频导出
                  └─ utilityProcess 离线 Whisper 转写
~~~

## 主要目录

- `src/`：用户界面、编辑状态、字幕预览、教程和样式。
- `electron/main.cjs`：窗口生命周期、文件访问、导出与转写任务。
- `electron/preload.cjs`：向渲染进程暴露白名单 API。
- `electron/transcribe-worker.cjs`：在独立进程加载 Transformers.js 与 Whisper ONNX 模型。
- `models/`：随应用打包的离线 Whisper Base 模型。

## 数据流程

1. 用户选择本地视频，渲染进程仅持有预览 URL 和编辑参数。
2. 导出时，渲染进程把裁剪范围、滤镜、淡入淡出及字幕传给主进程。
3. 主进程生成 FFmpeg 参数并导出 H.264/AAC MP4。
4. 语音转字幕时，主进程先提取音频，再由独立工作进程执行本地推理并返回字幕片段。

## 安全边界

窗口启用上下文隔离，禁用渲染进程 Node.js 集成，并通过 preload 暴露最小 IPC 接口。新增 IPC 时应同时校验参数类型、文件路径和任务生命周期；不要把通用文件系统或命令执行能力直接暴露给网页上下文。

## 当前范围

架构目前围绕单视频、单时间范围设计。多轨编辑、素材库和关键帧需要独立的项目文档格式、非破坏性时间线模型以及可取消的渲染任务队列，不宜直接堆叠在当前组件状态上。
