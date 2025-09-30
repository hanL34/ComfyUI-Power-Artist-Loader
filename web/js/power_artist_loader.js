// web/js/power_artist_loader.js - 添加下拉菜单悬停预览功能
import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

let ARTISTS_DATA = []; 
let ARTISTS_LIST = ["None"];

// 通过API加载CSV数据
async function loadArtistsFromCSV() {
    try {
        const response = await api.fetchApi("/power_artist_loader/artists");
        if (!response.ok) {
            console.warn('Could not load artists data via API, using defaults');
            return loadDefaultArtists();
        }
        
        const data = await response.json();
        ARTISTS_DATA = data.artists || [];
        ARTISTS_LIST = ["None", ...ARTISTS_DATA.map(a => a.name)];
        
        console.log(`Loaded ${ARTISTS_DATA.length} artists from API`);
    } catch (error) {
        console.error('Error loading artists:', error);
        loadDefaultArtists();
    }
}

// 添加刷新函数
async function refreshArtists() {
    await loadArtistsFromCSV();
    console.log('Artists data refreshed');
}

// 监听页面可见性变化，自动刷新
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        refreshArtists();
    }
});

function loadDefaultArtists() {
    ARTISTS_DATA = [
        { name: "Akira Toriyama", keywords: "akira toriyama style, anime, dragon ball", image: "toriyama.jpg" },
        { name: "Greg Rutkowski", keywords: "greg rutkowski, artstation, fantasy art", image: "rutkowski.jpg" },
        { name: "Hayao Miyazaki", keywords: "hayao miyazaki, studio ghibli, anime film", image: "miyazaki.jpg" }
    ];
    ARTISTS_LIST = ["None", ...ARTISTS_DATA.map(a => a.name)];
}

function getArtistData(name) {
    return ARTISTS_DATA.find(artist => artist.name === name);
}

// 预览系统 - 优化版
class PreviewImage {
    static instance = null;
    static currentArtist = null;
    static hideTimer = null;
    static isImageLoading = false;
    
    static show(artistName, x, y) {
        // 清除待隐藏的定时器
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        
        // 避免重复显示同一个画师
        if (this.currentArtist === artistName && this.instance) {
            return;
        }
        
        this.hide();
        this.currentArtist = artistName;
        this.isImageLoading = false;
        
        const artistData = getArtistData(artistName);
        if (!artistData) {
            return;
        }
        
        // 如果没有图片配置，直接显示文本
        if (!artistData.image) {
            this.showTextOnly(artistName, artistData, x, y);
            return;
        }
        
        // 有图片配置，先尝试加载图片
        this.isImageLoading = true;
        
        this.instance = document.createElement('div');
        this.instance.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            z-index: 99999;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.9);
            pointer-events: none;
            max-width: 300px;
        `;
        
        const img = document.createElement('img');
        const imgSrc = `/power_artist_loader/preview/${artistData.image}`;
        
        img.style.cssText = `
            max-width: 260px;
            max-height: 200px;
            display: block;
            border-radius: 4px;
            margin-bottom: 8px;
        `;
        
        const info = document.createElement('div');
        info.style.cssText = 'color: #fff; font-size: 11px; line-height: 1.4;';
        info.innerHTML = `
            <div style="font-weight: bold; color: #4CAF50; margin-bottom: 4px;">${artistData.name}</div>
            <div style="color: #ccc;">${artistData.keywords}</div>
        `;
        
        // 保存当前实例引用
        const currentInstance = this.instance;
        
        img.onload = () => {
            this.isImageLoading = false;
        };
        
        img.onerror = () => {
            this.isImageLoading = false;
            // 图片加载失败，显示文本版本
            if (currentInstance && currentInstance.parentNode && this.instance === currentInstance) {
                currentInstance.innerHTML = `
                    <div style="color: #fff; font-size: 11px; padding: 8px;">
                        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 4px;">${artistData.name}</div>
                        <div style="color: #ccc;">${artistData.keywords}</div>
                        <div style="color: #888; margin-top: 6px; font-size: 10px;">📷 Preview not available</div>
                    </div>
                `;
            }
        };
        
        img.src = imgSrc;
        
        this.instance.appendChild(img);
        this.instance.appendChild(info);
        document.body.appendChild(this.instance);
    }
    
    static showTextOnly(artistName, artistData, x, y) {
        if (!artistData) return;
        
        this.instance = document.createElement('div');
        this.instance.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            z-index: 99999;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #666;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.9);
            pointer-events: none;
            max-width: 300px;
        `;
        
