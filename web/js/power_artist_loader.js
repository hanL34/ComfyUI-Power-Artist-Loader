// web/js/power_artist_loader.js - 支持CSV数据和预览功能
import { app } from "/scripts/app.js";

let ARTISTS_DATA = []; // 存储从CSV加载的画师数据
let ARTISTS_LIST = ["None"]; // 画师名称列表

// 加载CSV数据
async function loadArtistsFromCSV() {
    try {
        const response = await fetch('/extensions/PowerArtistLoader/artists.csv');
        if (!response.ok) {
            console.warn('Could not load artists.csv, using default artists');
            return loadDefaultArtists();
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        ARTISTS_DATA = [];
        ARTISTS_LIST = ["None"];
        
        // 假设CSV格式: 画师名,关键词,图片文件名
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [name, keywords, image] = line.split(',').map(s => s.trim());
            if (name && keywords) {
                ARTISTS_DATA.push({
                    name: name,
                    keywords: keywords,
                    image: image || null
                });
                ARTISTS_LIST.push(name);
            }
        }
        
        console.log(`🎨 Loaded ${ARTISTS_DATA.length} artists from CSV`);
    } catch (error) {
        console.error('Error loading CSV:', error);
        loadDefaultArtists();
    }
}

// 加载默认画师列表
function loadDefaultArtists() {
    ARTISTS_DATA = [
        { name: "Akira Toriyama", keywords: "akira toriyama, dragon ball style, anime", image: null },
        { name: "Hayao Miyazaki", keywords: "hayao miyazaki, studio ghibli, miyazaki", image: null },
        { name: "Greg Rutkowski", keywords: "greg rutkowski, artstation", image: null }
    ];
    ARTISTS_LIST = ["None", ...ARTISTS_DATA.map(a => a.name)];
}

// 获取画师数据
function getArtistData(name) {
    return ARTISTS_DATA.find(artist => artist.name === name);
}

// rgthree风格的基础widget类
class RgthreeBaseWidget {
    constructor(name) {
        this.name = name;
        this.type = "rgthree_base";
        this.hitAreas = {};
        this.last_y = 0;
    }
}

// 预览图片显示
class ArtistPreview {
    static instance = null;
    static timeout = null;
    
    static show(artistName, x, y) {
        this.hide(); // 先隐藏之前的预览
        
        const artistData = getArtistData(artistName);
        if (!artistData || !artistData.image) return;
        
        this.timeout = setTimeout(() => {
            this.instance = document.createElement('div');
            this.instance.style.cssText = `
                position: fixed;
                left: ${x + 10}px;
                top: ${y - 10}px;
                z-index: 10000;
                background: #333;
                border: 2px solid #666;
                border-radius: 4px;
                padding: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                max-width: 300px;
                pointer-events: none;
            `;
            
            // 添加图片
            const img = document.createElement('img');
            img.src = `/extensions/PowerArtistLoader/images/${artistData.image}`;
            img.style.cssText = `
                max-width: 200px;
                max-height: 200px;
                display: block;
                margin-bottom: 5px;
                border-radius: 2px;
            `;
            
            img.onerror = () => {
                // 如果图片加载失败，显示文本信息
                this.instance.innerHTML = `
                    <div style="color: #fff; font-size: 12px;">
                        <strong>${artistData.name}</strong><br>
                        <em>${artistData.keywords}</em>
                    </div>
                `;
            };
            
            // 添加文字信息
            const info = document.createElement('div');
            info.style.cssText = 'color: #fff; font-size: 12px;';
            info.innerHTML = `
                <strong>${artistData.name}</strong><br>
                <em style="color: #ccc;">${artistData.keywords}</em>
            `;
            
            this.instance.appendChild(img);
            this.instance.appendChild(info);
            document.body.appendChild(this.instance);
        }, 500); // 延迟500ms显示
    }
    
    static hide() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        if (this.instance) {
            document.body.removeChild(this.instance);
            this.instance = null;
        }
    }
}

// Power Artist Loader Widget
class PowerArtistLoaderWidget extends RgthreeBaseWidget {
    constructor(name) {
        super(name);
        this.type = "power_artist";
        this.serialize = true;
        this.haveMouseMovedStrength = false;
        
        this.hitAreas = {
            toggle: { bounds: [0, 0], onDown: this.onToggleDown.bind(this) },
            artist: { bounds: [0, 0], onClick: this.onArtistClick.bind(this), onHover: this.onArtistHover.bind(this) },
            strengthDec: { bounds: [0, 0], onClick: this.onStrengthDecDown.bind(this) },
            strengthVal: { bounds: [0, 0], onClick: this.onStrengthValUp.bind(this) },
            strengthInc: { bounds: [0, 0], onClick: this.onStrengthIncDown.bind(this) },
            strengthAny: { bounds: [0, 0], onMove: this.onStrengthAnyMove.bind(this) }
        };
        
        this._value = {
            on: true,
            artist: "None",
            strength: 1.0
        };
    }
    
