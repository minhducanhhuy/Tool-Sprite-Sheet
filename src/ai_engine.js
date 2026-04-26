import { GoogleGenerativeAI } from "@google/generative-ai";

// Cấu hình Google AI
const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;

export async function uploadImage(fileOrDataUrl) {
  // Với Gemini trực tiếp, chúng ta có thể dùng DataURL, không cần upload lên storage trung gian của fal
  return fileOrDataUrl;
}

export async function generateFrames(baseImageUrl, state) {
  console.log(
    `🚀 Đang tạo Sprite Sheet bằng Gemini 2.5 Flash Image cho: ${state}...`,
  );

  if (!GOOGLE_AI_KEY) throw new Error("Thiếu Google AI Key.");

  // Thay đổi phần actionPrompts để tạo chuyển động rõ nét hơn
  const actionPrompts = {
    idle: "blinking eyes, hair swaying slowly, subtle breathing movement, front view, 8 distinct sequential frames",
    walk: "dynamic walking cycle, moving legs and swinging arms, side view, 8 distinct sequential frames",
    climb_left: "climbing up movement, arms and legs moving, facing left",
    climb_right: "climbing up movement, arms and legs moving, facing right",
    fall: "falling down with hair and clothes fluttering upwards, flailing arms",
    sit: "sitting down, blinking, occasional small head tilt",
  };

  const actionDetails = actionPrompts[state] || actionPrompts.idle;

  const base64Content = baseImageUrl.split(",")[1];
  const mimeType = baseImageUrl.split(";")[0].split(":")[1];

  // Chuyển sang lưới 3x3 để tăng độ phân giải mỗi frame (341x341 thay vì 256x256)
  const finalPrompt = `Act as a professional game asset creator. 
  Task: Create a 3x3 grid of 9 sequential animation frames of THE CHARACTER IN THE ATTACHED IMAGE.
  Rules:
  - Layout: 3 columns and 3 rows.
  - Content: You MUST fill at least the first 8 cells with 8 DISTINCT animation frames.
  - Cell Shape: Square.
  - Action: ${actionDetails}.
  - Style: IDENTICAL to the original, clean lines, high resolution, white background.
  - IMPORTANT: Do not leave any of the first 8 cells empty. Every frame must show a progressive movement.`;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
    // Sử dụng model chuyên dụng cho tác vụ sinh ảnh (Năm 2026)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const result = await model.generateContent([
      finalPrompt,
      { inlineData: { data: base64Content, mimeType } },
    ]);

    const response = await result.response;

    // Tìm phần tử inlineData chứa dữ liệu ảnh trong phản hồi của Gemini
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData,
    );

    if (imagePart) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    // Nếu không có ảnh, kiểm tra text xem có lỗi gì không
    const text = response.text();
    if (text) {
      throw new Error(
        `Gemini trả về văn bản thay vì ảnh: ${text.substring(0, 100)}...`,
      );
    }

    throw new Error("Gemini không trả về bất kỳ dữ liệu ảnh nào.");
  } catch (error) {
    console.error("Lỗi Generate Sprite Sheet:", error);
    throw error;
  }
}

/**
 * Hàm cắt Sprite Sheet từ lưới 3x3, tăng chất lượng ảnh và bù đắp frame trống
 */
export async function extractFramesFromVideo(spriteSheetUrl, originalImageUrl) {
  console.log("✂️ Đang tách frame lưới 3x3 và tối ưu độ nét...");

  return new Promise((resolve, reject) => {
    // 1. Lấy kích thước ảnh gốc
    const originalImg = new Image();
    originalImg.src = originalImageUrl;
    originalImg.onload = () => {
      const targetWidth = originalImg.width || 256;
      const targetHeight = originalImg.height || 256;

      // 2. Xử lý Sprite Sheet
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = spriteSheetUrl;
      img.onload = () => {
        const frames = [];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Bật chế độ làm mịn ảnh chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Cấu hình Canvas theo kích thước đích
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Cấu hình lưới 3x3
        const rows = 3;
        const cols = 3;
        const sourceFrameWidth = img.width / cols;
        const sourceFrameHeight = img.height / rows;

        let count = 0;
        let lastValidFrame = null;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (count >= 8) break; // Chỉ lấy 8 frame đầu tiên

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ và Scale frame từ Sprite Sheet vào Canvas
            ctx.drawImage(
              img,
              c * sourceFrameWidth, r * sourceFrameHeight, sourceFrameWidth, sourceFrameHeight, // Nguồn
              0, 0, targetWidth, targetHeight // Đích (Scale khớp ảnh gốc)
            );

            // Kiểm tra xem frame có dữ liệu không (tránh frame trắng)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let hasContent = false;
            
            // Chỉ cần 1 pixel không phải màu trắng là có nội dung
            for (let i = 0; i < data.length; i += 100) { // Check nhanh
              if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) {
                hasContent = true;
                break;
              }
            }

            if (hasContent) {
              // Xử lý xóa nền trắng (White to Transparent)
              for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                  data[i + 3] = 0;
                }
              }
              ctx.putImageData(imageData, 0, 0);
              lastValidFrame = canvas.toDataURL("image/png");
              frames.push(lastValidFrame);
            } else if (lastValidFrame) {
              // Nếu frame trống, copy frame trước đó vào
              console.warn(`Frame ${count + 1} bị trống, đang tự động bù đắp...`);
              frames.push(lastValidFrame);
            } else {
              // Trường hợp xấu nhất: frame đầu tiên bị trống
              frames.push(originalImageUrl);
            }
            count++;
          }
          if (count >= 8) break;
        }
        resolve(frames);
      };
      img.onerror = reject;
    };
    originalImg.onerror = () => {
      // Fallback nếu không load được ảnh gốc
      console.warn("Không load được ảnh gốc, dùng mặc định 256x256");
      reject(new Error("Không thể load ảnh gốc"));
    };
  });
}
