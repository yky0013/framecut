# GitHub 首次上传

项目已采用 `main` 分支，并用 Git LFS 管理 ONNX 权重。首次上传前需要在 GitHub 新建一个空仓库，不要勾选自动创建 README、`.gitignore` 或许可证。

## 1. 设置提交身份

请替换为你自己的 GitHub 显示名和已验证邮箱：

~~~powershell
git config user.name "你的名字"
git config user.email "你的邮箱"
~~~

如果不想公开真实邮箱，可使用 GitHub 提供的 noreply 邮箱。

## 2. 检查并提交

~~~powershell
git status
git lfs ls-files
git commit -m "feat: publish FrameCut 0.3.0 beta"
~~~

## 3. 关联仓库并推送

~~~powershell
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
~~~

推送 LFS 对象需要网络和 GitHub LFS 存储额度。首次推送后，请在 Actions 页面确认 `Windows build` 成功。

## 4. 修正模板链接

把 `.github/ISSUE_TEMPLATE/config.yml` 中的 `OWNER/REPOSITORY` 替换为实际仓库路径，然后提交。

## 5. 发布安装包

确认测试完成、版本号与更新日志无误后，按 [发布指南](RELEASING.md) 推送版本标签。安装包应放在 GitHub Release，而不是提交进 Git 历史。