    set value(v) {
        this._value = v && typeof v === 'object' ? v : { on: true, artist: "None", strength: 1.0 };
    }
    
    get value() {
        return this._value;
    }
    
    draw(ctx, node, width, posY, height) {
        const margin = 10;
        const innerMargin = margin * 0.33;
        const midY = posY + height * 0.5;
        
        ctx.save();
        
        // 绘制背景框
        this.drawRoundedRectangle(ctx, margin, posY, width - margin * 2, height);
        
        let posX = margin;
        
        // 绘制开关
        this.hitAreas.toggle.bounds = this.drawTogglePart(ctx, posX, posY, height, this.value.on);
        posX += this.hitAreas.toggle.bounds[1] + innerMargin;
        
        if (!this.value.on) {
            ctx.globalAlpha = 0.4;
        }
        
        // 绘制画师名称
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        const artistName = this.value.artist || "None";
        const nameWidth = 140;
        let displayName = this.fitString(ctx, artistName, nameWidth);
        ctx.fillText(displayName, posX, midY);
        
        this.hitAreas.artist.bounds = [posX, posY, nameWidth, height];
        posX += nameWidth + innerMargin;
        
        // 绘制权重控制
        const strengthValue = this.value.strength || 1.0;
        const numberParts = this.drawNumberWidgetPart(ctx, width - margin - innerMargin, posY, height, strengthValue, -1);
        
        this.hitAreas.strengthDec.bounds = [...numberParts[0], posY, height];
        this.hitAreas.strengthVal.bounds = [...numberParts[1], posY, height];
        this.hitAreas.strengthInc.bounds = [...numberParts[2], posY, height];
        this.hitAreas.strengthAny.bounds = [numberParts[0][0], posY, numberParts[2][0] + numberParts[2][1] - numberParts[0][0], height];
        
        this.last_y = posY;
        
        ctx.restore();
        
        return height;
    }
    
    // 绘制圆角矩形背景
    drawRoundedRectangle(ctx, x, y, width, height) {
        const radius = 4;
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制开关部分
    drawTogglePart(ctx, posX, posY, height, value) {
        const size = height * 0.6;
        const x = posX + 5;
        const y = posY + (height - size) / 2;
        
        // 外圆
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fillStyle = value ? "#4CAF50" : "#444444";
        ctx.fill();
        ctx.strokeStyle = value ? "#66BB6A" : "#666666";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 内部标记
        if (value) {
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2 - 3, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
        }
        
        return [x, size + 10]; // [起始位置, 宽度]
    }
    
    // 绘制数字控件部分
    drawNumberWidgetPart(ctx, posX, posY, height, value, direction = -1) {
        const totalWidth = 70;
        const arrowWidth = 15;
        const valueWidth = totalWidth - arrowWidth * 2;
        
        const startX = direction === -1 ? posX - totalWidth : posX;
        const y = posY + 2;
        const h = height - 4;
        
        // 左箭头
        ctx.fillStyle = "#666666";
        ctx.fillRect(startX, y, arrowWidth, h);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("<", startX + arrowWidth/2, posY + height/2);
        
        // 数值区域
        const valueX = startX + arrowWidth;
        ctx.fillStyle = "#444444";
        ctx.fillRect(valueX, y, valueWidth, h);
        
        // 数值文字
        ctx.fillStyle = value !== 1.0 ? "#FFC107" : "#CCCCCC";
        ctx.font = "11px Arial";
        ctx.fillText(value.toFixed(1), valueX + valueWidth/2, posY + height/2);
        
        // 右箭头
        const rightX = valueX + valueWidth;
        ctx.fillStyle = "#666666";
        ctx.fillRect(rightX, y, arrowWidth, h);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px Arial";
        ctx.fillText(">", rightX + arrowWidth/2, posY + height/2);
        
        return [
            [startX, arrowWidth],           // 左箭头
            [valueX, valueWidth],           // 数值区域
            [rightX, arrowWidth]            // 右箭头
        ];
    }
    
    // 文字适应宽度
    fitString(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) {
            return text;
        }
        
        while (text.length > 3 && ctx.measureText(text + "...").width > maxWidth) {
            text = text.substring(0, text.length - 1);
        }
        return text + "...";
    }
    
