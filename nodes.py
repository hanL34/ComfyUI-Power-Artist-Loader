import json
import os
import csv
import random
import time
import numpy as np
from PIL import Image
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


class RandomArtistString:
    @classmethod
    def INPUT_TYPES(cls):
        names = cls._get_artist_options()
        return {
            "required": {
                "preselectName": ("STRING", {"default": "", "multiline": False, "tooltip": "Multi-select: comma-separated main names"}),
                "excludeName": ("STRING", {"default": "", "multiline": False, "tooltip": "Multi-select: comma-separated names to exclude"}),
                "targetCount": ("INT", {"default": 3, "min": 1, "max": 20, "step": 1, "tooltip": "Final output count (1-20)"}),
                "mode": (["Standard", "Weighted", "Bracket"], {"default": "Standard", "tooltip": "Output formatting mode"}),
                "standardWeightMin": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 2.0, "step": 0.1, "tooltip": "Weight lower bound (0-2)"}),
                "standardWeightMax": ("FLOAT", {"default": 1.5, "min": 0.0, "max": 2.0, "step": 0.1, "tooltip": "Weight upper bound (0-2)"}),
                "creativeBracketStyle": (["paren", "curly", "square"], {"default": "paren", "tooltip": "Bracket style: (), {}, []"}),
                "creativeNestLevels": ("INT", {"default": 0, "min": 0, "max": 5, "step": 1, "tooltip": "Bracket nest levels; 0 = random 1-5"}),
                "postCountFilterMode": (["none", "gt", "lt"], {"default": "none", "tooltip": "Filter by post_count: greater/less than threshold"}),
                "postCountThreshold": ("INT", {"default": 0, "min": 0, "max": 10000000, "step": 1, "tooltip": "Post count threshold"}),
                "separator": ("STRING", {"default": ",", "multiline": False, "tooltip": "Output separator; typically ,"}),
            },
            "optional": {},
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "generate"
    CATEGORY = "conditioning"
    
    @staticmethod
    def _get_artist_options():
        try:
            p = os.path.join(os.path.dirname(__file__), "db", "artists.json")
            if not os.path.exists(p):
                return ["None"]
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            names = []
            if isinstance(data, list):
                for a in data:
                    n = str(a.get("name", "")).strip()
                    if n:
                        names.append(n)
            names = sorted(list(dict.fromkeys(names)), key=lambda x: x.lower())
            limit = 300
            return ["None", *names[:limit]]
        except Exception:
            return ["None"]

    def _load_artists(self) -> List[Dict[str, Any]]:
        p = os.path.join(os.path.dirname(__file__), "db", "artists.json")
        if not os.path.exists(p):
            return []
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
        return []

    def _parse_names(self, s: str) -> List[str]:
        if not s:
            return []
        parts = [x.strip() for x in s.replace("\n", ",").split(",")]
        out = []
        seen = set()
        for x in parts:
            if not x:
                continue
            k = x.lower()
            if k in seen:
                continue
            seen.add(k)
            out.append(x)
        return out

    def _clamp(self, v: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, v))

    def _filter_pool(self, artists: List[Dict[str, Any]], exclude: set, preselected_set: set, mode: str, threshold: int) -> List[str]:
        pool = []
        for a in artists:
            n = str(a.get("name", "")).strip()
            if not n:
                continue
            if n in exclude or n in preselected_set:
                continue
            pc = a.get("post_count")
            if pc is None:
                pc = 0
            if mode == "gt":
                if not (pc > threshold):
                    continue
            elif mode == "lt":
                if not (pc < threshold):
                    continue
            pool.append(n)
        return pool

    def _format_pure(self, names: List[str]) -> List[str]:
        return names

    def _format_weight(self, names: List[str], wmin: float, wmax: float) -> List[str]:
        wmin = self._clamp(wmin, 0.0, 2.0)
        wmax = self._clamp(wmax, 0.0, 2.0)
        if wmin > wmax:
            wmin, wmax = wmax, wmin
        out = []
        fixed = None
        if abs(wmin - wmax) < 1e-9:
            fixed = round(wmin, 1)
        for n in names:
            if fixed is not None:
                w = fixed
            else:
                w = round(random.uniform(wmin, wmax), 1)
                w = self._clamp(w, 0.0, 2.0)
            out.append(f"({n}:{w:.1f})")
        return out

    def _format_bracket(self, names: List[str], style: str, levels: int) -> List[str]:
        if style == "curly":
            l, r = "{", "}"
        elif style == "square":
            l, r = "[", "]"
        else:
            l, r = "(", ")"
        levels = int(self._clamp(levels, 0, 5))
        out = []
        for n in names:
            lv = levels if levels > 0 else random.randint(1, 5)
            s = n
            for _ in range(lv):
                s = f"{l}{s}{r}"
            out.append(s)
        return out

    def generate(
        self,
        preselectName: str = "",
        excludeName: str = "",
        targetCount: int = 3,
        mode: str = "Standard",
        standardWeightMin: float = 0.5,
        standardWeightMax: float = 1.5,
        creativeBracketStyle: str = "paren",
        creativeNestLevels: int = 0,
        postCountFilterMode: str = "none",
        postCountThreshold: int = 0,
        separator: str = ",",
        prompt=None,
        extra_pnginfo=None,
        unique_id=None,
        **kwargs,
    ):
        targetCount = max(1, min(20, int(targetCount)))
        pre = self._parse_names(preselectName)
        pre = pre[:targetCount]
        pre_set = set(pre)
        ex = set(self._parse_names(excludeName))
        artists = self._load_artists()
        pool = self._filter_pool(artists, ex, pre_set, postCountFilterMode, int(postCountThreshold))
        need = targetCount - len(pre)
        random.shuffle(pool)
        add = pool[:max(0, need)]
        names = pre + add
        # Mode mapping
        if mode in ("Weighted", "weighted"):
            formatted = self._format_weight(names, float(standardWeightMin), float(standardWeightMax))
        elif mode in ("Bracket", "bracket"):
            formatted = self._format_bracket(names, creativeBracketStyle, int(creativeNestLevels))
        else:
            formatted = self._format_pure(names)
        sep = ","
        if isinstance(separator, str) and separator not in ("", "null", "None"):
            sep = separator
        text = sep.join(formatted)
        return (text,)

    def _best_match(self, query: str) -> str | None:
        q = query.lower().strip()
        if not q:
            return None
        artists = self._load_artists()
        candidates = []
        for a in artists:
            name = str(a.get("name", "")).strip()
            if not name:
                continue
            n = name.lower()
            aliases = [str(x).lower() for x in (a.get("other_names") or [])]
            pc = a.get("post_count") or 0
            pri = None
            if n.startswith(q):
                pri = 0
            elif q in n:
                pri = 1
            else:
                hit = False
                for al in aliases:
                    if q in al:
                        hit = True
                        break
                if hit:
                    pri = 2
            if pri is not None:
                candidates.append((pri, -int(pc), name))
        if not candidates:
            return None
        candidates.sort()
        return candidates[0][2]

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, **kwargs):
        return True