        this.instance.innerHTML = `
            <div style="color: #fff; font-size: 11px; line-height: 1.4;">
                <div style="font-weight: bold; color: #4CAF50; margin-bottom: 4px;">${artistData.name}</div>
                <div style="color: #ccc;">${artistData.keywords}</div>
            </div>
        `;
        
        document.body.appendChild(this.instance);
    }
    
    static scheduleHide() {
        // 如果正在加载图片，等待加载完成后再隐藏
        const delay = this.isImageLoading ? 200 : 100;
        
        this.hideTimer = setTimeout(() => {
            this.hide();
        }, delay);
    }
    
    static hide() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        
        if (this.instance) {
            this.instance.remove();
            this.instance = null;
        }
        this.currentArtist = null;
        this.isImageLoading = false;
    }
}

// rgthree风格基础widget
class RgthreeBaseWidget {
    constructor(name) {
        this.name = name;
        this.type = "rgthree_base";
        this.last_y = 0;
    }
    
    computeSize() {
        return [0, 25];
    }
}

// Toggle All Header Widget
class PowerArtistHeaderWidget extends RgthreeBaseWidget {
    constructor(name = "PowerArtistHeaderWidget") {
        super(name);
        this.value = { type: "PowerArtistHeaderWidget" };
        this.type = "power_artist_header";
        this.serialize = false;
    }
    
    draw(ctx, node, width, posY, height) {
        if (!node.hasArtistWidgets || !node.hasArtistWidgets()) return 0;
        
        const margin = 10;
        const innerMargin = 4;
        const midY = posY + height * 0.5;
        
        ctx.save();
        
        const allState = node.allArtistsState ? node.allArtistsState() : null;
        
        let posX = margin;
        
        const toggleBounds = this.drawTogglePart(ctx, posX, posY, height, allState);
        posX += toggleBounds[1] + innerMargin;
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.7;
        ctx.fillText("Toggle All", posX, midY);
        
        ctx.textAlign = "center";
        ctx.fillText("Strength", width - margin - 35, midY);
        
        this.last_y = posY;
        
        ctx.restore();
        
        return height;
    }
    
    drawTogglePart(ctx, posX, posY, height, value) {
        const size = height * 0.6;
        const x = posX + 5;
        const y = posY + (height - size) / 2;
        
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        
        if (value === null) {
            ctx.fillStyle = "#FF9800";
        } else {
            ctx.fillStyle = value ? "#4CAF50" : "#444444";
        }
        
        ctx.fill();
        ctx.strokeStyle = value === null ? "#FFB74D" : (value ? "#66BB6A" : "#666666");
        ctx.lineWidth = 1;
        ctx.stroke();
        
        if (value === true) {
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2 - 3, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
        } else if (value === null) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("-", x + size/2, y + size/2);
        }
        
        return [x, size + 10];
    }
    
    mouse(event, pos, node) {
        const localY = pos[1] - this.last_y;
        const localX = pos[0];
        
        if (localY < 0 || localY > 25) return false;
        
        if (event.type === "pointerdown" && localX >= 10 && localX <= 30) {
            if (node.toggleAllArtists) {
                node.toggleAllArtists();
            }
            return true;
        }
        
        return false;
    }
}

// 主要的Artist Widget
class PowerArtistWidget extends RgthreeBaseWidget {
    constructor(name) {
        super(name);
        this.type = "power_artist";
        this.serialize = true;
        this.isMouseOver = false;
        this.dragStrength = false;
        
        this._value = {
            on: false,
            artist: "None", 
            strength: 1.00
        };
    }
    
    set value(v) {
        this._value = v && typeof v === 'object' ? v : { on: false, artist: "None", strength: 1.00 };
    }
    
    get value() {
        return this._value;
    }
    
