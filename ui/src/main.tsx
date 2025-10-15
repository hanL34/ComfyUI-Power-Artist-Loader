import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ArtistManager from './ArtistManager';
import './styles.css';

// 等待 ComfyUI 应用初始化
app.registerExtension({
  name: "PowerArtistLoader.Manager",
  
  async setup() {
    try {
      // 添加右键菜单选项
      const getCanvasMenuOptions = app.canvas.getCanvasMenuOptions;
      app.canvas.getCanvasMenuOptions = function () {
        const options = getCanvasMenuOptions.apply(this, arguments);
        
        options.push({
          content: "🎨 Artist Manager",
          callback: () => {
            openArtistManager();
          }
        });
        
        return options;
      };

      console.log("Power Artist Manager menu registered");
    } catch (error) {
      console.error("Failed to register Artist Manager:", error);
    }
  }
});

// 打开管理器窗口
function openArtistManager() {
  // 创建模态窗口
  const modal = document.createElement('div');
  modal.className = 'artist-manager-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const container = document.createElement('div');
  container.style.cssText = `
    width: 90%;
    height: 85%;
    max-width: 1200px;
    background: #1e1e1e;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;

  modal.appendChild(container);
  document.body.appendChild(modal);

  // 渲染React组件
  const root = createRoot(container);
  root.render(<ArtistManager api={api} onClose={() => {
    root.unmount();
    document.body.removeChild(modal);
  }} />);

  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      root.unmount();
      document.body.removeChild(modal);
    }
  });
}
