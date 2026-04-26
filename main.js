import { generateFrames, extractFramesFromVideo, uploadImage } from './src/ai_engine.js';


class ShimejiTool {
    constructor() {
        this.currentState = 'idle';
        this.frames = {
            idle: [],
            walk: [],
            climb_left: [],
            climb_right: [],
            fall: [],
            sit: []
        };
        this.currentFrameIndex = 0;
        this.animationInterval = null;
        this.baseImage = null;
        this.publicImageUrl = null;
        this.currentView = 'live'; // 'live' hoặc 'frames'

        this.initElements();
        this.initEvents();
        this.startPreviewLoop();
    }

    initElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.shimejiPreview = document.getElementById('shimeji-preview');
        this.actionButtons = document.querySelectorAll('.action-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.autoDescBtn = document.getElementById('auto-desc-btn');
        this.charDescInput = document.getElementById('char-desc');
        this.frameStrip = document.getElementById('frame-strip');
        this.exportBtn = document.getElementById('export-btn');
        
        // Tabs
        this.tabLive = document.getElementById('tab-live');
        this.tabFrames = document.getElementById('tab-frames');
        this.liveView = document.getElementById('live-view');
        this.framesView = document.getElementById('frames-view');
        this.frameGrid = document.getElementById('frame-grid');

        // Donation Widget
        this.qrModal = document.getElementById('qr-modal');
        this.openQrBtn = document.getElementById('open-qr');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.copyPayoneerBtn = document.getElementById('copy-payoneer');
        this.copyBankStkBtn = document.getElementById('copy-bank-stk');
        this.messageContainer = document.getElementById('antd-message-container');
    }

    showAntdMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `antd-message ${type}`;
        
        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
        message.innerHTML = `<span class="icon">${icon}</span> <span>${text}</span>`;
        
