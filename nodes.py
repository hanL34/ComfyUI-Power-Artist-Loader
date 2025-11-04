import json
import os
import csv
from typing import Dict, List, Tuple, Any
from aiohttp import web
import aiofiles
from server import PromptServer

class PowerArtistLoader:
    """
    Power Artist Loader Node - 修复版本
    """
    
    def __init__(self):
        self.artists_data = {}
        self.load_artists_data()
    
    def load_artists_data(self):
        """从CSV文件加载画师数据 - 使用分号分隔"""
        # ⭐ 关键修复：每次重新加载前先清空字典
        self.artists_data = {}
        
        csv_path = os.path.join(os.path.dirname(__file__), "artists.csv")
        
        if os.path.exists(csv_path):
            try:
                with open(csv_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        
                        # 使用分号分隔：标题;keywords;图片
                        parts = line.split(';')
                        if len(parts) >= 2:
                            name = parts[0].strip()
                            keywords = parts[1].strip()
                            image = parts[2].strip() if len(parts) > 2 else None
                            
                            self.artists_data[name] = {
                                'keywords': keywords,
                                'image': image
                            }
                
                print(f"Loaded {len(self.artists_data)} artists from CSV")
                
            except Exception as e:
                print(f"Error loading artists.csv: {e}")
                self.load_default_artists()
        else:
            # 创建示例CSV文件
            self.create_example_csv(csv_path)
            self.load_default_artists()
    
    def create_example_csv(self, csv_path):
        """创建示例CSV文件 - 使用分号分隔"""
        example_data = [
            "Akira Toriyama;akira toriyama style, anime, dragon ball;toriyama.jpg",
            "Hayao Miyazaki;hayao miyazaki, studio ghibli, anime film;miyazaki.jpg",
            "Greg Rutkowski;greg rutkowski, artstation, fantasy art;rutkowski.jpg",
            "厚涂风格;(WLOP:0.5), (Pablo Picasso:0.8), (Greg Rutkowski:1.1);houtu.jpg",
            "Vincent van Gogh;vincent van gogh, post-impressionism, swirling brushstrokes;vangogh.jpg",
            "Leonardo da Vinci;leonardo da vinci, renaissance, sfumato technique;davinci.jpg"
        ]
        
        try:
            with open(csv_path, 'w', encoding='utf-8') as f:
                for line in example_data:
                    f.write(line + '\n')
            print(f"Created example CSV file: {csv_path}")
        except Exception as e:
            print(f"Error creating example CSV: {e}")
    
    def load_default_artists(self):
        """加载默认画师数据"""
        self.artists_data = {
            "Akira Toriyama": {"keywords": "akira toriyama style, anime, dragon ball", "image": "toriyama.jpg"},
            "Hayao Miyazaki": {"keywords": "hayao miyazaki, studio ghibli, anime film", "image": "miyazaki.jpg"},
            "Greg Rutkowski": {"keywords": "greg rutkowski, artstation, fantasy art", "image": "rutkowski.jpg"}
        }
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {},
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO", 
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "load_artists"
    CATEGORY = "conditioning"
    DESCRIPTION = "Load multiple artists and output keywords"

    def load_artists(self, text="", prompt=None, extra_pnginfo=None, unique_id=None):
        """处理画师加载逻辑，输出keywords"""
        
        # ⭐ 关键修复：每次执行前重新加载CSV，确保获取最新数据
        self.load_artists_data()
        
        enabled_keywords = []
        
        if prompt and unique_id:
            node_data = prompt.get(str(unique_id), {})
            inputs = node_data.get("inputs", {})
            
            # 处理artist widgets数据
            for key, value in inputs.items():
                if key.startswith("artist_") and isinstance(value, dict):
                    enabled = value.get("on", False)
                    artist_name = value.get("artist", "None") 
                    weight = value.get("strength", 1.0)
                    
                    if enabled and artist_name != "None":
                        # 获取画师的keywords
                        artist_data = self.artists_data.get(artist_name)
                        if artist_data:
                            keywords = artist_data.get("keywords", artist_name)
                        else:
                            # fallback到画师名
                            keywords = artist_name
                        
                        # 移除开头的空格
                        keywords = keywords.strip()
                        
                        if weight != 1.0:
                            # 格式化权重
                            weight_str = f"{weight:.2f}"
                            enabled_keywords.append(f"({keywords}:{weight_str})")
                        else:
                            enabled_keywords.append(keywords)
        
        # 组合最终文本
        result_text = text.strip() if text else ""
        
        if enabled_keywords:
            # 先组合，然后统一处理空格
            keywords_text = ", ".join(enabled_keywords)
            # 移除逗号后的空格：", " -> ","
            keywords_text = keywords_text.replace(", ", ",")
            
            if result_text:
                result_text = f"{result_text},{keywords_text}"
            else:
                result_text = keywords_text
        
        return (result_text,)

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    @classmethod 
    def VALIDATE_INPUTS(cls, **kwargs):
        return True


# 全局实例
power_artist_loader_instance = PowerArtistLoader()

# API路由
@PromptServer.instance.routes.get("/power_artist_loader/artists")
async def get_artists(request):
    """获取画师列表API"""
    try:
        # 每次请求时重新加载 CSV
        power_artist_loader_instance.load_artists_data()
        
        artists_list = []
        for name, data in power_artist_loader_instance.artists_data.items():
            artists_list.append({
                'name': name,
                'keywords': data.get('keywords', ''),
                'image': data.get('image', None)
            })
        
        return web.json_response({
            'artists': artists_list
        })
    except Exception as e:
        return web.json_response({
            'error': str(e)
        }, status=500)

@PromptServer.instance.routes.get("/power_artist_loader/preview/{image_name}")
async def get_preview_image(request):
    """获取预览图片API"""
    try:
        image_name = request.match_info['image_name']
        images_path = os.path.join(os.path.dirname(__file__), "images")
        image_path = os.path.join(images_path, image_name)
        
        if os.path.exists(image_path):
            return web.FileResponse(image_path)
        else:
            return web.Response(status=404)
    except Exception as e:
        return web.Response(status=404)

@PromptServer.instance.routes.get("/power_artist_loader/csv/read")
async def read_csv(request):
    """读取CSV文件内容API"""
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "artists.csv")
        artists = []
        
        if os.path.exists(csv_path):
            async with aiofiles.open(csv_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                for line in content.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    
                    parts = line.split(';')
                    if len(parts) >= 2:
                        artists.append({
                            'name': parts[0].strip(),
                            'keywords': parts[1].strip(),
                            'image': parts[2].strip() if len(parts) > 2 else ''
                        })
        
        return web.json_response({
            'success': True,
            'artists': artists
        })
    except Exception as e:
        return web.json_response({
            'success': False,
            'error': str(e)
        }, status=500)

@PromptServer.instance.routes.post("/power_artist_loader/csv/save")
async def save_csv(request):
    """保存CSV文件API"""
    try:
        data = await request.json()
        artists = data.get('artists', [])
        
        csv_path = os.path.join(os.path.dirname(__file__), "artists.csv")
        
        # 构建CSV内容
        lines = []
        for artist in artists:
            name = artist.get('name', '').strip()
            keywords = artist.get('keywords', '').strip()
            image = artist.get('image', '').strip()
            
            if name:  # 只保存有名字的行
                lines.append(f"{name};{keywords};{image}")
        
        # 写入文件
        async with aiofiles.open(csv_path, 'w', encoding='utf-8') as f:
            await f.write('\n'.join(lines))
        
        # 重新加载数据到内存
        power_artist_loader_instance.load_artists_data()
        
        return web.json_response({
            'success': True,
            'message': f'Saved {len(lines)} artists'
        })
    except Exception as e:
        return web.json_response({
            'success': False,
            'error': str(e)
        }, status=500)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "PowerArtistLoader": PowerArtistLoader
}

# 节点显示名映射  
NODE_DISPLAY_NAME_MAPPINGS = {
    "PowerArtistLoader": "Power Artist Loader"
}

# 导出所需的变量
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