    draw(ctx, node, width, posY, height) {
        const margin = 10;
        const innerMargin = 3;
        const midY = posY + height * 0.5;
        
        ctx.save();
        
        this.drawRoundedRectangle(ctx, margin, posY, width - margin * 2, height);
        
        let posX = margin;
        
        const toggleBounds = this.drawTogglePart(ctx, posX, posY, height, this.value.on);
        posX += toggleBounds[1] + innerMargin;
        
        if (!this.value.on) {
            ctx.globalAlpha = 0.4;
        }
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        const artistName = this.value.artist || "None";
        const nameWidth = 150;
        const displayName = this.fitString(ctx, artistName, nameWidth);
        ctx.fillText(displayName, posX, midY);
        
        posX += nameWidth + innerMargin;
        
        const strengthValue = this.value.strength || 1.00;
        this.drawStrengthWidget(ctx, width - margin - 70, posY, 70, height, strengthValue);
        
        this.last_y = posY;
        
        ctx.restore();
        
        return height;
    }
    
    drawRoundedRectangle(ctx, x, y, width, height) {
        const radius = 3;
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }
    
    drawTogglePart(ctx, posX, posY, height, value) {
        const size = height * 0.55;
        const x = posX + 6;
        const y = posY + (height - size) / 2;
        
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fillStyle = value ? "#4CAF50" : "#444444";
        ctx.fill();
        ctx.strokeStyle = value ? "#66BB6A" : "#666666";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        if (value) {
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2 - 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
        }
        
        return [x, size + 8];
    }
    
    drawStrengthWidget(ctx, x, y, width, height, value) {
        const arrowWidth = 15;
        const valueWidth = width - arrowWidth * 2;
        const yOffset = 2;
        const h = height - 4;
        
        ctx.fillStyle = "#555555";
        ctx.fillRect(x, y + yOffset, arrowWidth, h);
        ctx.strokeStyle = "#777777";
        ctx.strokeRect(x, y + yOffset, arrowWidth, h);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("◀", x + arrowWidth/2, y + height/2);
        
        const valueX = x + arrowWidth;
        ctx.fillStyle = "#333333";
        ctx.fillRect(valueX, y + yOffset, valueWidth, h);
        ctx.strokeStyle = "#777777";
        ctx.strokeRect(valueX, y + yOffset, valueWidth, h);
        
        ctx.fillStyle = value !== 1.0 ? "#FFC107" : "#CCCCCC";
        ctx.font = "10px Arial";
        const valueText = value.toFixed(2);
        ctx.fillText(valueText, valueX + valueWidth/2, y + height/2);
        
        const rightX = valueX + valueWidth;
        ctx.fillStyle = "#555555";
        ctx.fillRect(rightX, y + yOffset, arrowWidth, h);
        ctx.strokeStyle = "#777777";
        ctx.strokeRect(rightX, y + yOffset, arrowWidth, h);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("▶", rightX + arrowWidth/2, y + height/2);
        
        this.strengthAreas = {
            decrease: { x: x, width: arrowWidth },
            value: { x: valueX, width: valueWidth },
            increase: { x: rightX, width: arrowWidth },
            total: { x: x, width: width }
        };
    }
    
    fitString(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        
        while (text.length > 3 && ctx.measureText(text + "...").width > maxWidth) {
            text = text.substring(0, text.length - 1);
        }
        return text + "...";
    }
    
