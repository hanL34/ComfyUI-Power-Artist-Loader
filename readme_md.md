# Power Artist Loader

一个为ComfyUI设计的自定义节点，类似于Power LoRA Loader，但专门用于加载画师名字并输出为字符串用于提示词。

![Power Artist Loader](https://via.placeholder.com/600x300/2a2a2a/ffffff?text=Power+Artist+Loader+Demo)

## ✨ 特性

- 🎨 **多画师支持**: 同时加载多个画师名字
- ⚡ **动态添加**: 点击按钮即可添加更多画师槽位
- 🎛️ **权重控制**: 每个画师独立的权重设置(0.0-2.0)
- 🔄 **开关控制**: 每个画师可独立启用/禁用
- 📝 **智能合并**: 自动将画师名字合并到提示词
- 🖱️ **右键菜单**: 移动、删除、快速切换等操作
- 📚 **丰富画师库**: 内置100+知名画师，涵盖各个领域

## 📦 安装

### 方法1: 手动安装

1. 下载或克隆此仓库到ComfyUI的`custom_nodes`目录：
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/你的用户名/ComfyUI-Power-Artist-Loader.git
```

2. 重启ComfyUI

### 方法2: ComfyUI Manager

1. 打开ComfyUI Manager
2. 搜索"Power Artist Loader"
3. 点击安装并重启ComfyUI

## 🚀 快速开始

1. **添加节点**: 在ComfyUI中搜索"Power Artist Loader"
2. **选择画师**: 从下拉菜单选择想要的画师
3. **启用画师**: 勾选对应的开关
4. **调整权重**: 使用滑块调整影响强度
5. **连接输出**: 将文本输出连接到CLIP Text Encode等节点

## 📖 使用说明

### 基本操作

```
Power Artist Loader → CLIP Text Encode → KSampler
```

### 输出格式示例

- 基础: `"Akira Toriyama, Hayao Miyazaki"`
- 带权重: `"(Akira Toriyama:1.2), (Studio Ghibli:0.8)"`
- 合并文本: `"your prompt, Akira Toriyama, Hayao Miyazaki"`

### 右键菜单

在画师下拉菜单上右键：
- 🔼 **Move Up/Down**: 调整槽位顺序
- ✅ **Enable/Disable**: 快速切换启用状态  
- 🗑️ **Delete**: 删除当前槽位

## 🎨 内置画师分类

### 日本动漫/漫画 🎌
Akira Toriyama, Hayao Miyazaki, Kentaro Miura, Junji Ito...

### 游戏艺术家 🎮
Yoshitaka Amano, Yoji Shinkawa, Tetsuya Nomura...

### 数字艺术家 💻  
Greg Rutkowski, Artgerm, WLOP, Sakimichan...

### 传统艺术大师 🎨
Leonardo da Vinci, Vincent van Gogh, Pablo Picasso...

### 工作室/风格 🏢
Studio Ghibli, Disney Animation, Pixar, Art Nouveau...

[查看完整画师列表](./artists.json)

## ⚙️ 自定义配置

### 添加自定义画师

编辑 `artists.json` 文件：

```json
{
    "artists": [
        "None",
        "___ 我的分类 ___",
        "我的画师1",
        "我的画师2"
    ]
}
```

### 配置选项

- **权重范围**: 在代码中可修改权重范围
- **默认状态**: 可设置新添加画师的默认启用状态
- **显示格式**: 可自定义权重的显示格式

## 🔧 开发

### 文件结构

```
ComfyUI-Power-Artist-Loader/
├── __init__.py              # 节点注册
├── nodes.py                 # 主要Python逻辑
├── artists.json             # 画师数据
├── web/js/
│   └── power_artist_loader.js  # 前端JavaScript
├── README.md
└── LICENSE
```

### 本地开发

1. Fork并克隆仓库
2. 修改代码
3. 在ComfyUI中测试
4. 提交Pull Request

## 🐛 故障排除

### 常见问题

**Q: 节点不显示**
A: 检查文件是否在正确路径，重启ComfyUI

**Q: JavaScript错误**  
A: 检查浏览器F12控制台，清除缓存

**Q: 画师列表为空**
A: 检查artists.json文件格式和编码

**Q: 权重不生效**
A: 确认权重值不为1.0，检查输出格式

### 调试方法

1. **Python错误**: 查看ComfyUI控制台输出
2. **前端错误**: 打开浏览器开发者工具
3. **数据问题**: 验证JSON文件格式

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 贡献方式

- 🐛 **报告Bug**: [创建Issue](https://github.com/你的用户名/ComfyUI-Power-Artist-Loader/issues)
- 💡 **功能建议**: [讨论区](https://github.com/你的用户名/ComfyUI-Power-Artist-Loader/discussions)
- 🔧 **代码贡献**: Fork并提交Pull Request
- 🎨 **添加画师**: 编辑artists.json并提交PR

### 开发路线图

- [ ] 画师搜索功能
- [ ] 分类筛选器  
- [ ] 预设组合保存
- [ ] 画师预览图
- [ ] 导入/导出功能
- [ ] 使用统计
- [ ] 多语言支持

## 📄 许可证

[MIT License](./LICENSE) - 可自由使用、修改和分发

## 🙏 致谢

- 灵感来自 [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) 的 Power LoRA Loader
- 感谢ComfyUI社区的支持和反馈
- 画师列表参考了各大艺术平台和社区贡献

## 📊 统计

![GitHub stars](https://img.shields.io/github/stars/你的用户名/ComfyUI-Power-Artist-Loader?style=social)
![GitHub forks](https://img.shields.io/github/forks/你的用户名/ComfyUI-Power-Artist-Loader?style=social)
![GitHub issues](https://img.shields.io/github/issues/你的用户名/ComfyUI-Power-Artist-Loader)
![GitHub license](https://img.shields.io/github/license/你的用户名/ComfyUI-Power-Artist-Loader)

---

**Happy Prompting! 🎨✨**

如果这个项目对你有帮助，请给个⭐Star支持一下！