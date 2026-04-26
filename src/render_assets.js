import { fal } from "@fal-ai/client";
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import extractFrames from "gif-extract-frames";

dotenv.config();

const INPUT_PATH = "input/pet-goc.png";
const OUTPUT_DIR = "output";
const STATES = ["idle", "walk", "climb_left", "climb_right", "fall", "sit"];

// Cấu hình API Key
fal.config({
  credentials: process.env.FAL_KEY,
});

async function run() {
  console.log("🚀 Bắt đầu quá trình render assets cho Shimeji...");

  if (!process.env.FAL_KEY) {
    console.error("❌ Lỗi: Thiếu FAL_KEY trong file .env");
    return;
  }

  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Lỗi: Không tìm thấy file input tại ${INPUT_PATH}`);
    return;
  }

  // 1. Upload ảnh gốc lên fal storage
  console.log("📤 Đang upload ảnh gốc...");
  const imageData = await fs.readFile(INPUT_PATH);
  const imageUrl = await fal.storage.upload(new Blob([imageData], { type: "image/png" }));
  console.log("✅ Upload thành công:", imageUrl);

  // 2. Tạo thư mục output
  await fs.ensureDir(OUTPUT_DIR);

  // 3. Render từng trạng thái
  for (const state of STATES) {
    console.log(`\n--- Đang xử lý trạng thái: ${state} ---`);
    const stateDir = path.join(OUTPUT_DIR, state);
    await fs.ensureDir(stateDir);

    try {
      console.log(`🤖 Đang gọi AI gen animation cho ${state}...`);
      const result = await fal.subscribe("fal-ai/animatediff-lightning", {

        input: {
          image_url: imageUrl,
          prompt: `${CHARACTER_DESCRIPTION ? CHARACTER_DESCRIPTION + ", " : ""}shimeji character ${state}, consistent character details, white background, high quality, 2d style`,
          num_frames: 16,
          fps: 8,
          format: "gif" 
        },
        logs: true
      });


      const videoUrl = result?.video?.url || result?.output?.video?.url || result?.data?.video?.url;
      if (!videoUrl) {
          console.error("Dữ liệu trả về không hợp lệ:", result);
          throw new Error("AI không trả về URL video/gif");
      }


      console.log(`📥 Đang tải kết quả: ${videoUrl}`);
      const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

      const gifBuffer = Buffer.from(response.data);
      const gifPath = path.join(stateDir, `${state}.gif`);
      await fs.writeFile(gifPath, gifBuffer);

      console.log(`✂️ Đang tách frame từ GIF...`);
      // gif-extract-frames sẽ tách từng frame thành file PNG
      await extractFrames({
        input: gifBuffer,
        output: path.join(stateDir, "frame_%d.png")
      });

      console.log(`✅ Hoàn thành trạng thái: ${state}`);
    } catch (error) {
      console.error(`❌ Lỗi khi xử lý ${state}:`, error.message);
    }
  }

  console.log("\n✨ TẤT CẢ ĐÃ HOÀN THÀNH! Assets có sẵn trong thư mục /output");
}

run();