    mouse(event, pos, node) {
        const localY = pos[1] - this.last_y;
        const localX = pos[0];
        
        if (localY < 0 || localY > 25) {
            if (this.isMouseOver) {
                PreviewImage.hide();
                this.isMouseOver = false;
            }
            return false;
        }
        
        // 右键菜单 - 在整个widget区域检测，并标记已处理
        if (event.type === "pointerdown" && event.button === 2) {
            PreviewImage.hide();
            this.isMouseOver = false;
            
            // 阻止节点的右键菜单
            event.stopPropagation();
            event.preventDefault();
            
            this.showContextMenu(event, node);
            return true;
        }
        
        // 开关区域
        if (localX >= 10 && localX <= 30) {
            if (event.type === "pointerdown" && event.button === 0) {
                PreviewImage.hide();
                this.value.on = !this.value.on;
                node.setDirtyCanvas(true, true);
                return true;
            }
        }
        
        // 画师名称区域
        else if (localX >= 35 && localX <= 185) {
            if (event.type === "pointermove") {
                const artistName = this.value.artist;
                if (artistName && artistName !== "None") {
                    if (!this.isMouseOver) {
                        try {
                            let canvasElement = null;
                            if (app.canvas && app.canvas.canvas) {
                                canvasElement = app.canvas.canvas;
                            } else if (node.graph && node.graph.canvas && node.graph.canvas.canvas) {
                                canvasElement = node.graph.canvas.canvas;
                            } else {
                                canvasElement = document.querySelector('canvas');
                            }
                            
                            if (canvasElement) {
                                const rect = canvasElement.getBoundingClientRect();
                                PreviewImage.show(artistName, rect.left + pos[0], rect.top + pos[1]);
                                this.isMouseOver = true;
                            }
                        } catch (error) {
                            console.warn('Canvas not found for preview:', error);
                        }
                    }
                }
            } else if (event.type === "pointerdown" && event.button === 0) {
                PreviewImage.hide();
                this.isMouseOver = false;
                this.showArtistMenu(event, node);
                return true;
            }
        }
        
        // 权重控制区域
        else if (this.strengthAreas && localX >= this.strengthAreas.total.x && localX <= this.strengthAreas.total.x + this.strengthAreas.total.width) {
            if (event.type === "pointerdown" && event.button === 0) {
                PreviewImage.hide();
                this.isMouseOver = false;
                
                const widgetStartX = this.strengthAreas.total.x;
                const relativeX = localX - widgetStartX;
                
                if (relativeX >= 0 && relativeX <= 15) {
                    this.adjustStrength(-0.05);
                    node.setDirtyCanvas(true, true);
                    return true;
                }
                else if (relativeX >= 55 && relativeX <= 70) {
                    this.adjustStrength(0.05);
                    node.setDirtyCanvas(true, true);
                    return true;
                }
                else if (relativeX > 15 && relativeX < 55) {
                    this.showWeightInput(event, node);
                    return true;
                }
            }
            else if (event.type === "pointermove" && event.buttons === 1 && this.dragStrength) {
                this.adjustStrength(event.movementX * 0.01);
                node.setDirtyCanvas(true, true);
                return true;
            }
            else if (event.type === "pointerdown" && event.buttons === 1) {
                this.dragStrength = true;
                return true;
            }
        }
        
        // 鼠标离开时隐藏预览
        if (event.type === "pointerleave" || (event.type === "pointermove" && (localX < 35 || localX > 185))) {
            if (this.isMouseOver) {
                PreviewImage.hide();
                this.isMouseOver = false;
            }
        }
        
        return false;
    }
    
    onMouseUp(event, pos, node) {
        this.dragStrength = false;
    }
    
    adjustStrength(delta) {
        this.value.strength = (this.value.strength || 1.0) + delta;
        this.value.strength = Math.max(0.0, Math.min(3.0, this.value.strength));
        this.value.strength = Math.round(this.value.strength * 100) / 100;
    }
    
    showArtistMenu(event, node) {
        const menu = ARTISTS_LIST.map(artist => ({
            content: artist === this.value.artist ? `● ${artist}` : artist,
            callback: () => {
                this.value.artist = artist;
                node.setDirtyCanvas(true, true);
            }
        }));
        
        const contextMenu = new LiteGraph.ContextMenu(menu, {
            event: event,
            title: "Choose Artist",
            className: "dark"
        });
        
        // 核心功能：为菜单项添加悬停预览
        setTimeout(() => {
            if (!contextMenu.root) return;
            
            const menuItems = contextMenu.root.querySelectorAll('.litemenu-entry');
            
            menuItems.forEach((item, index) => {
                const artistName = ARTISTS_LIST[index];
                
                if (!artistName || artistName === "None") return;
                
                item.addEventListener('mouseenter', (e) => {
                    const rect = item.getBoundingClientRect();
                    // 在菜单右侧显示预览
                    PreviewImage.show(artistName, rect.right + 15, rect.top);
                });
                
                item.addEventListener('mouseleave', () => {
                    // 标记即将隐藏，但给图片加载时间
                    PreviewImage.scheduleHide();
                });
            });
            
            // 菜单关闭时清理预览
            const originalRemove = contextMenu.close.bind(contextMenu);
            contextMenu.close = function() {
                PreviewImage.hide();
                originalRemove();
            };
        }, 10);
    }
    
