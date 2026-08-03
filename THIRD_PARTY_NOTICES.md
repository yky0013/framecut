# Third-Party Notices

FrameCut 依赖或分发以下主要第三方组件。此清单用于归档直接依赖和随包模型，不替代各组件的完整许可证文本。

| Component | Version | License | Purpose |
| --- | ---: | --- | --- |
| Electron | 33.4.11 | MIT | Desktop runtime |
| React / React DOM | 18.3.1 | MIT | User interface |
| Vite | 6.4.3 | MIT | Frontend build |
| Lucide React | 0.468.0 | ISC | Interface icons |
| Transformers.js | 3.8.1 | Apache-2.0 | Local Whisper inference |
| ffmpeg-static | 5.3.0 | GPL-3.0-or-later | Bundled video encoder/decoder |
| Whisper Base ONNX | bundled snapshot | See model LICENSE | Offline speech recognition |

模型文件及其许可证位于 models/onnx-community/whisper-base/。npm 依赖的许可证文件位于安装后的各自 node_modules/<package>/ 目录。

发布或重新分发安装包之前，仓库所有者应自行确认 FFmpeg 构建配置、代码许可证选择和所有第三方许可证义务。