class AddArtistToCSV:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "name": ("STRING", {"default": "", "multiline": False, "tooltip": "Artist name"}),
                "keywords": ("STRING", {"default": "", "multiline": True, "tooltip": "Keywords (comma-separated)"}),
                "image": ("IMAGE", {}),
                "overwrite": ("BOOLEAN", {"default": True}),
            },
            "optional": {},
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("result",)
    FUNCTION = "add"
    CATEGORY = "conditioning"
    OUTPUT_NODE = True

    def add(self, name: str = "", keywords: str = "", image=None, overwrite: bool = True, prompt=None, extra_pnginfo=None, unique_id=None):
        name = (name or "").strip()
        keywords = (keywords or "").strip()
        if not name:
            return ("error: name is required",)
        csv_path = os.path.join(os.path.dirname(__file__), "artists.csv")
        images_dir = os.path.join(os.path.dirname(__file__), "images")
        os.makedirs(images_dir, exist_ok=True)
        image_filename = ""
        if image is not None:
            try:
                if hasattr(image, "dim") and callable(getattr(image, "dim")):
                    arr = image[0] if image.dim() >= 3 else image
                elif isinstance(image, (list, tuple)) and len(image) > 0:
                    arr = image[0]
                else:
                    arr = image
                i = (255.0 * arr.cpu().numpy()).clip(0, 255).astype(np.uint8)
                img = Image.fromarray(i)
                ts = int(time.time() * 1000)
                base_name = f"image_{ts}"
                candidate = f"{base_name}.png"
                dst = os.path.join(images_dir, candidate)
                if os.path.exists(dst) and not overwrite:
                    idx = 1
                    while True:
                        candidate = f"{base_name}_{idx:02}.png"
                        dst = os.path.join(images_dir, candidate)
                        if not os.path.exists(dst):
                            break
                        idx += 1
                img.save(dst)
                image_filename = candidate
            except Exception as e:
                return (f"error: failed to save image: {e}",)
        existing = []
        if os.path.exists(csv_path):
            try:
                with open(csv_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        parts = line.split(";")
                        if len(parts) >= 2:
                            n = parts[0].strip()
                            k = parts[1].strip()
                            img = parts[2].strip() if len(parts) > 2 else ""
                            existing.append((n, k, img))
            except Exception:
                existing = []
        updated = False
        out = []
        for n, k, img in existing:
            if overwrite and n.lower() == name.lower():
                out.append((name, keywords, image_filename or img))
                updated = True
            else:
                out.append((n, k, img))
        if not updated:
            out.append((name, keywords, image_filename))
        try:
            with open(csv_path, "w", encoding="utf-8") as f:
                for n, k, img in out:
                    f.write(f"{n};{k};{img}\n")
        except Exception as e:
            return (f"error: failed to write csv: {e}",)
        try:
            power_artist_loader_instance.load_artists_data()
        except Exception:
            pass
        try:
            PromptServer.instance.send_sync("power_artist_loader:updated", {
                "name": name,
                "image": image_filename,
                "count": len(out)
            })
        except Exception:
            pass
        return ("ok",)

# Global instance
power_artist_loader_instance = PowerArtistLoader()

# API routes
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

@PromptServer.instance.routes.get("/power_artist_loader/db/artists")
async def get_db_artists(request):
    try:
        db_path = os.path.join(os.path.dirname(__file__), "db", "artists.json")
        if not os.path.exists(db_path):
            return web.json_response({"artists": []})
        async with aiofiles.open(db_path, 'r', encoding='utf-8') as f:
            content = await f.read()
            data = json.loads(content)
            artists = []
            if isinstance(data, list):
                for a in data:
                    artists.append({
                        'name': a.get('name', ''),
                        'other_names': a.get('other_names') or [],
                        'post_count': a.get('post_count') or 0,
                    })
            return web.json_response({"artists": artists})
    except Exception as e:
        return web.json_response({"artists": [], "error": str(e)}, status=500)

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
    "PowerArtistLoader": PowerArtistLoader,
    "RandomArtistString": RandomArtistString,
    "AddArtistToCSV": AddArtistToCSV,
}

# 节点显示名映射  
NODE_DISPLAY_NAME_MAPPINGS = {
    "PowerArtistLoader": "Power Artist Loader",
    "RandomArtistString": "Random Artist String",
    "AddArtistToCSV": "Add Artist To CSV",
}

# 导出所需的变量
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
