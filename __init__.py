"""
Power Artist Loader - ComfyUI Custom Node
"""

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# 导出节点映射供ComfyUI使用
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

# 版本信息
__version__ = "1.0.6"
__author__ = "hanL"
__description__ = "Power Artist Loader for ComfyUI - Load multiple artists into prompt text"

# 可选：添加web目录信息供前端使用
WEB_DIRECTORY = "./web"

# 可选：在导入时打印信息
print(f"🎨 Loading Power Artist Loader v{__version__}")
print(f"📁 Web directory: {WEB_DIRECTORY}")

print(f"✅ Registered {len(NODE_CLASS_MAPPINGS)} nodes")

