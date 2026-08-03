# 发布指南

仓库包含两个工作流：

- `Windows build`：main 分支和拉取请求上执行检查、打包并保存短期构建产物。
- `Release Windows`：推送 `v*` 标签后构建安装包，生成 SHA-256，并创建 GitHub 预发行版。

## 发布前检查

1. 更新 `package.json` 版本。
2. 在 `CHANGELOG.md` 中写明用户可见变化。
3. 运行 `npm.cmd ci`、`npm.cmd run check` 和 `npm.cmd run dist`。
4. 安装并验证生成的 EXE，至少测试导入、裁剪、字幕、转写和导出。
5. 确认仓库没有安装包、私密素材、令牌或签名证书。

## 创建版本

以下示例要求标签与 `package.json` 版本完全一致：

~~~powershell
git tag -a v0.3.0 -m "FrameCut 0.3.0"
git push origin v0.3.0
~~~

标签推送后，GitHub Actions 会创建预发行版并附加安装包及 `SHA256SUMS.txt`。在 Releases 页面完成人工测试后，可将其改为正式版本。

## 回滚

如果工作流构建失败，不要重复使用已经公开的标签。修复后提升补丁版本并创建新标签。若错误版本已经发布，可先在 Releases 页面标记说明或删除该 Release；是否删除对应 Git 标签应根据是否已有用户依赖该版本谨慎决定。