    showWeightInput(event, node) {
        const canvas = app.canvas;
        canvas.prompt("Strength Value (0.00 - 3.00)", this.value.strength.toFixed(2), (v) => {
            const newValue = parseFloat(v);
            if (!isNaN(newValue) && newValue >= 0.0 && newValue <= 3.0) {
                this.value.strength = Math.round(newValue * 100) / 100;
                node.setDirtyCanvas(true, true);
            }
        }, event);
    }
    
    showContextMenu(event, node) {
        const menu = [
            {
                content: this.value.on ? "⌨ Disable" : "✅ Enable",
                callback: () => {
                    this.value.on = !this.value.on;
                    node.setDirtyCanvas(true, true);
                }
            },
            null,
            {
                content: "⚖️ Strength 0.50",
                callback: () => {
                    this.value.strength = 0.50;
                    node.setDirtyCanvas(true, true);
                }
            },
            {
                content: "⚖️ Strength 1.00",
                callback: () => {
                    this.value.strength = 1.00;
                    node.setDirtyCanvas(true, true);
                }
            },
            {
                content: "⚖️ Strength 1.50",
                callback: () => {
                    this.value.strength = 1.50;
                    node.setDirtyCanvas(true, true);
                }
            },
            null,
            {
                content: "🔼 Move Up",
                disabled: !node.canMoveWidgetUp || !node.canMoveWidgetUp(this),
                callback: () => {
                    if (node.moveWidgetUp) {
                        node.moveWidgetUp(this);
                    }
                }
            },
            {
                content: "🔽 Move Down",
                disabled: !node.canMoveWidgetDown || !node.canMoveWidgetDown(this),
                callback: () => {
                    if (node.moveWidgetDown) {
                        node.moveWidgetDown(this);
                    }
                }
            },
            null,
            {
                content: "🗑️ Remove",
                callback: () => {
                    if (node.removeArtistWidget) {
                        node.removeArtistWidget(this);
                    }
                }
            }
        ];
        
        new LiteGraph.ContextMenu(menu, {
            event: event,
            title: "Artist Options",
            className: "dark"
        });
    }
    
    serializeValue() {
        return { ...this.value };
    }
}

// 按钮和分隔widget
class RgthreeButtonWidget extends RgthreeBaseWidget {
    constructor(name, callback) {
        super(name);
        this.callback = callback;
        this.serialize = false;
    }
    
    draw(ctx, node, width, posY, height) {
        const margin = 10;
        
        ctx.save();
        ctx.fillStyle = "#555555";
        ctx.fillRect(margin, posY + 2, width - margin * 2, height - 4);
        ctx.strokeStyle = "#777777";
        ctx.strokeRect(margin, posY + 2, width - margin * 2, height - 4);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, width / 2, posY + height / 2);
        
        this.last_y = posY;
        ctx.restore();
        
        return height;
    }
    
    mouse(event, pos, node) {
        const localY = pos[1] - this.last_y;
        if (event.type === "pointerdown" && localY >= 0 && localY <= 25) {
            if (this.callback) {
                // 传入 event 和 node 用于显示菜单
                return this.callback(event, pos, node);
            }
            return true;
        }
        return false;
    }
}

class RgthreeDividerWidget extends RgthreeBaseWidget {
    constructor(options = {}) {
        super("divider");
        this.marginTop = options.marginTop || 4;
        this.marginBottom = options.marginBottom || 0;
        this.serialize = false;
    }
    
    draw(ctx, node, width, posY, height) {
        this.last_y = posY;
        return height;
    }
    
    computeSize() {
        return [0, this.marginTop + this.marginBottom];
    }
}