    // 鼠标事件处理
    mouse(event, pos, node) {
        const localY = pos[1] - this.last_y;
        const localX = pos[0];
        
        if (localY < 0 || localY > 25) {
            ArtistPreview.hide(); // 鼠标离开时隐藏预览
            return false;
        }
        
        // 检查各个点击区域
        for (const [areaName, area] of Object.entries(this.hitAreas)) {
            const bounds = area.bounds;
            if (bounds.length === 4) { // [x, y, width, height]
                const [x, y, width, height] = bounds;
                if (localX >= x && localX <= x + width && localY >= y - this.last_y && localY <= y - this.last_y + height) {
                    if (event.type === "pointermove" && area.onHover) {
                        area.onHover(event, pos, node);
                    } else if (event.type === "pointerdown" && area.onDown) {
                        ArtistPreview.hide();
                        return area.onDown(event, pos, node);
                    } else if (event.type === "pointerdown" && area.onClick) {
                        ArtistPreview.hide();
                        return area.onClick(event, pos, node);
                    } else if (event.type === "pointermove" && area.onMove) {
                        return area.onMove(event, pos, node);
                    }
                }
            } else if (bounds.length === 2) { // [x, width] - 老格式兼容
                const [x, width] = bounds;
                if (localX >= x && localX <= x + width) {
                    if (event.type === "pointerdown" && area.onDown) {
                        ArtistPreview.hide();
                        return area.onDown(event, pos, node);
                    } else if (event.type === "pointerdown" && area.onClick) {
                        ArtistPreview.hide();
                        return area.onClick(event, pos, node);
                    }
                }
            }
        }
        
        // 右键菜单
        if (event.type === "pointerdown" && event.button === 2) {
            ArtistPreview.hide();
            this.showContextMenu(event, node);
            return true;
        }
        
        return false;
    }
    
    // 事件处理方法
    onToggleDown(event, pos, node) {
        this.value.on = !this.value.on;
        node.setDirtyCanvas(true, true);
        return true;
    }
    
    onArtistClick(event, pos, node) {
        const menu = ARTISTS_LIST.map(artist => ({
            content: artist === this.value.artist ? `● ${artist}` : artist,
            callback: () => {
                this.value.artist = artist;
                node.setDirtyCanvas(true, true);
            }
        }));
        
        new LiteGraph.ContextMenu(menu, {
            event: event,
            title: "Choose Artist",
            className: "dark"
        });
        
        return true;
    }
    
    onArtistHover(event, pos, node) {
        const artistName = this.value.artist;
        if (artistName && artistName !== "None") {
            const canvasRect = node.graph.canvas.canvas.getBoundingClientRect();
            ArtistPreview.show(artistName, canvasRect.left + pos[0], canvasRect.top + pos[1]);
        }
    }
    
    onStrengthDecDown(event, pos, node) {
        this.stepStrength(-1);
        node.setDirtyCanvas(true, true);
        return true;
    }
    
    onStrengthIncDown(event, pos, node) {
        this.stepStrength(1);
        node.setDirtyCanvas(true, true);
        return true;
    }
    
    onStrengthValUp(event, pos, node) {
        if (this.haveMouseMovedStrength) return true;
        
        const canvas = app.canvas;
        canvas.prompt("Value", this.value.strength, (v) => {
            this.value.strength = Number(v);
            node.setDirtyCanvas(true, true);
        }, event);
        
        return true;
    }
    
    onStrengthAnyMove(event, pos, node) {
        if (event.deltaX) {
            this.haveMouseMovedStrength = true;
            this.value.strength = (this.value.strength || 1.0) + event.deltaX * 0.05;
            this.value.strength = Math.max(0.0, Math.min(2.0, this.value.strength));
            node.setDirtyCanvas(true, true);
        }
        return true;
    }
    
    stepStrength(direction) {
        const step = 0.05;
        let strength = (this.value.strength || 1.0) + step * direction;
        this.value.strength = Math.round(strength * 100) / 100;
        this.value.strength = Math.max(0.0, Math.min(2.0, this.value.strength));
    }
    
