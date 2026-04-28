# ✨ AI Sprite Animator ⚡

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-3.0.0-green.svg)
![JS](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![AI](https://img.shields.io/badge/AI-Google%20Veo%203.1-orange.svg)

**Automatically generate high-quality, game-ready 2D character animations from a single image using Google AI.**  
_Tự động tạo hoạt ảnh nhân vật 2D chất lượng cao, sẵn sàng cho game từ một bức ảnh duy nhất bằng công nghệ Google AI._

[English Version](#-english-guide) | [Tiếng Việt](#-hướng-dẫn-tiếng-việt) | [Support Me](#-support-the-creator)

</div>

---

## 🇬🇧 English Guide

### 🌟 Features

- **One-Click Generation**: Create full animation sequences (Idle, Walk, Run, etc.) from just one reference image using **Google Veo 3.1 Lite**.
- **Precision Extraction**: 144-frame professional sprite sheets (24 FPS) optimized for 6-second animations.
- **Local-First Workflow**: All assets (MP4 & PNG) are saved permanently to your `output/` folder.
- **Live Simulator**: Supports up to **240 FPS** preview with seamless loop trimming logic.
- **Zero-Cost Reprocessing**: Re-import local videos to regenerate sprite sheets without API fees.
- **Playlist Mode**: Batch upload and simulate complex character behaviors randomly.

### 🚀 Quick Start

1. **Clone the repo**: `git clone https://github.com/minhducanhhuy/tool-sprite-sheet.git`
2. **Install**: `npm install`
3. **Configure**: Rename `.env.example` to `.env` and add your `VITE_GOOGLE_AI_KEY`.
4. **Run**: `npm run dev`

---

## 🇻🇳 Hướng dẫn Tiếng Việt

### ✨ Tính năng chính

- **Sinh ảnh 1 chạm**: Chỉ cần 1 ảnh gốc, AI Google Veo 3.1 sẽ tự tạo ra chuỗi hành động hoàn chỉnh.
- **Độ mượt chuẩn Pro**: Sprite sheet 144 frames (24 FPS) tối ưu cho video 6 giây, đạt tiêu chuẩn game cao cấp.
- **Lưu trữ nội bộ**: Mọi tài sản (MP4 & PNG) được lưu vĩnh viễn vào thư mục `output/` của bạn.
- **Trình mô phỏng trực tiếp**: Hỗ trợ xem thử lên đến **240 FPS** với thuật toán cắt bỏ frame lặp để đạt vòng lặp hoàn hảo.
- **Xử lý lại 0đ**: Nạp lại video từ máy tính để tạo sprite sheet mới mà không tốn phí gọi API.
- **Chế độ Playlist**: Tải lên hàng loạt và mô phỏng các hành vi phức tạp của nhân vật một cách ngẫu nhiên.

### 🛠️ Cách cài đặt

1. Tải code từ repository này về máy.
2. Chạy lệnh `npm install` để cài đặt thư viện.
3. Đổi tên file `.env.example` thành `.env` và điền `VITE_GOOGLE_AI_KEY` của bạn.
4. Chạy lệnh `npm run dev` để bắt đầu sáng tạo.

---

## 📂 Project Structure | Cấu trúc dự án

- `input/`: Source images for AI generation | _Nơi chứa ảnh nguồn cho AI._
- `output/`: Final exports (MP4, PNG) | _Nơi chứa kết quả cuối cùng._
- `src/utils/canvas_processor.js`: Sprite sheet engine | _Bộ xử lý Sprite Sheet._
- `main.js`: Main application logic | _Logic ứng dụng chính._

---

## 🛠️ Tech Stack

| Component     | Technology                             |
| :------------ | :------------------------------------- |
| **Frontend**  | Vanilla JS, Vite, HTML5 Canvas         |
| **AI Engine** | Google Veo 3.1 Lite (Generative Video) |
| **UI/UX**     | Tailwind CSS, Glassmorphism            |

---

## ☕ Support the Creator

If this tool helps you save hours of manual drawing, consider buying me a coffee!

### 🇻🇳 Trong nước (Domestic - Vietnam)

|                                             Scan VietQR (MBBank)                                              | Account Details                                                                 |
| :-----------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------ |
| <img src="https://img.vietqr.io/image/MB-9937683773-compact.png?accountName=NGUYEN%20MINH%20DUC" width="200"> | **Bank**: MBBank<br>**Account No**: `9937683773`<br>**Name**: `NGUYEN MINH DUC` |

### 🌎 Quốc tế (International)

Support me via **Payoneer** (Transfer or Payment Request):

- **Payoneer Email**: `minhducanhhuy@gmail.com`

[![Payoneer](https://img.shields.io/badge/Payoneer-FF4800?style=for-the-badge&logo=payoneer&logoColor=white)](mailto:minhducanhhuy@gmail.com)

---

## ⚖️ License

**MIT © [minhducanhhuy](https://github.com/minhducanhhuy)**
