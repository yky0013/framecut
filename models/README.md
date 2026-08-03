# 离线语音识别模型

FrameCut 随应用打包 `onnx-community/whisper-base` 的量化 ONNX 权重，以便在无网络环境中执行语音转字幕。上游模型页面：<https://huggingface.co/onnx-community/whisper-base>。

模型目录保留上游 `MODEL_CARD.md` 与 `LICENSE`。模型文件使用 Git LFS 管理：

~~~powershell
git lfs install
git lfs pull
git lfs ls-files
~~~

## 当前权重校验

| 文件 | 大小（字节） | SHA-256 |
| --- | ---: | --- |
| `decoder_model_merged_quantized.onnx` | 53,693,315 | `fa3ef9902734ce5ae6f9ef2bdb2ba9a6c4b5785b09f4f420ce036573dc9d090b` |
| `encoder_model_quantized.onnx` | 23,201,314 | `5862993336bf33acd23736071aae2b32261d3b1b2f37780194460d4ef974dd46` |

可在 PowerShell 中重新计算：

~~~powershell
Get-ChildItem models -Recurse -Filter *.onnx | Get-FileHash -Algorithm SHA256
~~~

更新模型时必须同步检查 Transformers.js 兼容性、模型许可证、应用体积、推理速度和本文件中的校验值。
