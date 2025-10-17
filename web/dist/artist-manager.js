// Artist Manager - 修复版：支持多行keywords + CSV同步
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
            
            .artist-table input[type="text"] {
                width: 100% !important;
                padding: 4px 6px !important;
                height: 28px !important;
                font-size: 13px !important;
                box-sizing: border-box !important;
                margin: 0 !important;
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
            
            /* 拖拽相关样式 */
            .artist-table td:nth-child(1) {
                cursor: grab !important;
                user-select: none !important;
                text-align: center !important;
                color: #888 !important;
            }
            
            .artist-table td:nth-child(1):active {
                cursor: grabbing !important;
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
                padding: 0;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
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
                transition: border-color 0.2s;
            }
            
            .keywords-modal-textarea:focus {
                outline: none;
                border-color: #4caf50;
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
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
                
                if (nameInput && keywordsInput && imageInput) {
                    const name = nameInput.value.trim();
                    if (name) {
                        const keywordsValue = keywordsInput.value;
                        
                        artists.push({
                            name: name,
                            keywords: keywordsValue,
                            image: imageInput.value.trim()
                        });
                        
                        console.log(`行 ${index + 1}: ${name} - Keywords length: ${keywordsValue.length}`);
                    }
                }
            });
            
            console.log(`📤 准备保存 ${artists.length} 个画师到 CSV`);
            
            const response = await fetch('/power_artist_loader/csv/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ artists: artists })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ 成功保存到 CSV:', result.message);
                return { success: true, message: result.message };
            } else {
                console.error('❌ 保存失败:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ 保存出错:', error);
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
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }
    
    // 创建模态框
    function createModal(artistName, keywords, rowElement) {
        const existing = document.querySelector('.keywords-modal-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'keywords-modal-overlay';
        
        const escapedKeywords = keywords
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        
        overlay.innerHTML = `
            <div class="keywords-modal">
                <div class="keywords-modal-header">
                    <div class="keywords-modal-title">编辑 Keywords - ${artistName}</div>
                    <button class="keywords-modal-close">×</button>
                </div>
                <div class="keywords-modal-body">
                    <textarea class="keywords-modal-textarea" placeholder="输入关键词，支持换行...">${escapedKeywords}</textarea>
                </div>
                <div class="keywords-modal-footer">
                    <button class="keywords-modal-btn keywords-modal-btn-cancel">取消</button>
                    <button class="keywords-modal-btn keywords-modal-btn-save">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const textarea = overlay.querySelector('.keywords-modal-textarea');
        const modal = overlay.querySelector('.keywords-modal');
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
        
        const close = () => overlay.remove();
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        
        overlay.querySelector('.keywords-modal-close').addEventListener('click', close);
        overlay.querySelector('.keywords-modal-btn-cancel').addEventListener('click', close);
        
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
            const row = e.target.closest('tr');
            if (!row || !row.parentElement.matches('.artist-table tbody')) return;
            
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
                
                row.draggable = true;
                row.addEventListener('dragstart', handleDragStart);
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
    
    // 初始化
    function init() {
        injectStyles();
        initDragSort();
        attachKeywordsEditor();
        console.log('✅ Artist Manager 功能已启用');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    setTimeout(init, 1000);
})();
