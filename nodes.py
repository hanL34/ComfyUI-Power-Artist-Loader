import json
import os
import csv
from typing import Dict, List, Tuple, Any

class PowerArtistLoader:
    """
    Power Artist Loader Node - 支持CSV数据和keywords输出
    """
    
    def __init__(self):
        self.artists_data = {}
        self.load_artists_data()
    
    def load_artists_data(self):
        """从CSV文件加载画师数据"""
        csv_path = os.path.join(os.path.dirname(__file__), "artists.csv")
        
        if os.path.exists(csv_path):
            try:
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) >= 2:  # 至少有画师名和关键词
                            name = row[0].strip()
                            keywords = row[1].strip()
                            image = row[2].strip() if len(row) > 2 else None
                            
                            self.artists_data[name] = {
                                'keywords': keywords,
                                'image': image
                            }
                
                print(f"🎨 Loaded {len(self.artists_data)} artists from CSV")
                
            except Exception as e:
                print(f"Error loading artists.csv: {e}")
                self.load_default_artists()
        else:
            # 如果没有CSV文件，创建示例文件
            self.create_example_csv(csv_path)
            self.load_default_artists()
    
    def create_example_csv(self, csv_path):
        """创建示例CSV文件"""
        example_data = [
            ["Akira Toriyama", "akira toriyama, dragon ball style, anime", "toriyama.jpg"],
            ["Hayao Miyazaki", "hayao miyazaki, studio ghibli, miyazaki", "miyazaki.jpg"],
            ["Greg Rutkowski", "greg rutkowski, artstation, fantasy art", "rutkowski.jpg"],
            ["Vincent van Gogh", "vincent van gogh, post-impressionism, swirling brushstrokes", "vangogh.jpg"],
            ["Leonardo da Vinci", "leonardo da vinci, renaissance, sfumato technique", "davinci.jpg"]
        ]
        
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                for row in example_data:
                    writer.writerow(row)
            print(f"Created example CSV file: {csv_path}")
        except Exception as e:
            print(f"Error creating example CSV: {e}")
    
    def load_default_artists(self):
        """加载默认画师数据"""
        self.artists_data = {
            "Akira Toriyama": {"keywords": "akira toriyama, dragon ball style, anime", "image": None},
            "Hayao Miyazaki": {"keywords": "hayao miyazaki, studio ghibli, miyazaki", "image": None},
            "Greg Rutkowski": {"keywords": "greg rutkowski, artstation, fantasy art", "image": None}
        }
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {
                "text": ("STRING", {
                    "default": "", 
                    "multiline": True, 
                    "placeholder": "Optional base prompt..."
                }),
            },
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
    DESCRIPTION = "Load multiple artists and combine into prompt text with keywords"

    def load_artists(self, text="", prompt=None, extra_pnginfo=None, unique_id=None):
        """处理画师加载逻辑，输出keywords而不是画师名"""
        
        enabled_artists = []
        
        if prompt and unique_id:
            node_data = prompt.get(str(unique_id), {})
            inputs = node_data.get("inputs", {})
            
    def load_artists(self, text="", prompt=None, extra_pnginfo=None, unique_id=None):
        """处理画师加载逻辑，输出keywords而不是画师名"""
        
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
                            # 如果没有找到数据，使用画师名作为fallback
                            keywords = artist_name
                        
                        if weight != 1.0:
                            # 格式化权重
                            if weight == int(weight):
                                weight_str = str(int(weight))
                            else:
                                weight_str = f"{weight:.1f}"
                            enabled_keywords.append(f"({keywords}:{weight_str})")
                        else:
                            enabled_keywords.append(keywords)
        
        # 组合最终文本
        result_text = text.strip() if text else ""
        
        if enabled_keywords:
            keywords_text = ", ".join(enabled_keywords)
            if result_text:
                result_text = f"{result_text}, {keywords_text}"
            else:
                result_text = keywords_text
        
        return (result_text,)

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    @classmethod 
    def VALIDATE_INPUTS(cls, **kwargs):
        return True


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