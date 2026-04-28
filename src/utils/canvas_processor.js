/**
 * Trích xuất các frame từ video và ghép thành Sprite Sheet lưới 4x4
 */

export async function extractFramesFromVideo(videoUrl, count = 16) {
    console.log(`[Canvas] Bắt đầu trích xuất ${count} frames từ video...`);
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        
        video.addEventListener('canplaythrough', async () => {
            const duration = video.duration;
            const frames = [];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tính toán để cắt khung hình vuông ở chính giữa (Center Square Crop)
            const size = Math.min(video.videoWidth, video.videoHeight);
            const offsetX = (video.videoWidth - size) / 2;
            const offsetY = (video.videoHeight - size) / 2;
            
            canvas.width = size;
            canvas.height = size;

            console.log(`[Canvas] Kích thước frame: ${size}x${size}, Duration: ${duration}s`);

            for (let i = 0; i < count; i++) {
                const time = (duration / count) * i;
                video.currentTime = time;
                
                await new Promise(r => {
                    const onSeeked = async () => {
                        // Thêm một chút delay để đảm bảo frame đã render xong
                        await new Promise(res => setTimeout(res, 50));
                        ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
                        frames.push(canvas.toDataURL('image/png'));
                        video.removeEventListener('seeked', onSeeked);
                        r();
                    };
                    video.addEventListener('seeked', onSeeked);
                });
                if (i % 4 === 0) console.log(`[Canvas] Đã trích xuất ${i}/${count} frames...`);
            }
            video.pause();
            console.log(`[Canvas] Hoàn tất trích xuất ${frames.length} frames.`);
            resolve(frames);
        }, { once: true });

        video.onerror = (e) => {
            console.error("[Canvas] Lỗi load video:", e);
            reject(new Error("Không thể load video để trích xuất frame."));
        };
        
        video.load(); // Kích hoạt quá trình load
    });
}

export async function compileSpriteSheet(frames, cols = 4, targetSize = null) {
    if (frames.length === 0) return null;
    console.log(`[Canvas] Đang ghép ${frames.length} frames thành Sprite Sheet lưới ${cols}x${Math.ceil(frames.length / cols)}...`);
    if (targetSize) console.log(`[Canvas] Đang thực hiện Downscale xuống: ${targetSize}px/frame`);

    return new Promise((resolve) => {
        const firstFrame = new Image();
        firstFrame.onload = () => {
            // Sử dụng targetSize nếu có, nếu không lấy size gốc của frame đầu tiên
            const frameWidth = targetSize || firstFrame.width;
            const frameHeight = targetSize || firstFrame.height;
            const rows = Math.ceil(frames.length / cols);

            const canvas = document.createElement('canvas');
            canvas.width = frameWidth * cols;
            canvas.height = frameHeight * rows;
            const ctx = canvas.getContext('2d');
            
            // Cải thiện chất lượng khi downscale
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            let loadedCount = 0;
            frames.forEach((frameData, index) => {
                const img = new Image();
                img.onload = () => {
                    const r = Math.floor(index / cols);
                    const c = index % cols;
                    // Vẽ với kích thước mới (Downscale tại đây)
                    ctx.drawImage(img, c * frameWidth, r * frameHeight, frameWidth, frameHeight);
                    
                    loadedCount++;
                    if (loadedCount === frames.length) {
                        console.log(`[Canvas] Đã tạo xong Sprite Sheet (${canvas.width}x${canvas.height}).`);
                        resolve(canvas.toDataURL('image/png'));
                    }
                };
                img.src = frameData;
            });
        };
        firstFrame.src = frames[0];
    });
}
