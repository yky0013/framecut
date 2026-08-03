# Contributing to FrameCut

感谢你改进 FrameCut。当前项目仍处于 Beta 阶段，请优先提交范围清晰、可以独立验证的修改。

## 开发准备

1. 安装 Node.js 22、Git 和 Git LFS。
2. 执行 git lfs install 和 git lfs pull。
3. 执行 npm.cmd ci 安装锁定依赖。
4. 执行 npm.cmd run dev 启动开发环境。

## 提交前检查

~~~powershell
npm.cmd run check
npm.cmd run dist
~~~

涉及导出的修改还需要使用真实视频验证 FFmpeg 结果；涉及界面的修改需要检查 1040×720 最小窗口尺寸。

## Pull Request

- 一个 PR 只解决一个主题。
- 描述用户可见变化、验证方法和已知边界。
- UI 修改请附截图；导出修改请附成功日志或输出样例。
- 不要提交 node_modules、dist、release、日志或个人媒体文件。
- 新增大文件前先讨论，不要绕过 Git LFS。

## 模型与第三方代码

更新模型权重时必须记录来源、版本、许可证和校验值。引入新依赖前请检查其许可证与桌面分发兼容性。
