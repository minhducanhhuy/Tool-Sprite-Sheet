# 🐾 AI Sprite Sheet Pipeline - Pro Healing Edition

Hệ thống tự động tạo và quản lý Animation Sprite Sheet chuyên nghiệp cho dự án Desktop Pet (Healing Mate). Tận dụng sức mạnh của **Google Veo 3.1 Lite** để biến một tấm ảnh nhân vật tĩnh thành chuỗi hành động mượt mà 24 FPS.

## 🚀 Tính năng nổi bật (v3.0 - Professional Upgrade)

### 🎥 Engine AI Cao cấp
- **Veo 3.1 Lite Integration:** Tự động sinh video 4 giây từ ảnh gốc với độ ổn định nhân vật cực cao.
- **Snappy Motion Prompting:** Hệ thống Prompt được tinh chỉnh để AI tạo ra các chuyển động dứt khoát, energetic phù hợp cho Game và App tương tác.
- **Seamless Loop CRITICAL:** Ép AI đưa nhân vật về đúng tư thế ban đầu ở giây cuối cùng, đảm bảo vòng lặp không tì vết.

### ⚙️ Quy trình xử lý Asset thông minh
- **24 FPS Standard:** Mặc định trích xuất 96 frames cho mỗi hành động, đạt tiêu chuẩn hoạt hình chuyên nghiệp.
- **Dynamic Resolution:** Tùy chọn kích thước xuất ra (128px, 256px, 512px). Hỗ trợ nén (Downscale) chất lượng cao giúp tiết kiệm 80% RAM mà vẫn sắc nét.
- **Seamless Flow Engine:** Thuật toán tự động cắt bỏ Frame trùng lặp ở điểm nối, mang lại cảm giác chuyển động liên tục không bị khựng.

### 💾 Hệ thống lưu trữ Local (Vĩnh viễn)
- **Auto-Persistence:** Tự động lưu cả Video gốc (.mp4) và Sprite Sheet (.png) vào thư mục `output/`.
- **Local Re-processing (0đ):** Chức năng nạp lại video cũ từ máy tính để cắt lại Sprite Sheet với thông số mới mà không tốn phí gọi API.

### 🎮 Pet Simulator Mode
- **Playlist Management:** Quản lý danh sách các hành động (Idle, Walk, Jump...).
- **Random Animation:** Tự động chuyển đổi ngẫu nhiên giữa các hành động trong playlist sau mỗi chu kỳ, mô phỏng hành vi sinh động của Pet.
- **Batch PNG Upload:** Hỗ trợ kéo thả/nạp hàng loạt tệp .png có sẵn vào playlist cùng lúc.

## 🛠️ Công nghệ sử dụng

- **Frontend:** Vite, HTML5 Canvas API (High-precision rendering), Redux Toolkit.
- **Backend Proxy:** Node.js, Google Generative AI SDK (@google/genai).
- **Styling:** Tailwind CSS, Glassmorphism UI.
- **Timing:** `requestAnimationFrame` (Đồng bộ tần số quét màn hình 60Hz - 240Hz).

## 📂 Cấu trúc thư mục

- `input/`: Nơi chứa ảnh nhân vật gốc của bạn.
- `output/`: Thành quả (Video .mp4 và Sprite Sheet .png) được lưu tại đây.
- `src/utils/canvas_processor.js`: Trái tim xử lý hình ảnh và thuật toán ghép lưới.
- `main.js`: Bộ điều khiển trung tâm và logic Simulator.

## 📝 Hướng dẫn sử dụng

1. **Bước 1:** Tải ảnh nhân vật lên (Nền trắng hoặc trong suốt là tốt nhất).
2. **Bước 2:** Chọn hành động (Idle, Walk, Sit...) và nhập mô tả chi tiết nếu cần.
3. **Bước 3:** Điều chỉnh **Độ mượt (Frames)** và **Kích thước (Resolution)**. Khuyên dùng: 96 frames / 256px.
4. **Bước 4:** Nhấn **Generate Assets** và đợi AI làm phép thuật.
5. **Bước 5:** Thêm vào **Playlist** và bật **Simulator Mode** để xem chú Pet của bạn "sống" dậy!

## ⚖️ License

**MIT © [minhducanhhuy](https://github.com/minhducanhhuy)**
