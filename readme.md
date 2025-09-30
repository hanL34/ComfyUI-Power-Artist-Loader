# Power Artist Loader

一个为 ComfyUI 设计的自定义节点，可同时加载多个画师名称并智能组合到提示词中，支持独立权重控制和实时预览。

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![ComfyUI](https://img.shields.io/badge/ComfyUI-Compatible-green.svg)

## 特性

### 核心功能
- **多画师管理** - 动态添加/删除画师槽位，支持无限扩展
- **独立权重控制** - 每个画师 0.00-3.00 精确权重调节
- **悬停预览** - 鼠标悬停在下拉菜单即可预览画师风格图片和关键词
- **批量开关** - 一键启用/禁用所有画师
- **智能合并** - 自动格式化为 SD 权重语法：`(artist:1.2)`

### 界面特点
- 类 rgthree Power LoRA 风格设计
- 可视化开关和权重滑块
- 右键快捷菜单
- 支持画师名称区域内悬停预览

## 安装

### 方法 1: Git Clone
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/yourusername/ComfyUI-Power-Artist-Loader.git
cd ComfyUI-Power-Artist-Loader
pip install -r requirements.txt  # 如果有依赖
```

### 方法 2: ComfyUI Manager
1. 打开 ComfyUI Manager
2. 搜索 "Power Artist Loader"
3. 点击安装并重启

### 方法 3: 手动安装
1. 下载 [最新 Release](https://github.com/yourusername/ComfyUI-Power-Artist-Loader/releases)
2. 解压到 `ComfyUI/custom_nodes/`
3. 重启 ComfyUI

## 快速开始

### 基础工作流
```
Power Artist Loader → CLIP Text Encode (Positive) → KSampler
```

### 示例输出

**输入**：
- Base Text: `masterpiece, best quality, 1girl`
- Artist 1: Akira Toriyama (启用, 权重 1.2)
- Artist 2: Studio Ghibli (启用, 权重 0.8)

**输出**：
```
masterpiece, best quality, 1girl, (akira toriyama style, anime, dragon ball:1.20), (hayao miyazaki, studio ghibli, anime film:0.80)
```

## 使用说明

### 添加画师
1. 点击节点底部的 **➕ Add Artist** 按钮
2. 点击画师名称区域打开下拉菜单
3. 鼠标悬停可预览画师风格（需配置预览图）
4. 点击选择画师

### 调整权重
**方法 1**: 点击左右箭头按钮，每次 ±0.05  
**方法 2**: 点击数值区域，直接输入精确值  
**方法 3**: 在数值区域按住左键拖动调节

### 快捷操作
- **Toggle All** - 批量启用/禁用所有画师
- **右键菜单** - 快速设置常用权重值（0.5/1.0/1.5）
- **圆形开关** - 单个画师启用/禁用

## 自定义画师库

### CSV 格式
编辑 `artists.csv` 文件添加自定义画师：

```csv
画师名称,关键词,预览图文件名
Akira Toriyama,akira toriyama style anime dragon ball,toriyama.jpg
Your Artist,custom keywords here,custom.jpg
```

### 添加预览图
1. 将图片放入 `images/` 目录
2. 图片命名与 CSV 中的文件名一致
3. 推荐尺寸：200-400px 宽度，JPG/PNG 格式

### 动态重载
修改 CSV 后刷新浏览器页面（F5），无需重启 ComfyUI。

## 高级功能

### API 端点
```python
# 获取画师列表
GET /power_artist_loader/artists

# 获取预览图
GET /power_artist_loader/preview/{image_name}
```

### 节点输入
```python
{
    "text": "基础提示词（可选）",
    "artist_1": {
        "on": true,
        "artist": "Akira Toriyama",
        "strength": 1.2
    }
}
```

### 节点输出
```python
return ("combined_prompt_text",)
```

## 文件结构

```
ComfyUI-Power-Artist-Loader/
├── __init__.py                 # 节点注册入口
├── nodes.py                    # 后端逻辑和 API
├── artists.csv                 # 画师数据库
├── images/                     # 预览图目录
│   ├── toriyama.jpg
│   └── ...
├── web/
│   └── js/
│       └── power_artist_loader.js  # 前端交互
└── README.md
```

## 故障排除

### 节点未出现
- 检查文件路径：`ComfyUI/custom_nodes/ComfyUI-Power-Artist-Loader/`
- 查看控制台是否有报错信息
- 尝试清除浏览器缓存后刷新

### 预览图不显示
- 确认图片在 `images/` 目录
- 检查 CSV 中文件名是否匹配
- 浏览器 F12 查看 404 错误

### 权重不生效
- 确保权重值不是默认的 1.00
- 检查输出文本格式是否正确
- 验证 CLIP 节点是否正确解析权重语法

### JavaScript 错误
```bash
# 浏览器 F12 控制台查看错误
# 常见问题：
# - 文件路径错误 → 检查 web/js/ 目录
# - API 404 → 检查后端 API 路由
# - 语法错误 → 验证 JS 代码完整性
```

## 已知限制

- 单节点最多建议 20 个画师槽位（性能考虑）
- 预览图需手动准备，不自动下载
- 权重范围 0.00-3.00（可修改代码调整）
- 不支持画师名称中的特殊字符（如 `:` `(` `)`）

## 开发计划

- [ ] 画师搜索/过滤功能
- [ ] 分类折叠显示
- [ ] 预设组合保存/加载
- [ ] 自动从 Civitai 获取画师信息
- [ ] 拖拽排序
- [ ] 导出为独立提示词文件
- [ ] 多语言界面

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交 Bug
- 使用 [Bug Report 模板](.github/ISSUE_TEMPLATE/bug_report.md)
- 提供完整的错误信息和复现步骤
- 附上 ComfyUI 版本和系统信息

### 提交新功能
- 先在 Discussions 讨论方案
- Fork 仓库并创建功能分支
- 遵循现有代码风格
- 添加必要的测试和文档

### 添加画师
1. 编辑 `artists.csv`
2. 按分类排序
3. 提供准确的关键词
4. 如有预览图一并提交

## 技术栈

- **后端**: Python 3.8+, aiohttp
- **前端**: JavaScript (ES6+), LiteGraph
- **UI**: 自定义 Canvas 渲染
- **风格**: 参考 rgthree-comfy 设计

## 许可证

MIT License - 详见 [LICENSE](./LICENSE)

## 致谢

- [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) - 设计灵感来源
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - 强大的 SD 工作流平台
- 所有贡献者和使用者的反馈

## 支持

- **文档**: [Wiki](https://github.com/yourusername/ComfyUI-Power-Artist-Loader/wiki)
- **讨论**: [Discussions](https://github.com/yourusername/ComfyUI-Power-Artist-Loader/discussions)
- **问题**: [Issues](https://github.com/yourusername/ComfyUI-Power-Artist-Loader/issues)

---

如果这个项目对你有帮助，请给个 ⭐ Star！
