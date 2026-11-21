class InkOverlay {
  constructor() {
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.toolbar = null;
    this.floatingButton = null;
    this.currentTool = 'pencil';
    this.currentColor = '#ff0000';
    this.lineWidth = 3;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.drawings = [];
    this.tempDrawing = null;
    this.fontSize = 16;
    this.fontFamily = 'Arial';
    this.history = [];
    this.historyStep = -1;
    this.darkTheme = false;
    this.init();
  }
  init() {
    this.createFloatingButton();
    this.loadDrawings();
  }
  createFloatingButton() {
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'ink-overlay-floating-btn';
    this.floatingButton.innerHTML = '✏️';
    this.floatingButton.title = 'Активировать InkOverlay';
    this.floatingButton.addEventListener('click', () => {
      this.toggleOverlay();
    });
    document.body.appendChild(this.floatingButton);
  }
  toggleOverlay() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
  activate() {
    this.isActive = true;
    this.createCanvas();
    this.createToolbar();
    this.floatingButton.classList.add('active');
    this.redrawAll();
  }
  deactivate() {
    this.isActive = false;
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
    this.floatingButton.classList.remove('active');
  }
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'ink-overlay-canvas';
    this.canvas.width = document.documentElement.scrollWidth;
    this.canvas.height = document.documentElement.scrollHeight;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999997;
      pointer-events: auto;
      cursor: crosshair;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.setupHotkeys();
  }
  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'ink-overlay-toolbar';
    if (this.darkTheme) {
      this.toolbar.classList.add('dark-theme');
    }
    this.toolbar.innerHTML = `
      <div class="toolbar-section">
        <button class="tool-btn active" data-tool="pencil" title="Карандаш">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M2 18 L12 8 L16 12 L6 22 Z" fill="currentColor"/>
          </svg>
        </button>
        <button class="tool-btn" data-tool="line" title="Линия">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="2" y1="18" x2="18" y2="2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="tool-btn" data-tool="arrow" title="Стрелка">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="2" y1="18" x2="18" y2="2" stroke="currentColor" stroke-width="2"/>
            <polygon points="18,2 12,4 14,10" fill="currentColor"/>
          </svg>
        </button>
        <button class="tool-btn" data-tool="rectangle" title="Прямоугольник">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="3" y="3" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
        </button>
        <button class="tool-btn" data-tool="circle" title="Круг">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
        </button>
        <button class="tool-btn" data-tool="text" title="Текст">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <text x="5" y="15" font-size="16" fill="currentColor">T</text>
          </svg>
        </button>
        <button class="tool-btn" data-tool="eraser" title="Ластик">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="3" y="10" width="12" height="6" fill="currentColor"/>
            <line x1="2" y1="18" x2="18" y2="2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
     <div class="toolbar-section">
       <input type="color" id="color-picker" value="${this.currentColor}" title="Цвет">
       <input type="range" id="line-width" min="1" max="20" value="${this.lineWidth}" title="Толщина">
       <span id="width-display">${this.lineWidth}px</span>
     </div>
      <div class="toolbar-section">
        <button class="tool-btn" id="undo-btn" title="Отменить">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M8 5 L3 10 L8 15 M3 10 L17 10" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        <button class="tool-btn" id="redo-btn" title="Повторить">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M12 5 L17 10 L12 15 M17 10 L3 10" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        <button class="tool-btn" id="screenshot-btn" title="Скриншот">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" fill="none"/>
            <circle cx="10" cy="10" r="3" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        <button class="tool-btn" id="theme-btn" title="Темная тема">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" fill="currentColor"/>
          </svg>
        </button>
        <button class="tool-btn" id="clear-btn" title="Очистить всё">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor"/>
          </svg>
        </button>
      </div>
   `;
    document.body.appendChild(this.toolbar);
    this.toolbar.querySelectorAll('[инструмент данных]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectTool(e.currentTarget.dataset.tool);
        this.toolbar.querySelectorAll('[инструмент данных]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
    const colorPicker = this.toolbar.querySelector('#выбор цвета');
    colorPicker.addEventListener('change', (e) => {
      this.currentColor = e.target.value;
    });
    const widthSlider = this.toolbar.querySelector('#ширина линии');
    const widthDisplay = this.toolbar.querySelector('#ширина-дисплей');
    widthSlider.addEventListener('input', (e) => {
      this.lineWidth = parseInt(e.target.value);
      widthDisplay.textContent = `${this.lineWidth} пикселей`;
    });
    this.toolbar.querySelector('#скриншот-btn').addEventListener('click', () => {
      this.captureVisible();
    });
    this.toolbar.querySelector('#clear-btn').addEventListener('click', () => {
      this.clearAll();
    });
    this.toolbar.querySelector('#отменить-кнопку').addEventListener('click', () => {
      this.undo();
    });
    this.toolbar.querySelector('#redo-btn').addEventListener('click', () => {
      this.redo();
    });
    this.toolbar.querySelector('#theme-btn').addEventListener('click', () => {
      this.toggleTheme();
    });
  }
  selectTool(tool) {
    this.currentTool = tool;
    if (this.canvas) {
      this.canvas.style.cursor = tool === 'eraser' ? 'not-allowed' : 'crosshair';
    }
  }
  handleMouseDown(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left + window.scrollX;
    this.startY = e.clientY - rect.top + window.scrollY;
    if (this.currentTool === 'pencil') {
      this.tempDrawing = {
        type: 'pencil',
        points: [{ x: this.startX, y: this.startY }],
        color: this.currentColor,
        width: this.lineWidth
      };
    } else if (this.currentTool === 'text') {
      const text = prompt('Введите текст:');
      if (text) {
        this.drawings.push({
          type: 'text',
          text: text,
          x: this.startX,
          y: this.startY,
          color: this.currentColor,
          fontSize: this.fontSize,
          fontFamily: this.fontFamily
        });
        this.redrawAll();
        this.saveToHistory();
        this.autoSaveDrawings();
      }
      this.isDrawing = false;
    } else if (this.currentTool === 'eraser') {
      this.eraseAt(this.startX, this.startY);
    }
  }
  handleMouseMove(e) {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left + window.scrollX;
    const currentY = e.clientY - rect.top + window.scrollY;
    if (this.currentTool === 'pencil' && this.tempDrawing) {
      this.tempDrawing.points.push({ x: currentX, y: currentY });
      this.redrawAll();
      this.drawPreview();
    } else if (this.currentTool === 'eraser') {
      this.eraseAt(currentX, currentY);
    } else {
      this.redrawAll();
      this.drawPreview(currentX, currentY);
    }
  }
  handleMouseUp(e) {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left + window.scrollX;
    const endY = e.clientY - rect.top + window.scrollY;
    if (this.currentTool === 'pencil' && this.tempDrawing) {
      this.drawings.push(this.tempDrawing);
      this.tempDrawing = null;
    } else if (this.currentTool === 'arrow') {
      this.drawings.push({
        type: 'arrow',
        startX: this.startX,
        startY: this.startY,
        endX: endX,
        endY: endY,
        color: this.currentColor,
        width: this.lineWidth
      });
    } else if (this.currentTool === 'line') {
      this.drawings.push({
        type: 'line',
        startX: this.startX,
        startY: this.startY,
        endX: endX,
        endY: endY,
        color: this.currentColor,
        width: this.lineWidth
      });
    } else if (this.currentTool === 'rectangle') {
      this.drawings.push({
        type: 'rectangle',
        x: Math.min(this.startX, endX),
        y: Math.min(this.startY, endY),
        width: Math.abs(endX - this.startX),
        height: Math.abs(endY - this.startY),
        color: this.currentColor,
        lineWidth: this.lineWidth
      });
    } else if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
      this.drawings.push({
        type: 'circle',
        x: this.startX,
        y: this.startY,
        radius: radius,
        color: this.currentColor,
        lineWidth: this.lineWidth
      });
    }
    this.isDrawing = false;
    this.redrawAll();
    this.saveToHistory();
    this.autoSaveDrawings();
  }
  drawPreview(currentX, currentY) {
    if (this.currentTool === 'pencil' && this.tempDrawing) {
      const points = this.tempDrawing.points;
      this.ctx.strokeStyle = this.tempDrawing.color;
      this.ctx.lineWidth = this.tempDrawing.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.stroke();
    } else if (this.currentTool === 'arrow') {
      this.drawArrow(this.startX, this.startY, currentX, currentY, this.currentColor, this.lineWidth);
    } else if (this.currentTool === 'line') {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();
    } else if (this.currentTool === 'rectangle') {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeRect(
        Math.min(this.startX, currentX),
        Math.min(this.startY, currentY),
        Math.abs(currentX - this.startX),
        Math.abs(currentY - this.startY)
      );
    } else if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.beginPath();
      this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
  }
  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawings.forEach(drawing => {
      if (drawing.type === 'pencil') {
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        if (drawing.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
          for (let i = 1; i < drawing.points.length; i++) {
            this.ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
          }
          this.ctx.stroke();
        }
      } else if (drawing.type === 'arrow') {
        this.drawArrow(drawing.startX, drawing.startY, drawing.endX, drawing.endY, drawing.color, drawing.width);
      } else if (drawing.type === 'line') {
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.width;
        this.ctx.beginPath();
        this.ctx.moveTo(drawing.startX, drawing.startY);
        this.ctx.lineTo(drawing.endX, drawing.endY);
        this.ctx.stroke();
      } else if (drawing.type === 'rectangle') {
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.lineWidth;
        this.ctx.strokeRect(drawing.x, drawing.y, drawing.width, drawing.height);
      } else if (drawing.type === 'circle') {
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(drawing.x, drawing.y, drawing.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      } else if (drawing.type === 'text') {
        this.ctx.fillStyle = drawing.color;
        this.ctx.font = `${drawing.fontSize}пикселей ${drawing.fontFamily}`;
        this.ctx.fillText(drawing.text, drawing.x, drawing.y);
      }
    });
  }
  drawArrow(fromX, fromY, toX, toY, color, width) {
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.lineTo(toX, toY);
    this.ctx.fill();
  }
  eraseAt(x, y) {
    const eraseRadius = 30;
    const originalLength = this.drawings.length;
    this.drawings = this.drawings.filter(drawing => {
      if (drawing.type === 'text') {
        return !(Math.abs(drawing.x - x) < eraseRadius && Math.abs(drawing.y - y) < eraseRadius);
      } else if (drawing.type === 'pencil') {
        for (let point of drawing.points) {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          if (distance < eraseRadius) {
            return false;
          }
        }
        return true;
      } else if (drawing.type === 'arrow' || drawing.type === 'line') {
        const dist = this.pointToLineDistance(x, y, drawing.startX, drawing.startY, drawing.endX, drawing.endY);
        return dist > eraseRadius;
      } else if (drawing.type === 'rectangle') {
        const margin = eraseRadius;
        return !(x >= drawing.x - margin && x <= drawing.x + drawing.width + margin &&
                 y >= drawing.y - margin && y <= drawing.y + drawing.height + margin);
      } else if (drawing.type === 'circle') {
        const distance = Math.sqrt(Math.pow(drawing.x - x, 2) + Math.pow(drawing.y - y, 2));
        return !(Math.abs(distance - drawing.radius) < eraseRadius);
      }
      return true;
    });
    if (this.drawings.length !== originalLength) {
      this.redrawAll();
      this.saveToHistory();
      this.autoSaveDrawings();
    }
  }
  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  clearAll() {
    if (confirm('Очистить все рисунки на этой странице?')) {
      this.drawings = [];
      this.history = [];
      this.historyStep = -1;
      this.redrawAll();
      this.autoSaveDrawings();
    }
  }
  saveToHistory() {
    this.historyStep++;
    this.history = this.history.slice(0, this.historyStep);
    this.history.push(JSON.parse(JSON.stringify(this.drawings)));
    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }
  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.drawings = JSON.parse(JSON.stringify(this.history[this.historyStep]));
      this.redrawAll();
      this.autoSaveDrawings();
    }
  }
  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.drawings = JSON.parse(JSON.stringify(this.history[this.historyStep]));
      this.redrawAll();
      this.autoSaveDrawings();
    }
  }
  toggleTheme() {
    this.darkTheme = !this.darkTheme;
    if (this.darkTheme) {
      this.toolbar.classList.add('dark-theme');
      this.floatingButton.classList.add('dark-theme');
    } else {
      this.toolbar.classList.remove('dark-theme');
      this.floatingButton.classList.remove('dark-theme');
    }
  }
  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.key === 'Escape') {
        this.deactivate();
        e.preventDefault();
      }
    });
  }
  async saveDrawings() {
    const url = window.location.href;
    const data = {
      url: url,
      drawings: this.drawings,
      timestamp: Date.now()
    };
    chrome.storage.local.get(['savedDrawings'], (result) => {
      const saved = result.savedDrawings || {};
      saved[url] = data;
      chrome.storage.local.set({ savedDrawings: saved });
    });
  }
  loadDrawings() {
    const url = window.location.href;
    chrome.storage.local.get(['savedDrawings'], (result) => {
      const saved = result.savedDrawings || {};
      if (saved[url]) {
        this.drawings = saved[url].drawings || [];
        if (this.isActive) {
          this.redrawAll();
        }
      }
    });
  }
  autoSaveDrawings() {
    this.saveDrawings();
  }
  async captureVisible() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'captureVisible',
        format: 'png'
      });
      if (response && response.dataUrl) {
        await this.copyImageToClipboard(response.dataUrl);
        this.showNotification('Скриншот скопирован в буфер обмена!');
      }
    } catch (error) {
      this.showNotification('Ошибка при создании скриншота');
    }
  }
  async copyImageToClipboard(dataUrl) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (error) {
    }
  }
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'ink-overlay-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}
let inkOverlay = null;
if (!window.inkOverlayInitialized) {
  window.inkOverlayInitialized = true;
  inkOverlay = new InkOverlay();
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleOverlay') {
    inkOverlay.toggleOverlay();
  }
  return true;
});