        this.messageContainer.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            message.style.transition = 'all 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    initEvents() {
        // Modal QR Events
        if (this.openQrBtn) {
            this.openQrBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.qrModal.classList.add('active');
            });
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.qrModal.classList.remove('active'));
        }

        if (this.copyPayoneerBtn) {
            this.copyPayoneerBtn.addEventListener('click', () => {
                navigator.clipboard.writeText('minhducanhhuy@gmail.com');
                this.showAntdMessage('Đã sao chép Email Payoneer!');
            });
        }

        if (this.copyBankStkBtn) {
            this.copyBankStkBtn.addEventListener('click', () => {
                navigator.clipboard.writeText('9937683773');
                this.showAntdMessage('Đã sao chép số tài khoản MBBank!');
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === this.qrModal) this.qrModal.classList.remove('active');
        });

        // Upload logic
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = 'var(--primary)';
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.style.borderColor = 'var(--glass-border)';
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileUpload(e.dataTransfer.files[0]);
        });

        // Action selection
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.actionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentState = btn.dataset.state;
                this.currentFrameIndex = 0;
                this.updateFrameStrip();
                this.updatePreview();
                if (this.currentView === 'frames') {
                    this.updateFrameGrid();
                }
            });
        });

        // Generate logic
        this.generateBtn.addEventListener('click', () => this.generateAnimation());

        // Export logic
        this.exportBtn.addEventListener('click', () => this.exportPNGs());

        // Nút phân tích ảnh tự động (Đã thay thế bằng Direct Reference)
        this.autoDescBtn.addEventListener('click', () => {
            alert('Tính năng này đã được tích hợp trực tiếp vào quá trình Render. Bạn chỉ cần tải ảnh và nhấn Generate!');
        });


        // Tab Switching
        this.tabLive.addEventListener('click', () => this.switchView('live'));
        this.tabFrames.addEventListener('click', () => this.switchView('frames'));

        // Interaction (Drag character)
        let isDragging = false;
        let startX, startY;

        this.shimejiPreview.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - this.shimejiPreview.offsetLeft;
            startY = e.clientY - this.shimejiPreview.offsetTop;
            this.shimejiPreview.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x = e.clientX - startX;
            const y = e.clientY - startY;
            this.shimejiPreview.style.left = `${x}px`;
            this.shimejiPreview.style.top = `${y}px`;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            this.shimejiPreview.style.transition = 'transform 0.1s linear';
        });
    }

    switchView(view) {
        this.currentView = view;
        if (view === 'live') {
            this.tabLive.classList.add('active');
            this.tabFrames.classList.remove('active');
            this.liveView.classList.add('active');
            this.framesView.classList.remove('active');
        } else {
            this.tabLive.classList.remove('active');
            this.tabFrames.classList.add('active');
            this.liveView.classList.remove('active');
            this.framesView.classList.add('active');
            this.updateFrameGrid();
        }
    }

    handleFileUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.baseImage = e.target.result;
            this.publicImageUrl = null;
            this.shimejiPreview.style.backgroundImage = `url(${this.baseImage})`;
            
            if (this.frames.idle.length === 0) {
                this.frames.idle = [this.baseImage];
            }
            this.updateFrameStrip();
            if (this.currentView === 'frames') this.updateFrameGrid();
        };
        reader.readAsDataURL(file);
    }

    async generateAnimation() {
        if (!this.baseImage) {
            alert('Vui lòng tải ảnh gốc lên trước!');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span>🧠</span> Gemini is analyzing...';

        try {
            // Bước 1: Upload ảnh nếu chưa có
            if (!this.publicImageUrl) {
                this.publicImageUrl = await uploadImage(this.baseImage);
            }

            // Bước 2: Gọi thẳng Imagen 4 với ảnh gốc làm tham chiếu (Image Reference)
            this.generateBtn.innerHTML = '<span>🎬</span> Rendering with Imagen 4...';
            console.log(`🚀 Bắt đầu gọi Google Imagen 4 (Direct Reference) cho hành động: ${this.currentState}`);
            
            const videoUrl = await generateFrames(this.baseImage, this.currentState);




            // Bước 3: Tách Sprite Sheet thành các frame lẻ và khớp kích thước gốc
            this.generateBtn.innerHTML = '<span>✂️</span> Slicing & Resizing...';
            const frames = await extractFramesFromVideo(videoUrl, this.baseImage);
            
            this.frames[this.currentState] = frames;
            this.updateFrameStrip();
            if (this.currentView === 'frames') this.updateFrameGrid();
            
            alert(`Thành công! Gemini đã nhận diện và tạo ${frames.length} frame cho ${this.currentState}.`);
        } catch (error) {
            console.error(error);
            alert(`Lỗi: ${error.message || 'Không thể thực hiện quá trình AI'}`);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<span>🚀</span> Generate Assets';
        }
    }


    exportPNGs() {
        const currentFrames = this.frames[this.currentState] || [];
        if (currentFrames.length === 0) {
            alert('Không có frame nào để xuất!');
            return;
        }

        currentFrames.forEach((dataUrl, index) => {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${this.currentState}_${String(index).padStart(2, '0')}.png`;
            link.click();
        });
    }

    updateFrameStrip() {
        this.frameStrip.innerHTML = '';
        const currentFrames = this.frames[this.currentState] || [];
        currentFrames.forEach((frame, index) => {
            const item = document.createElement('div');
            item.className = 'frame-item';
            item.style.backgroundImage = `url(${frame})`;
            this.frameStrip.appendChild(item);
        });
    }

    updateFrameGrid() {
        this.frameGrid.innerHTML = '';
        const currentFrames = this.frames[this.currentState] || [];
        if (currentFrames.length === 0) {
            this.frameGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Chưa có frame nào cho hành động này. Hãy nhấn Generate!</div>';
            return;
        }
        
        currentFrames.forEach((frame, index) => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.style.backgroundImage = `url(${frame})`;
            item.innerHTML = `<span>#${index + 1}</span>`;
            this.frameGrid.appendChild(item);
        });
    }

    startPreviewLoop() {
        setInterval(() => {
            if (this.currentView !== 'live') return;
            const currentFrames = this.frames[this.currentState] || [];
            if (currentFrames.length > 0) {
                this.currentFrameIndex = (this.currentFrameIndex + 1) % currentFrames.length;
                this.updatePreview();
            }
        }, 200);
    }

    updatePreview() {
        const currentFrames = this.frames[this.currentState] || [];
        if (currentFrames.length > 0) {
            const frame = currentFrames[this.currentFrameIndex];
            this.shimejiPreview.style.backgroundImage = `url(${frame})`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ShimejiTool();
});
