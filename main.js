import store from './src/store/index.js';
import { setState, setFrames, setSpriteSheet, generateVideo } from './src/store/shimejiSlice.js';
import { extractFramesFromVideo, compileSpriteSheet } from './src/utils/canvas_processor.js';

class ShimejiTool {
    constructor() {
        this.initElements();
        this.initEvents();
        this.setupReduxSubscription();
        this.startPreviewLoop();
    }

    initElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.shimejiPreview = document.getElementById('shimeji-preview');
        this.actionButtons = document.querySelectorAll('.action-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.charDescInput = document.getElementById('char-desc');
        this.frameStrip = document.getElementById('frame-strip');
        this.exportBtn = document.getElementById('export-btn');
        this.messageContainer = document.getElementById('antd-message-container');
        this.videoDropZone = document.getElementById('video-drop-zone');
        this.videoInput = document.getElementById('video-input');
        this.frameCountSlider = document.getElementById('frame-count-slider');
        this.frameCountDisplay = document.getElementById('frame-count-display');
        this.resolutionSelect = document.getElementById('resolution-select');
        this.fpsSlider = document.getElementById('fps-slider');
        this.fpsDisplay = document.getElementById('fps-display');
        this.simModeToggle = document.getElementById('sim-mode-toggle');
        this.simPlaylistContainer = document.getElementById('sim-playlist');
        this.addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
        this.uploadToPlaylistBtn = document.getElementById('upload-to-playlist-btn');
        this.spriteUploadInput = document.getElementById('sprite-upload-input');

        // Sprite Sheet Grid Config (Sẽ thay đổi động)
        this.totalFrames = parseInt(this.frameCountSlider.value);
        this.currentFps = parseInt(this.fpsSlider.value);
        this.cols = Math.ceil(Math.sqrt(this.totalFrames));
        this.rows = Math.ceil(this.totalFrames / this.cols);
        this.currentFrameIndex = 0;
        this.baseImage = null;
        this.previewTimeout = null;

        // Simulator Config
        this.playlist = [];
        this.isSimMode = false;
        this.currentSimAsset = null;
    }

    setupReduxSubscription() {
        store.subscribe(() => {
            const state = store.getState().shimeji;
            this.updateUI(state);
        });
    }

    updateUI(state) {
        // Cập nhật trạng thái nút bấm
        if (state.status === 'loading') {
            this.generateBtn.disabled = true;
            this.generateBtn.innerHTML = '<span class="animate-spin inline-block mr-2">🔄</span> Generating Video...';
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<span>🚀</span> Generate Assets';
        }

        if (state.error) {
            this.showAntdMessage(state.error, 'error');
        }

        // Cập nhật preview nếu có sprite sheet
        if (state.spriteSheetUrl) {
            this.shimejiPreview.style.backgroundImage = `url(${state.spriteSheetUrl})`;
            this.shimejiPreview.style.backgroundSize = `${this.cols * 100}% ${this.rows * 100}%`;
        }
    }

    showAntdMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `antd-message ${type} shadow-lg px-4 py-2 rounded-lg bg-white flex items-center gap-2 mb-2 transition-all duration-300`;
        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
        message.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
        this.messageContainer.appendChild(message);
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    initEvents() {
        // Upload logic
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));

        // Action selection
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.actionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                store.dispatch(setState(btn.dataset.state));
                this.currentFrameIndex = 0;
            });
        });

        // Generate logic
        this.generateBtn.addEventListener('click', () => this.handleGenerate());

        // Local Video logic
        this.videoDropZone.addEventListener('click', () => this.videoInput.click());
        this.videoInput.addEventListener('change', (e) => this.handleVideoUpload(e.target.files[0]));

        // Slider logic
        this.frameCountSlider.addEventListener('input', (e) => {
            this.totalFrames = parseInt(e.target.value);
            this.frameCountDisplay.innerText = `${this.totalFrames} frames`;
            this.cols = Math.ceil(Math.sqrt(this.totalFrames));
            this.rows = Math.ceil(this.totalFrames / this.cols);
        });

        this.fpsSlider.addEventListener('input', (e) => {
            this.currentFps = parseInt(e.target.value);
            this.fpsDisplay.innerText = `${this.currentFps} FPS`;
        });

        // Simulator Mode Toggle
        this.simModeToggle.addEventListener('change', (e) => {
            this.isSimMode = e.target.checked;
            if (this.isSimMode) {
                this.showAntdMessage('Đã bật Pet Simulator Mode (Random Animation)!');
                this.pickRandomFromPlaylist();
            } else {
                this.showAntdMessage('Đã quay về chế độ animation đơn lẻ.');
                this.currentSimAsset = null;
            }
        });

        // Add to Playlist
        this.addToPlaylistBtn.addEventListener('click', () => {
            const state = store.getState().shimeji;
            if (state.spriteSheetUrl) {
                const asset = {
                    id: Date.now(),
                    url: state.spriteSheetUrl,
                    name: state.currentState,
                    cols: this.cols,
                    rows: this.rows,
                    total: this.totalFrames
                };
                this.playlist.push(asset);
                this.updatePlaylistUI();
                this.showAntdMessage(`Đã thêm ${state.currentState} vào playlist!`);
            } else {
                this.showAntdMessage('Vui lòng tạo hoặc nạp asset trước!', 'error');
            }
        });

        // Upload to Playlist
        this.uploadToPlaylistBtn.addEventListener('click', () => this.spriteUploadInput.click());
        this.spriteUploadInput.addEventListener('change', (e) => this.handleSpriteUpload(e.target.files));

        // Export logic
        this.exportBtn.addEventListener('click', () => {
            const state = store.getState().shimeji;
            if (state.spriteSheetUrl) {
                const link = document.createElement('a');
                link.download = `shimeji_${state.currentState}_spritesheet.png`;
                link.href = state.spriteSheetUrl;
                link.click();
                this.showAntdMessage('Đã bắt đầu tải Sprite Sheet!');
            } else {
                this.showAntdMessage('Vui lòng tạo asset trước khi tải!', 'error');
            }
        });
    }

    handleFileUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.baseImage = e.target.result;
            this.shimejiPreview.style.backgroundImage = `url(${this.baseImage})`;
            this.shimejiPreview.style.backgroundSize = 'contain';
            this.shimejiPreview.style.backgroundPosition = 'center';
            this.shimejiPreview.style.backgroundRepeat = 'no-repeat';
            this.showAntdMessage('Đã tải ảnh gốc thành công!');
        };
        reader.readAsDataURL(file);
    }

    async handleVideoUpload(file) {
        if (!file || !file.type.startsWith('video/')) {
            this.showAntdMessage('Vui lòng chọn tệp video .mp4!', 'error');
            return;
        }

        this.showAntdMessage('Đang nạp video nội bộ...');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const videoUrl = e.target.result;
            const state = store.getState().shimeji.currentState;

            try {
                this.showAntdMessage('Đang trích xuất frames từ video local...');
                const targetSize = parseInt(this.resolutionSelect.value);
                const frames = await extractFramesFromVideo(videoUrl, this.totalFrames);
                const spriteSheet = await compileSpriteSheet(frames, this.cols, targetSize);
                
                store.dispatch(setFrames({ actionType: state, frames }));
                store.dispatch(setSpriteSheet(spriteSheet));

                // Lưu lại Sprite Sheet (Dù video là local nhưng ta vẫn lưu Sprite Sheet mới)
                await fetch('/api/save-spritesheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spriteSheetBase64: spriteSheet, state })
                });

                this.showAntdMessage('Đã xử lý video local thành công!');
            } catch (error) {
                this.showAntdMessage('Lỗi xử lý video: ' + error.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    }

    async handleGenerate() {
        if (!this.baseImage) {
            this.showAntdMessage('Vui lòng tải ảnh gốc lên trước!', 'error');
            return;
        }

        const state = store.getState().shimeji.currentState;
        const fullPrompt = `${state}: ${this.charDescInput.value}`;
        
        try {
            // Bước 1: Gọi API sinh video qua Redux Thunk
            const resultAction = await store.dispatch(generateVideo({ 
                prompt: fullPrompt, 
                imageBase64: this.baseImage 
            }));

            if (generateVideo.fulfilled.match(resultAction)) {
                const outputUrl = resultAction.payload;
                console.log("[Client] Đã nhận dữ liệu từ AI. Độ dài data:", outputUrl.length);
                
                const isVideo = outputUrl.includes('video/mp4') || outputUrl.startsWith('data:video/mp4');

                if (isVideo) {
                    this.showAntdMessage('Video đã tải xong, đang bắt đầu trích xuất frames...');
                    const targetSize = parseInt(this.resolutionSelect.value);
                    console.log(`[Client] Bắt đầu trích xuất ${this.totalFrames} frames từ video...`);
                    const frames = await extractFramesFromVideo(outputUrl, this.totalFrames);
                    console.log(`[Client] Đã trích xuất xong ${frames.length} frames. Đang ghép Sprite Sheet...`);
                    const spriteSheet = await compileSpriteSheet(frames, this.cols, targetSize);
                    store.dispatch(setFrames({ actionType: state, frames }));
                    store.dispatch(setSpriteSheet(spriteSheet));
                    
                    // Tự động lưu Sprite Sheet vào folder output/ trên server
                    await fetch('/api/save-spritesheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ spriteSheetBase64: spriteSheet, state })
                    });
                } else {
                    this.showAntdMessage('Đã nhận diện Sprite Sheet trực tiếp!');
                    store.dispatch(setSpriteSheet(outputUrl));
                    store.dispatch(setFrames({ actionType: state, frames: new Array(16).fill(outputUrl) }));
                    
                    // Lưu luôn cả trường hợp sprite sheet trực tiếp
                    await fetch('/api/save-spritesheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ spriteSheetBase64: outputUrl, state })
                    });
                }
                
                this.showAntdMessage('Chúc mừng! Sprite Sheet đã sẵn sàng.');
                console.log("[Client] Hoàn tất toàn bộ quy trình.");
            }
        } catch (error) {
            console.error(error);
            this.showAntdMessage('Lỗi trong quá trình tạo asset: ' + error.message, 'error');
        }
    }

    updatePlaylistUI() {
        this.simPlaylistContainer.innerHTML = '';
        if (this.playlist.length === 0) {
            this.simPlaylistContainer.innerHTML = '<p class="text-[10px] text-white/30 text-center py-2">Chưa có animation nào</p>';
            return;
        }

        this.playlist.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-lg text-[10px]';
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-cover bg-center rounded border border-white/10" style="background-image: url(${asset.url})"></div>
                    <span class="font-medium text-white/70">${asset.name}</span>
                </div>
                <button class="text-red-400 hover:text-red-300" onclick="window.app.removeFromPlaylist(${asset.id})">✕</button>
            `;
            this.simPlaylistContainer.appendChild(item);
        });
    }

    removeFromPlaylist(id) {
        this.playlist = this.playlist.filter(a => a.id !== id);
        this.updatePlaylistUI();
    }

    handleSpriteUpload(files) {
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target.result;
                const asset = {
                    id: Date.now() + Math.random(), // Thêm random để tránh trùng ID khi upload nhanh
                    url: url,
                    name: file.name.replace('.png', ''),
                    cols: this.cols,
                    rows: this.rows,
                    total: this.totalFrames
                };
                this.playlist.push(asset);
                this.updatePlaylistUI();
                this.showAntdMessage(`Đã nạp ${file.name} vào playlist!`);
            };
            reader.readAsDataURL(file);
        });
    }

    pickRandomFromPlaylist() {
        if (this.playlist.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        this.currentSimAsset = this.playlist[randomIndex];
        this.currentFrameIndex = 0;
        console.log(`[Simulator] Chuyển sang hành động: ${this.currentSimAsset.name}`);
    }

    startPreviewLoop() {
        let lastTime = 0;
        
        const loop = (currentTime) => {
            if (!lastTime) lastTime = currentTime;
            const delta = currentTime - lastTime;
            const interval = 1000 / this.currentFps;

            if (delta >= interval) {
                const state = store.getState().shimeji;
                let spriteUrl, totalFrames, cols;

                if (this.isSimMode && this.currentSimAsset) {
                    spriteUrl = this.currentSimAsset.url;
                    totalFrames = this.currentSimAsset.total;
                    cols = this.currentSimAsset.cols;
                } else {
                    spriteUrl = state.spriteSheetUrl;
                    totalFrames = state.frames[state.currentState]?.length || 0;
                    cols = this.cols;
                }

                if (spriteUrl && totalFrames > 0) {
                    this.currentFrameIndex++;
                    
                    // Xử lý Seamless Loop: 
                    // Chúng ta sử dụng (totalFrames - 1) làm điểm dừng để bỏ qua frame cuối bị trùng lặp với frame đầu
                    const effectiveFrames = totalFrames > 1 ? totalFrames - 1 : totalFrames;

                    if (this.currentFrameIndex >= effectiveFrames) {
                        this.currentFrameIndex = 0;
                        
                        if (this.isSimMode) {
                            this.pickRandomFromPlaylist();
                        }
                    }

                    if (this.isSimMode && this.currentSimAsset) {
                        this.updateAnimationDisplay(spriteUrl, totalFrames, this.currentSimAsset.cols);
                    } else {
                        this.updateAnimationDisplay(spriteUrl, totalFrames, cols);
                    }
                }
                lastTime = currentTime - (delta % interval);
            }
            
            this.previewRequest = requestAnimationFrame(loop);
        };
        
        this.previewRequest = requestAnimationFrame(loop);
    }

    updateAnimationDisplay(spriteSheetUrl, frameCount, customCols = null) {
        const cols = customCols || this.cols;
        const rows = Math.ceil(frameCount / cols);
        
        const c = this.currentFrameIndex % cols;
        const r = Math.floor(this.currentFrameIndex / cols);
        
        // Tính toán % position cho background
        const xPercent = cols > 1 ? (c * (100 / (cols - 1))).toFixed(2) : 0;
        const yPercent = rows > 1 ? (r * (100 / (rows - 1))).toFixed(2) : 0;
        
        this.shimejiPreview.style.backgroundImage = `url(${spriteSheetUrl})`;
        this.shimejiPreview.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        this.shimejiPreview.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new ShimejiTool();
});