    showContextMenu(event, node) {
        const menu = [
            {
                content: this.value.on ? "❌ Disable" : "✅ Enable",
                callback: () => {
                    this.value.on = !this.value.on;
                    node.setDirtyCanvas(true, true);
                }
            },
            null,
            {
                content: "⚖️ Weight 0.5",
                callback: () => {
                    this.value.strength = 0.5;
                    node.setDirtyCanvas(true, true);
                }
            },
            {
                content: "⚖️ Weight 1.0",
                callback: () => {
                    this.value.strength = 1.0;
                    node.setDirtyCanvas(true, true);
                }
            },
            {
                content: "⚖️ Weight 1.5",
                callback: () => {
                    this.value.strength = 1.5;
                    node.setDirtyCanvas(true, true);
                }
            }
        ];
        
        new LiteGraph.ContextMenu(menu, {
            event: event,
            title: "Artist Options",
            className: "dark"
        });
    }
    
    onMouseUp(event, pos, node) {
        this.haveMouseMovedStrength = false;
    }
    
    computeSize() {
        return [0, 25];
    }
    
    serializeValue() {
        return { ...this.value };
    }
}

// 按钮widget
class RgthreeBetterButtonWidget extends RgthreeBaseWidget {
    constructor(name, callback) {
        super(name);
        this.callback = callback;
        this.type = "rgthree_button";
        this.serialize = false;
    }
    
    draw(ctx, node, width, posY, height) {
        const margin = 10;
        
        ctx.save();
        
        // 绘制按钮背景
        ctx.fillStyle = "#555555";
        ctx.fillRect(margin, posY + 2, width - margin * 2, height - 4);
        
        // 按钮边框
        ctx.strokeStyle = "#777777";
        ctx.lineWidth = 1;
        ctx.strokeRect(margin, posY + 2, width - margin * 2, height - 4);
        
        // 按钮文字
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
                return this.callback(event, pos, node);
            }
            return true;
        }
        return false;
    }
    
    computeSize() {
        return [0, 25];
    }
}

// 分隔线widget
class RgthreeDividerWidget extends RgthreeBaseWidget {
    constructor(options = {}) {
        super("divider");
        this.options = options;
        this.marginTop = options.marginTop || 4;
        this.marginBottom = options.marginBottom || 0;
        this.thickness = options.thickness || 0;
        this.serialize = false;
    }
    
    draw(ctx, node, width, posY, height) {
        this.last_y = posY;
        return height;
    }
    
    computeSize() {
        return [0, this.marginTop + this.thickness + this.marginBottom];
    }
}

// 主扩展注册
app.registerExtension({
    name: "Comfy.PowerArtistLoader",
    
    async init(app) {
        // 加载CSV数据
        await loadArtistsFromCSV();
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "PowerArtistLoader") {
            console.log("🎨 Registering PowerArtistLoader node (CSV powered)");
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                this.serialize_widgets = true;
                this.artistWidgetsCounter = 0;
                this.artistWidgets = [];
                this.widgetButtonSpacer = null;
                
                // 添加非artist widgets
                this.addNonArtistWidgets();
                
                // 添加第一个artist widget
                this.addNewArtistWidget();
                
                this.size = [300, Math.max(120, this.computeSize()[1])];
                this.setDirtyCanvas(true, true);
            };
            
            // 添加新的artist widget
            nodeType.prototype.addNewArtistWidget = function(artist) {
                this.artistWidgetsCounter++;
                const widget = new PowerArtistLoaderWidget("artist_" + this.artistWidgetsCounter);
                
                if (artist) {
                    widget.value = { on: true, artist: artist, strength: 1.0 };
                }
                
                // 在按钮之前插入
                if (this.widgetButtonSpacer) {
                    const spacerIndex = this.widgets.indexOf(this.widgetButtonSpacer);
                    this.widgets.splice(spacerIndex, 0, widget);
                } else {
                    this.widgets.push(widget);
                }
                
                this.artistWidgets.push(widget);
                
                // 重新计算大小
                this.size = [300, Math.max(120, this.computeSize()[1])];
                this.setDirtyCanvas(true, true);
                
                return widget;
            };
            
            // 添加非artist widgets
            nodeType.prototype.addNonArtistWidgets = function() {
                // 间隔
                this.widgetButtonSpacer = new RgthreeDividerWidget({ marginTop: 4, marginBottom: 0, thickness: 0 });
                this.widgets.push(this.widgetButtonSpacer);
                
                // 添加按钮
                const addButton = new RgthreeBetterButtonWidget("➕ Add Artist", (event, pos, node) => {
                    this.addNewArtistWidget();
                    return true;
                });
                
                this.widgets.push(addButton);
            };
            
            console.log("🎨 PowerArtistLoader extension registered successfully (CSV powered)");
        }
    }
});

console.log("🎨 PowerArtistLoader extension loaded successfully (CSV powered)");