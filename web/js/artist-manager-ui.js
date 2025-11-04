// Artist Manager UI Registration
// 放置: web/js/artist-manager-ui.js

import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

// 全局状态变量
let globalHasUnsavedChanges = false;

// 创建 Manager 窗口
function createManagerWindow() {
    // 检查是否已存在
    let existingWindow = document.getElementById('artist-manager-window');
    if (existingWindow) {
        existingWindow.style.display = 'block';
        return;
    }

    // 创建窗口容器
    const managerWindow = document.createElement('div');
    managerWindow.id = 'artist-manager-window';
    managerWindow.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 1200px;
        height: 80vh;
        background: #1a1a1a;
        border: 2px solid #4caf50;
        border-radius: 8px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    `;

    // 创建标题栏
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 15px 20px;
        background: #2a2a2a;
        border-bottom: 1px solid #444;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
    `;
    
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">🎨</span>
            <h2 style="margin: 0; color: #4caf50; font-size: 18px;">Artist Manager</h2>
            <span id="unsaved-indicator" style="display: none; color: #ff9800; font-size: 12px; margin-left: 10px;">● 未保存</span>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="undo-btn" style="
                padding: 6px 16px;
                background: #555;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            " disabled>↶ 撤销</button>
            <button id="save-artists-btn" style="
                padding: 6px 16px;
                background: #4caf50;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            ">💾 保存</button>
            <button id="add-artist-btn" style="
                padding: 6px 12px;
                background: #555;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            ">➕ 新增</button>
            <button id="close-manager-btn" style="
                padding: 6px 12px;
                background: #666;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            ">✕ 关闭</button>
        </div>
    `;

    // 创建内容区域
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 20px;
    `;

    // 创建表格
    const table = document.createElement('table');
    table.className = 'artist-table';
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        background: #2a2a2a;
    `;

    table.innerHTML = `
        <thead>
            <tr style="background: #333; border-bottom: 2px solid #4caf50;">
                <th style="padding: 12px; text-align: left; color: #4caf50; width: 50px;">#</th>
                <th style="padding: 12px; text-align: left; color: #4caf50; width: 20%;">画师名称</th>
                <th style="padding: 12px; text-align: left; color: #4caf50; width: 45%;">Keywords</th>
                <th style="padding: 12px; text-align: left; color: #4caf50; width: 25%;">预览图</th>
                <th style="padding: 12px; text-align: center; color: #4caf50; width: 80px;">操作</th>
            </tr>
        </thead>
        <tbody id="artist-table-body">
            <tr><td colspan="5" style="text-align: center; padding: 40px; color: #888;">加载中...</td></tr>
        </tbody>
    `;

    content.appendChild(table);

    // 组装窗口
    managerWindow.appendChild(header);
    managerWindow.appendChild(content);
    document.body.appendChild(managerWindow);
    
    // 暴露撤销函数到 window 对象供其他函数访问
    managerWindow.saveToUndoHistory = saveToUndoHistory;
    managerWindow.updateUndoButton = updateUndoButton;

    // 绑定事件
    let undoHistory = []; // 撤销历史栈
    const MAX_UNDO_STEPS = 20;
    
    // 保存当前状态到撤销历史
    function saveToUndoHistory() {
        const tbody = document.getElementById('artist-table-body');
        if (!tbody) return;
        
        const currentState = [];
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const nameInput = row.querySelector('td:nth-child(2) input');
            const keywordsInput = row.querySelector('td:nth-child(3) input');
            const imageInput = row.querySelector('td:nth-child(4) input');
            
            if (nameInput && keywordsInput && imageInput) {
                currentState.push({
                    name: nameInput.value,
                    keywords: keywordsInput.dataset.fullKeywords || keywordsInput.value,
                    image: imageInput.value
                });
            }
        });
        
        undoHistory.push(currentState);
        
        // 限制历史记录数量
        if (undoHistory.length > MAX_UNDO_STEPS) {
            undoHistory.shift();
        }
        
        updateUndoButton();
    }
    
    // 更新撤销按钮状态
    function updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            const count = undoHistory.length;
            undoBtn.disabled = count === 0;
            undoBtn.style.opacity = count === 0 ? '0.5' : '1';
            undoBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
        }
    }
    
    // 执行撤销
    function performUndo() {
        if (undoHistory.length === 0) return;
        
        const previousState = undoHistory.pop();
        updateUndoButton();
        
        // 恢复到之前的状态
        const tbody = document.getElementById('artist-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        previousState.forEach((artist, index) => {
            const row = createArtistRow(index + 1, artist);
            tbody.appendChild(row);
        });
        
        markAsUnsaved();
    }
    
    // 标记有未保存的变更
    function markAsUnsaved() {
        globalHasUnsavedChanges = true;
        const indicator = document.getElementById('unsaved-indicator');
        if (indicator) {
            indicator.style.display = 'inline';
        }
    }
    
    // 标记已保存
    function markAsSaved() {
        globalHasUnsavedChanges = false;
        const indicator = document.getElementById('unsaved-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    // 保存所有更改
    async function saveAllChanges() {
        const tbody = document.getElementById('artist-table-body');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        const artists = [];
        
        rows.forEach(row => {
            const nameInput = row.querySelector('td:nth-child(2) input');
            const keywordsInput = row.querySelector('td:nth-child(3) input');
            const imageInput = row.querySelector('td:nth-child(4) input');
            
            if (nameInput && keywordsInput && imageInput) {
                const name = nameInput.value.trim();
                if (name) {
                    artists.push({
                        name: name,
                        keywords: keywordsInput.dataset.fullKeywords || keywordsInput.value,
                        image: imageInput.value.trim()
                    });
                }
            }
        });
        
        try {
            const response = await fetch('/power_artist_loader/csv/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ artists: artists })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ 保存成功:', result.message);
                markAsSaved();
                // 清空撤销历史
                undoHistory = [];
                updateUndoButton();
                
                // 刷新节点下拉列表
                await refreshNodeDropdown();
                
                showNotification('保存成功', 'success');
                return true;
            } else {
                console.error('❌ 保存失败:', result.error);
                showNotification('保存失败: ' + result.error, 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ 保存出错:', error);
            showNotification('保存出错: ' + error.message, 'error');
            return false;
        }
    }
    
    // 刷新节点下拉列表
    async function refreshNodeDropdown() {
        try {
            console.log('🔄 开始刷新节点下拉列表...');
            
            // 添加时间戳避免缓存
            const timestamp = Date.now();
            const response = await fetch(`/power_artist_loader/artists?t=${timestamp}`);
            
            if (!response.ok) {
                console.warn('⚠️ 无法刷新画师列表，HTTP状态:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('📦 从服务器获取到', data.artists?.length || 0, '个画师');
            console.log('📋 画师列表:', data.artists?.map(a => a.name));
            
            if (data.artists) {
                // 方法1：直接更新 window 变量
                window.ARTISTS_DATA = data.artists;
                window.ARTISTS_LIST = ["None", ...data.artists.map(a => a.name)];
                
                console.log('✅ 已更新 window.ARTISTS_LIST:', window.ARTISTS_LIST);
                
                // 方法2：如果 power_artist_loader.js 使用局部变量，需要通过 refreshArtists 更新
                if (typeof window.refreshArtists === 'function') {
                    console.log('📢 调用 window.refreshArtists()');
                    await window.refreshArtists();
                    
                    // 再次验证更新结果
                    console.log('🔍 验证更新后的 window.ARTISTS_LIST:', window.ARTISTS_LIST);
                } else {
                    console.warn('⚠️ window.refreshArtists 函数不存在');
                }
                
                // ⭐ 方法3：调用refreshAllNodes刷新所有节点输出
                if (typeof window.refreshAllNodes === 'function') {
                    console.log('🔄 调用 window.refreshAllNodes() 刷新节点输出');
                    window.refreshAllNodes();
                } else {
                    console.warn('⚠️ window.refreshAllNodes 函数不存在，使用fallback');
                    // fallback：手动触发节点刷新
                    if (app && app.graph && app.graph._nodes) {
                        console.log('🔄 强制刷新所有节点...');
                        const nodes = app.graph._nodes.filter(n => n.type === "PowerArtistLoader");
                        nodes.forEach(node => {
                            if (node.widgets) {
                                // 触发节点重绘
                                node.setDirtyCanvas(true, true);
                            }
                        });
                        console.log(`✅ 已刷新 ${nodes.length} 个 PowerArtistLoader 节点`);
                    }
                }
            } else {
                console.warn('⚠️ 服务器返回的数据中没有 artists 字段');
            }
        } catch (error) {
            console.error('❌ 刷新节点下拉列表失败:', error);
        }
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10002;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }
    
    // 显示三按钮确认对话框
    function showThreeButtonDialog() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10004;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #2a2a2a;
                border-radius: 8px;
                padding: 24px;
                min-width: 400px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
            `;
            
            dialog.innerHTML = `
                <div style="font-size: 16px; color: #fff; margin-bottom: 20px;">
                    有未保存的更改，是否保存后关闭？
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="dialog-cancel" style="
                        padding: 8px 20px;
                        background: #555;
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                    <button id="dialog-no" style="
                        padding: 8px 20px;
                        background: #666;
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">否</button>
                    <button id="dialog-yes" style="
                        padding: 8px 20px;
                        background: #4caf50;
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">是</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            document.getElementById('dialog-yes').onclick = () => {
                overlay.remove();
                resolve('yes');
            };
            
            document.getElementById('dialog-no').onclick = () => {
                overlay.remove();
                resolve('no');
            };
            
            document.getElementById('dialog-cancel').onclick = () => {
                overlay.remove();
                resolve('cancel');
            };
        });
    }
    
    // 关闭按钮 - 三按钮提示
    document.getElementById('close-manager-btn').addEventListener('click', async () => {
        console.log('关闭按钮点击，当前未保存状态:', globalHasUnsavedChanges);
        if (globalHasUnsavedChanges) {
            const result = await showThreeButtonDialog();
            
            if (result === 'yes') {
                // 保存后关闭
                const saved = await saveAllChanges();
                if (saved) {
                    managerWindow.style.display = 'none';
                }
            } else if (result === 'no') {
                // 不保存直接关闭
                managerWindow.style.display = 'none';
            }
            // 'cancel' 则什么都不做，保持窗口打开
        } else {
            managerWindow.style.display = 'none';
        }
    });

    document.getElementById('save-artists-btn').addEventListener('click', () => {
        saveAllChanges();
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => {
        performUndo();
    });

    document.getElementById('add-artist-btn').addEventListener('click', () => {
        saveToUndoHistory(); // 保存当前状态
        addNewArtistRow();
        markAsUnsaved();
    });

    // 加载数据
    loadArtistsToTable();
}

// 加载画师数据到表格
async function loadArtistsToTable() {
    try {
        const response = await fetch('/power_artist_loader/csv/read');
        const data = await response.json();

        if (data.success && data.artists) {
            const tbody = document.getElementById('artist-table-body');
            tbody.innerHTML = '';

            data.artists.forEach((artist, index) => {
                const row = createArtistRow(index + 1, artist);
                tbody.appendChild(row);
            });

            console.log(`✅ 加载了 ${data.artists.length} 个画师`);
        }
    } catch (error) {
        console.error('❌ 加载画师数据失败:', error);
        const tbody = document.getElementById('artist-table-body');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #f44336;">加载失败</td></tr>';
    }
}

// 创建画师行
function createArtistRow(index, artist) {
    const row = document.createElement('tr');
    row.style.cssText = `
        border-bottom: 1px solid #333;
        transition: background 0.2s;
    `;
    row.onmouseenter = () => row.style.background = '#333';
    row.onmouseleave = () => row.style.background = 'transparent';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = artist.name;
    nameInput.style.cssText = 'width: 100%; padding: 6px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; color: white; font-size: 13px;';
    
    // 名称变化时保存历史并更新图片
    nameInput.addEventListener('input', () => {
        // 更新图片名称
        const imageName = nameInput.value.trim() ? `${nameInput.value.trim()}.jpg` : '';
        imageInput.value = imageName;
        
        const event = new CustomEvent('artist-changed');
        document.dispatchEvent(event);
    });
    
    // 失焦时保存到撤销历史
    nameInput.addEventListener('blur', () => {
        const windowObj = document.getElementById('artist-manager-window');
        if (windowObj && windowObj.saveToUndoHistory) {
            windowObj.saveToUndoHistory();
        }
    });

    const keywordsInput = document.createElement('input');
    keywordsInput.type = 'text';
    keywordsInput.value = artist.keywords.replace(/\n/g, ' ');
    keywordsInput.dataset.fullKeywords = artist.keywords;
    keywordsInput.style.cssText = 'width: 100%; padding: 6px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; color: white; font-size: 13px; cursor: pointer;';
    keywordsInput.readOnly = true;
    keywordsInput.onclick = () => editKeywords(keywordsInput, artist.name);

    const imageInput = document.createElement('input');
    imageInput.type = 'text';
    imageInput.value = artist.image || (artist.name ? `${artist.name}.jpg` : '');
    imageInput.readOnly = true;
    imageInput.style.cssText = 'width: 100%; padding: 6px; background: #0d0d0d; border: 1px solid #333; border-radius: 4px; color: #666; font-size: 13px; cursor: not-allowed;';
    imageInput.title = '预览图文件名（自动跟随画师名称）';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ 删除';
    deleteBtn.style.cssText = 'padding: 4px 8px; background: #666; border: none; border-radius: 4px; color: #ddd; cursor: pointer; font-size: 12px;';
    deleteBtn.onclick = () => deleteArtistRow(deleteBtn);

    const td1 = document.createElement('td');
    td1.style.cssText = 'padding: 8px; color: #888;';
    td1.textContent = index;

    const td2 = document.createElement('td');
    td2.style.padding = '8px';
    td2.appendChild(nameInput);

    const td3 = document.createElement('td');
    td3.style.padding = '8px';
    td3.appendChild(keywordsInput);

    const td4 = document.createElement('td');
    td4.style.padding = '8px';
    td4.appendChild(imageInput);

    const td5 = document.createElement('td');
    td5.style.cssText = 'padding: 8px; text-align: center;';
    td5.appendChild(deleteBtn);

    row.appendChild(td1);
    row.appendChild(td2);
    row.appendChild(td3);
    row.appendChild(td4);
    row.appendChild(td5);

    return row;
}

// 添加新行
function addNewArtistRow() {
    const tbody = document.getElementById('artist-table-body');
    const newIndex = tbody.children.length + 1;
    const newArtist = { name: '', keywords: '', image: '' };
    const row = createArtistRow(newIndex, newArtist);
    tbody.appendChild(row);
}

// 删除行 - 直接删除不提示
window.deleteArtistRow = function(button) {
    // 先保存当前状态到撤销历史
    const windowObj = document.getElementById('artist-manager-window');
    if (windowObj && windowObj.saveToUndoHistory) {
        windowObj.saveToUndoHistory();
    }
    
    const row = button.closest('tr');
    row.remove();
    
    // 更新序号
    const tbody = document.getElementById('artist-table-body');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
    
    // 标记有未保存变更
    const event = new CustomEvent('artist-changed');
    document.dispatchEvent(event);
};

// 编辑 Keywords
window.editKeywords = function(input, artistName) {
    // 保存当前状态到撤销历史
    const windowObj = document.getElementById('artist-manager-window');
    if (windowObj && windowObj.saveToUndoHistory) {
        windowObj.saveToUndoHistory();
    }
    
    // 获取当前完整的 keywords（包含换行符）
    const currentKeywords = input.dataset.fullKeywords || input.value;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10003;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #2a2a2a;
        border-radius: 6px;
        width: 90%;
        max-width: 650px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
    `;
    
    content.innerHTML = `
        <div style="padding: 14px 18px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 15px; font-weight: 600; color: #fff;">编辑 Keywords - ${artistName}</div>
            <button id="modal-close" style="background: none; border: none; color: #999; font-size: 22px; cursor: pointer;">×</button>
        </div>
        <div style="padding: 18px; flex: 1; overflow-y: auto;">
            <textarea id="keywords-textarea" style="
                width: 100%;
                min-height: 250px;
                max-height: 450px;
                background: #1a1a1a;
                border: 2px solid #444;
                border-radius: 4px;
                color: #fff;
                font-size: 14px;
                font-family: 'Consolas', 'Monaco', monospace;
                padding: 12px;
                resize: vertical;
                line-height: 1.5;
            ">${currentKeywords}</textarea>
        </div>
        <div style="padding: 14px 18px; border-top: 1px solid #444; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="modal-cancel" style="padding: 7px 18px; border: none; border-radius: 4px; background: #444; color: #ddd; cursor: pointer;">取消</button>
            <button id="modal-save" style="padding: 7px 18px; border: none; border-radius: 4px; background: #4caf50; color: #fff; cursor: pointer;">确认</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const textarea = document.getElementById('keywords-textarea');
    textarea.focus();
    
    const close = () => modal.remove();
    
    document.getElementById('modal-close').onclick = close;
    document.getElementById('modal-cancel').onclick = close;
    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
    
    document.getElementById('modal-save').onclick = () => {
        const newKeywords = textarea.value;
        
        // 更新 input 显示（单行）
        input.value = newKeywords.replace(/\n/g, ' ');
        // 保存完整内容（多行）
        input.dataset.fullKeywords = newKeywords;
        
        // ⭐ 标记有未保存变更
        const event = new CustomEvent('artist-changed');
        document.dispatchEvent(event);
        
        console.log('✏️ Keywords已编辑，等待点击保存按钮更新到CSV和节点');
        
        close();
    };
};

// 注册菜单项
app.registerExtension({
    name: "Comfy.PowerArtistManager",
    
    async setup() {
        // 监听变更事件
        document.addEventListener('artist-changed', () => {
            console.log('触发 artist-changed 事件');
            globalHasUnsavedChanges = true;
            const indicator = document.getElementById('unsaved-indicator');
            if (indicator) {
                indicator.style.display = 'inline';
                console.log('显示未保存指示器');
            }
        });
        
        // 添加到右键菜单
        const originalGetCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions;
        
        LGraphCanvas.prototype.getCanvasMenuOptions = function() {
            const options = originalGetCanvasMenuOptions.apply(this, arguments);
            
            // 添加分隔线
            options.push(null);
            
            // 添加 Artist Manager 菜单项
            options.push({
                content: "🎨 Artist Manager",
                callback: () => {
                    createManagerWindow();
                }
            });
            
            return options;
        };
        
        console.log('✅ Artist Manager UI 已注册到右键菜单');
    }
});
