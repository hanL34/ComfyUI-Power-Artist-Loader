// Artist Manager - 修复版：支持多行keywords + CSV同步 + 拖拽修复 + 窗口拖动
// 放置: web/js/artist-manager-enhanced.js

(function() {
    'use strict';
    
    function injectStyles() {
        if (document.getElementById('artist-manager-enhanced')) return;
        
        const style = document.createElement('style');
        style.id = 'artist-manager-enhanced';
        style.textContent = `
            /* 紧凑布局优化 */
            .artist-table { 
                border-collapse: collapse !important; 
                width: 100% !important;
            }
            
            .artist-table th:nth-child(1), .artist-table td:nth-child(1) { width: 40px !important; min-width: 40px !important; }
            .artist-table th:nth-child(2), .artist-table td:nth-child(2) { width: 20% !important; }
            .artist-table th:nth-child(3), .artist-table td:nth-child(3) { width: 45% !important; }
            .artist-table th:nth-child(4), .artist-table td:nth-child(4) { width: 25% !important; }
            .artist-table th:nth-child(5), .artist-table td:nth-child(5) { width: 60px !important; min-width: 60px !important; }
            
            .artist-table th { 
                padding: 8px 4px !important; 
                font-size: 13px !important;
            }
            
            .artist-table td { 
                padding: 4px !important; 
                vertical-align: middle !important;
            }
            
            /* ⭐ 关键修复：所有输入框和文本区域完全禁用拖拽 */
            .artist-table input[type="text"],
            .artist-table textarea {
                width: 100% !important;
                padding: 4px 6px !important;
                font-size: 13px !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                user-select: text !important;
                -webkit-user-drag: none !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                pointer-events: auto !important;
            }
            
            .artist-table input[type="text"] {
                height: 28px !important;
            }
            
            .artist-table td:nth-child(3) input {
                cursor: pointer !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }
            
            .artist-table tbody tr {
                border-bottom: 1px solid #333 !important;
            }
            
            /* 拖拽相关样式 - 只应用于序号列 */
            .artist-table td:nth-child(1) {
                cursor: grab !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                text-align: center !important;
                color: #888 !important;
            }
            
            .artist-table td:nth-child(1):active {
                cursor: grabbing !important;
            }
            
            /* ⭐ 其他列明确禁用拖拽 */
            .artist-table td:not(:nth-child(1)) {
                cursor: default !important;
                user-select: text !important;
                -webkit-user-select: text !important;
            }
            
            .artist-table tbody tr.dragging {
                opacity: 0.5 !important;
                background: #444 !important;
            }
            
            .artist-table tbody tr.drag-over {
                border-top: 3px solid #4caf50 !important;
            }
            
            .artist-table tbody tr.drag-over-bottom {
                border-bottom: 3px solid #4caf50 !important;
            }
            
            /* 拖拽手柄提示 */
            .artist-table td:nth-child(1)::before {
                content: '⠿';
                font-size: 16px;
                color: #666;
                transition: color 0.2s;
            }
            
            .artist-table tbody tr:hover td:nth-child(1)::before {
                color: #4caf50;
            }
            
            /* 模态框样式 */
            .keywords-modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.15s;
            }
            
            .keywords-modal {
                background: #2a2a2a;
                border-radius: 6px;
                width: 90%;
                max-width: 650px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
            }
            
            .keywords-modal-header {
                padding: 14px 18px;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .keywords-modal-title {
                font-size: 15px;
                font-weight: 600;
                color: #fff;
            }
            
            .keywords-modal-close {
                background: none;
                border: none;
                color: #999;
                font-size: 22px;
                cursor: pointer;
                transition: color 0.2s;
            }
            
            .keywords-modal-close:hover { color: #fff; }
            
            .keywords-modal-body {
                padding: 18px;
                flex: 1;
                overflow-y: auto;
            }
            
            .keywords-modal-textarea {
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
                box-sizing: border-box;
            }
            
            .keywords-modal-textarea:focus {
                outline: none;
                border-color: #4caf50;
            }
            
            .keywords-modal-footer {
                padding: 14px 18px;
                border-top: 1px solid #444;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .keywords-modal-btn {
                padding: 7px 18px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }
            
            .keywords-modal-btn-cancel {
                background: #444;
                color: #ddd;
            }
            
            .keywords-modal-btn-cancel:hover { background: #555; }
            
            .keywords-modal-btn-save {
                background: #4caf50;
                color: #fff;
            }
            
            .keywords-modal-btn-save:hover { background: #45a049; }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Artist Manager Enhanced 已加载');
    }
    
    // 保存数据到后端 CSV
    async function saveToBackend() {
        try {
            const tbody = document.querySelector('.artist-table tbody');
            if (!tbody) {
                console.warn('⚠️ 未找到表格 tbody');
                return { success: false, error: '未找到表格' };
            }
            
            const rows = tbody.querySelectorAll('tr');
            const artists = [];
            
            rows.forEach((row, index) => {
                const nameInput = row.querySelector('td:nth-child(2) input');
                const keywordsInput = row.querySelector('td:nth-child(3) input');
                const imageInput = row.querySelector('td:nth-child(4) input');
                
                const name = nameInput ? nameInput.value.trim() : '';
                const keywords = keywordsInput ? keywordsInput.value.trim() : '';
                const image = imageInput ? imageInput.value.trim() : '';
                
                if (name) {
                    artists.push({ name, keywords, image });
                }
            });
            
            console.log('💾 保存数据到后端:', { count: artists.length });
            
            const response = await fetch('/power_artist_loader/csv/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artists })
            });
            
            const result = await response.json();
            console.log('📥 后端响应:', result);
            
            return result;
        } catch (error) {
            console.error('❌ 保存失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
    
    // 创建模态框
    function createModal(artistName, initialKeywords, rowElement) {
        const overlay = document.createElement('div');
        overlay.className = 'keywords-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'keywords-modal';
        
        modal.innerHTML = `
            <div class="keywords-modal-header">
                <div class="keywords-modal-title">✏️ Edit Keywords - ${artistName}</div>
                <button class="keywords-modal-close" title="Close (ESC)">×</button>
            </div>
            <div class="keywords-modal-body">
                <textarea class="keywords-modal-textarea" placeholder="Enter keywords here...">${initialKeywords}</textarea>
            </div>
            <div class="keywords-modal-footer">
                <button class="keywords-modal-btn keywords-modal-btn-cancel">Cancel</button>
                <button class="keywords-modal-btn keywords-modal-btn-save">💾 Save</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const textarea = modal.querySelector('.keywords-modal-textarea');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        const close = () => {
            overlay.style.animation = 'fadeOut 0.2s';
            setTimeout(() => overlay.remove(), 200);
        };
        
        overlay.querySelector('.keywords-modal-close').addEventListener('click', close);
        overlay.querySelector('.keywords-modal-btn-cancel').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        
        // 保存按钮 - 直接更新DOM并保存
        overlay.querySelector('.keywords-modal-btn-save').addEventListener('click', async () => {
            const newKeywords = textarea.value;
            
            console.log('🔵 保存 Keywords:', {
                artist: artistName,
                length: newKeywords.length,
                preview: newKeywords.substring(0, 50)
            });
            
            // 直接更新对应行的 input
            const keywordsInput = rowElement.querySelector('td:nth-child(3) input');
            if (keywordsInput) {
                keywordsInput.value = newKeywords;
                console.log('✅ 更新 DOM input 值');
            }
            
            close();
            
            // 延迟保存
            setTimeout(async () => {
                const result = await saveToBackend();
                if (result.success) {
                    showNotification('保存成功', 'success');
                } else {
                    showNotification('保存失败', 'error');
                }
            }, 100);
        });
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        modal.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 拖拽排序功能
    function initDragSort() {
        let draggedRow = null;
        
        function handleDragStart(e) {
            // ⭐ 修复1: 只允许从序号列开始拖拽，明确检查触发元素
            const td = e.target.closest('td');
            if (!td || !td.matches('td:nth-child(1)')) {
                e.preventDefault();
                return false;
            }
            
            const row = td.closest('tr');
            if (!row || !row.parentElement.matches('.artist-table tbody')) {
                e.preventDefault();
                return;
            }
            
            draggedRow = row;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', row.innerHTML);
        }
        
        function handleDragOver(e) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const row = e.target.closest('tr');
            if (!row || !row.parentElement.matches('.artist-table tbody') || row === draggedRow) return;
            
            document.querySelectorAll('.artist-table tbody tr').forEach(r => {
                r.classList.remove('drag-over', 'drag-over-bottom');
            });
            
            const rect = row.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                row.classList.add('drag-over');
            } else {
                row.classList.add('drag-over-bottom');
            }
            
            return false;
        }
        
        function handleDragLeave(e) {
            const row = e.target.closest('tr');
            if (row) {
                row.classList.remove('drag-over', 'drag-over-bottom');
            }
        }
        
        async function handleDrop(e) {
            if (e.stopPropagation) e.stopPropagation();
            
            const targetRow = e.target.closest('tr');
            if (!targetRow || !targetRow.parentElement.matches('.artist-table tbody') || targetRow === draggedRow) return false;
            
            const tbody = targetRow.parentElement;
            const rect = targetRow.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                tbody.insertBefore(draggedRow, targetRow);
            } else {
                tbody.insertBefore(draggedRow, targetRow.nextSibling);
            }
            
            updateRowNumbers(tbody);
            
            console.log('🔄 拖拽完成，保存新顺序');
            
            setTimeout(async () => {
                const result = await saveToBackend();
                if (result.success) {
                    showNotification('顺序已保存', 'success');
                }
            }, 100);
            
            return false;
        }
        
        function handleDragEnd(e) {
            document.querySelectorAll('.artist-table tbody tr').forEach(row => {
                row.classList.remove('dragging', 'drag-over', 'drag-over-bottom');
            });
        }
        
        function updateRowNumbers(tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const numberCell = row.querySelector('td:nth-child(1)');
                if (numberCell) {
                    const textNode = Array.from(numberCell.childNodes).find(n => n.nodeType === 3);
                    if (textNode) {
                        textNode.textContent = index + 1;
                    }
                }
            });
        }
        
        const observer = new MutationObserver(() => {
            const rows = document.querySelectorAll('.artist-table tbody tr');
            rows.forEach(row => {
                if (row.dataset.dragEnabled) return;
                row.dataset.dragEnabled = 'true';
                
                // ⭐ 关键修复1：行本身不可拖动
                row.draggable = false;
                row.setAttribute('draggable', 'false');
                
                // 只在序号列上设置拖动手柄和事件
                const dragHandle = row.querySelector('td:nth-child(1)');
                if (dragHandle) {
                    dragHandle.draggable = true;
                    dragHandle.setAttribute('draggable', 'true');
                    dragHandle.style.cursor = 'grab';
                    
                    // ⭐ 只在序号列绑定dragstart事件
                    dragHandle.addEventListener('dragstart', handleDragStart);
                }
                
                // ⭐ 关键修复1：其他列完全禁用拖动，允许文本选择
                const otherCells = row.querySelectorAll('td:not(:nth-child(1))');
                otherCells.forEach(cell => {
                    cell.draggable = false;
                    cell.setAttribute('draggable', 'false');
                    cell.style.userSelect = 'text';
                    cell.style.webkitUserSelect = 'text';
                    cell.style.cursor = 'text';
                    
                    // ⭐ 输入框也要明确禁用拖动，允许文本选择
                    const inputs = cell.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        input.draggable = false;
                        input.setAttribute('draggable', 'false');
                        input.style.userSelect = 'text';
                        input.style.webkitUserSelect = 'text';
                        input.style.webkitUserDrag = 'none';
                        input.style.cursor = 'text';
                        
                        // ⭐ 阻止输入框上的所有拖拽事件
                        ['dragstart', 'drag', 'dragenter', 'dragleave'].forEach(eventName => {
                            input.addEventListener(eventName, (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            }, true);
                        });
                        
                        // ⭐ 允许文本选择，防止mousedown被拦截
                        input.addEventListener('mousedown', (e) => {
                            e.stopPropagation();
                        }, true);
                    });
                });
                
                // 其他拖动事件仍绑定在行上（用于drop target）
                row.addEventListener('dragover', handleDragOver);
                row.addEventListener('dragleave', handleDragLeave);
                row.addEventListener('drop', handleDrop);
                row.addEventListener('dragend', handleDragEnd);
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Keywords编辑器
    function attachKeywordsEditor() {
        const observer = new MutationObserver(() => {
            const keywordsCells = document.querySelectorAll('.artist-table td:nth-child(3)');
            
            keywordsCells.forEach(cell => {
                if (cell.dataset.editorAttached) return;
                cell.dataset.editorAttached = 'true';
                
                const input = cell.querySelector('input[type="text"]');
                if (!input) return;
                
                const openEditor = (e) => {
                    e.preventDefault();
                    
                    const row = cell.closest('tr');
                    const nameInput = row.querySelector('td:nth-child(2) input');
                    const artistName = nameInput ? nameInput.value : 'Unknown';
                    const currentKeywords = input.value;
                    
                    console.log('📝 打开编辑器:', {
                        artist: artistName,
                        keywords: currentKeywords.substring(0, 50)
                    });
                    
                    createModal(artistName, currentKeywords, row);
                };
                
                input.addEventListener('click', openEditor);
                input.addEventListener('focus', openEditor);
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // ⭐ 修复2: 窗口拖动功能
    function initWindowDrag() {
        const observer = new MutationObserver(() => {
            const managerWindow = document.getElementById('artist-manager-window');
            if (!managerWindow || managerWindow.dataset.dragInitialized) return;
            
            managerWindow.dataset.dragInitialized = 'true';
            
            const header = managerWindow.querySelector('div[style*="padding: 15px 20px"]');
            if (!header) return;
            
            // 设置标题栏可以拖动
            header.style.cursor = 'move';
            header.style.userSelect = 'none';
            
            let isDragging = false;
            let startX, startY, initialX, initialY;
            
            function startDrag(e) {
                // 只在空白区域或标题文字上允许拖动，按钮区域不触发
                const target = e.target;
                if (target.tagName === 'BUTTON' || target.closest('button')) {
                    return;
                }
                
                isDragging = true;
                
                // 获取当前窗口位置
                const rect = managerWindow.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                
                startX = e.clientX;
                startY = e.clientY;
                
                // 禁用transform，使用fixed定位
                managerWindow.style.transform = 'none';
                managerWindow.style.left = initialX + 'px';
                managerWindow.style.top = initialY + 'px';
                
                header.style.cursor = 'grabbing';
                e.preventDefault();
            }
            
            function drag(e) {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                const newX = initialX + deltaX;
                const newY = initialY + deltaY;
                
                managerWindow.style.left = newX + 'px';
                managerWindow.style.top = newY + 'px';
                
                e.preventDefault();
            }
            
            function stopDrag() {
                if (!isDragging) return;
                
                isDragging = false;
                header.style.cursor = 'move';
            }
            
            header.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            console.log('✅ 窗口拖动功能已启用');
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // 初始化
    function init() {
        injectStyles();
        initDragSort();
        attachKeywordsEditor();
        initWindowDrag(); // ⭐ 添加窗口拖动初始化
        console.log('✅ Artist Manager 功能已启用（包含窗口拖动）');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    setTimeout(init, 1000);
})();