// 扩展注册
app.registerExtension({
    name: "Comfy.PowerArtistLoader",
    
    async init(app) {
        await loadArtistsFromCSV();
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "PowerArtistLoader") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                this.serialize_widgets = true;
                this.artistWidgets = [];
                this.artistCounter = 0;
                
                // 确保 widgets 数组存在
                if (!this.widgets) {
                    this.widgets = [];
                }
                
                // 移除默认的 text widget（如果存在）
                this.widgets = this.widgets.filter(w => w.name !== "text");
                
                this.addNonArtistWidgets();
                
                this.size = [320, Math.max(120, this.computeSize()[1])];
                this.setDirtyCanvas(true, true);
            };
            
            // 添加节点级别的右键菜单
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                const r = getExtraMenuOptions ? getExtraMenuOptions.apply(this, arguments) : undefined;
                
                if (this.artistWidgets && this.artistWidgets.length > 0) {
                    options.push(null); // 分隔线
                    
                    // 为每个画师 widget 添加子菜单
                    this.artistWidgets.forEach((widget, index) => {
                        const artistName = widget.value.artist || "None";
                        
                        options.push({
                            content: `🎨 ${artistName}`,
                            has_submenu: true,
                            submenu: {
                                options: [
                                    {
                                        content: widget.value.on ? "⌨ Disable" : "✅ Enable",
                                        callback: () => {
                                            widget.value.on = !widget.value.on;
                                            this.setDirtyCanvas(true, true);
                                        }
                                    },
                                    null,
                                    {
                                        content: "⚖️ Strength 0.50",
                                        callback: () => {
                                            widget.value.strength = 0.50;
                                            this.setDirtyCanvas(true, true);
                                        }
                                    },
                                    {
                                        content: "⚖️ Strength 1.00",
                                        callback: () => {
                                            widget.value.strength = 1.00;
                                            this.setDirtyCanvas(true, true);
                                        }
                                    },
                                    {
                                        content: "⚖️ Strength 1.50",
                                        callback: () => {
                                            widget.value.strength = 1.50;
                                            this.setDirtyCanvas(true, true);
                                        }
                                    },
                                    null,
                                    {
                                        content: "🔼 Move Up",
                                        disabled: !this.canMoveWidgetUp(widget),
                                        callback: () => {
                                            this.moveWidgetUp(widget);
                                        }
                                    },
                                    {
                                        content: "🔽 Move Down",
                                        disabled: !this.canMoveWidgetDown(widget),
                                        callback: () => {
                                            this.moveWidgetDown(widget);
                                        }
                                    },
                                    null,
                                    {
                                        content: "🗑️ Remove",
                                        callback: () => {
                                            this.removeArtistWidget(widget);
                                        }
                                    }
                                ]
                            }
                        });
                    });
                }
                
                return r;
            };
            
            nodeType.prototype.hasArtistWidgets = function() {
                return this.artistWidgets && this.artistWidgets.length > 0;
            };
            
            nodeType.prototype.allArtistsState = function() {
                if (!this.artistWidgets || this.artistWidgets.length === 0) return false;
                
                let allOn = true;
                let allOff = true;
                
                for (const widget of this.artistWidgets) {
                    const on = widget.value && widget.value.on;
                    allOn = allOn && on === true;
                    allOff = allOff && on === false;
                    
                    if (!allOn && !allOff) return null;
                }
                
                return allOn ? true : false;
            };
            
            nodeType.prototype.toggleAllArtists = function() {
                const allOn = this.allArtistsState();
                const newState = allOn !== true;
                
                for (const widget of this.artistWidgets) {
                    if (widget.value) {
                        widget.value.on = newState;
                    }
                }
                
                this.setDirtyCanvas(true, true);
            };
            
            nodeType.prototype.addNewArtistWidget = function() {
                this.artistCounter++;
                const widget = new PowerArtistWidget(`artist_${this.artistCounter}`);
                
                const buttonIndex = this.widgets.findIndex(w => w.name === "➕ Add Artist");
                if (buttonIndex !== -1) {
                    this.widgets.splice(buttonIndex, 0, widget);
                } else {
                    this.widgets.push(widget);
                }
                
                this.artistWidgets.push(widget);
                
                // 保留用户调整的宽度，只更新高度
                const minHeight = Math.max(120, this.computeSize()[1]);
                this.size[0] = Math.max(this.size[0], 320); // 保持用户宽度，最小320
                this.size[1] = Math.max(this.size[1], minHeight); // 保持用户高度，最小为计算高度
                
                this.setDirtyCanvas(true, true);
                
                return widget;
            };
            
            nodeType.prototype.canMoveWidgetUp = function(widget) {
                const index = this.artistWidgets.indexOf(widget);
                return index > 0;
            };
            
            nodeType.prototype.canMoveWidgetDown = function(widget) {
                const index = this.artistWidgets.indexOf(widget);
                return index >= 0 && index < this.artistWidgets.length - 1;
            };
            
            nodeType.prototype.moveWidgetUp = function(widget) {
                const index = this.artistWidgets.indexOf(widget);
                if (index <= 0) return;
                
                // 交换 artistWidgets 数组
                [this.artistWidgets[index - 1], this.artistWidgets[index]] = 
                [this.artistWidgets[index], this.artistWidgets[index - 1]];
                
                // 在 widgets 数组中找到位置并交换
                const widgetIndex = this.widgets.indexOf(widget);
                if (widgetIndex > 0) {
                    [this.widgets[widgetIndex - 1], this.widgets[widgetIndex]] = 
                    [this.widgets[widgetIndex], this.widgets[widgetIndex - 1]];
                }
                
                this.setDirtyCanvas(true, true);
            };
            
            nodeType.prototype.moveWidgetDown = function(widget) {
                const index = this.artistWidgets.indexOf(widget);
                if (index < 0 || index >= this.artistWidgets.length - 1) return;
                
                // 交换 artistWidgets 数组
                [this.artistWidgets[index], this.artistWidgets[index + 1]] = 
                [this.artistWidgets[index + 1], this.artistWidgets[index]];
                
                // 在 widgets 数组中找到位置并交换
                const widgetIndex = this.widgets.indexOf(widget);
                if (widgetIndex < this.widgets.length - 1) {
                    [this.widgets[widgetIndex], this.widgets[widgetIndex + 1]] = 
                    [this.widgets[widgetIndex + 1], this.widgets[widgetIndex]];
                }
                
                this.setDirtyCanvas(true, true);
            };
            
            nodeType.prototype.removeArtistWidget = function(widget) {
                // 从 artistWidgets 中移除
                const index = this.artistWidgets.indexOf(widget);
                if (index >= 0) {
                    this.artistWidgets.splice(index, 1);
                }
                
                // 从 widgets 中移除
                const widgetIndex = this.widgets.indexOf(widget);
                if (widgetIndex >= 0) {
                    this.widgets.splice(widgetIndex, 1);
                }
                
                // 更新节点尺寸
                const minHeight = Math.max(120, this.computeSize()[1]);
                this.size[1] = Math.max(this.size[1], minHeight);
                
                this.setDirtyCanvas(true, true);
            };
            
            nodeType.prototype.addNonArtistWidgets = function() {
                // 添加 header
                this.widgets.push(new RgthreeDividerWidget({ marginTop: 5 }));
                this.widgets.push(new PowerArtistHeaderWidget());
                this.widgets.push(new RgthreeDividerWidget({ marginTop: 5 }));
                
                // 添加按钮 - 修改回调逻辑
                this.widgets.push(new RgthreeButtonWidget("➕ Add Artist", (event, pos, node) => {
                    // 先弹出菜单选择画师
                    const menu = ARTISTS_LIST.map(artist => ({
                        content: artist,
                        callback: () => {
                            // 选择后创建新的 widget 并设置画师
                            const widget = node.addNewArtistWidget();
                            widget.value.artist = artist;
                            if (artist !== "None") {
                                widget.value.on = true; // 自动启用
                            }
                            node.setDirtyCanvas(true, true);
                        }
                    }));
                    
                    const contextMenu = new LiteGraph.ContextMenu(menu, {
                        event: event,
                        title: "Choose Artist to Add",
                        className: "dark"
                    });
                    
                    // 为菜单项添加悬停预览 - 复用现有逻辑
                    setTimeout(() => {
                        if (!contextMenu.root) return;
                        
                        const menuItems = contextMenu.root.querySelectorAll('.litemenu-entry');
                        
                        menuItems.forEach((item, index) => {
                            const artistName = ARTISTS_LIST[index];
                            
                            if (!artistName || artistName === "None") return;
                            
                            item.addEventListener('mouseenter', (e) => {
                                const rect = item.getBoundingClientRect();
                                PreviewImage.show(artistName, rect.right + 15, rect.top);
                            });
                            
                            item.addEventListener('mouseleave', () => {
                                PreviewImage.scheduleHide();
                            });
                        });
                        
                        // 菜单关闭时清理预览
                        const originalClose = contextMenu.close.bind(contextMenu);
                        contextMenu.close = function() {
                            PreviewImage.hide();
                            originalClose();
                        };
                    }, 10);
                    
                    return true;
                }));
                
                this.widgets.push(new RgthreeDividerWidget({ marginTop: 5 }));
            };
        }
    }
});

console.log("Power Artist Loader loaded successfully with dropdown preview feature");