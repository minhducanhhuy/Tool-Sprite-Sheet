import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const apiPlugin = () => ({
  name: "api-plugin",
  configureServer(server) {
    server.middlewares.use(bodyParser.json({ limit: "50mb" }));

    server.middlewares.use(async (req, res, next) => {
      if (req.url === "/api/generate-video" && req.method === "POST") {
        try {
          const { prompt, imageBase64 } = req.body;
          const apiKey = process.env.VITE_GOOGLE_AI_KEY;

          if (!apiKey) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                success: false,
                error: "Missing VITE_GOOGLE_AI_KEY in .env",
              }),
            );
            return;
          }

          console.log(
            `[Vite-Veo] Starting Veo 3.1 Lite generation for: ${prompt}`,
          );

          const ai = new GoogleGenAI({ apiKey });

          const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");
          const mimeType = imageBase64.split(";")[0].split(":")[1];

          // 1. Khởi tạo quá trình sinh video (Async Operation)          // 1. Khởi tạo quá trình sinh video (Async Operation)
          let operation = await ai.models.generateVideos({
            model: "veo-3.1-lite-generate-preview",
            // Đưa prompt ra ngoài cùng cấp với model, loại bỏ object source
            prompt: `A high-quality, 2D flat style, seamless loopable animation of this character: ${prompt}.
                        The character performs a snappy, active and energetic movement.
                        CRITICAL: The character MUST return exactly to the initial pose at the end of the video to ensure a seamless transition.
                        Style: clean lines, solid colors, consistent with the reference image. 
                        Environment: Pure white background, no camera movement.`,
            // Đưa image ra ngoài cùng cấp và sử dụng imageBytes
            image: {
              imageBytes: imageBuffer.toString("base64"),
              mimeType: mimeType,
            },
            config: {
              // Cấu hình video tối ưu cho 24 FPS @ 4s
              aspectRatio: "16:9",
              durationSeconds: 4,
            },
          });

          console.log(
            `[Vite-Veo] Operation started: ${operation.name}. Waiting for completion...`,
          );

          // 2. Polling loop: Đợi cho đến khi video hoàn tất
          const maxAttempts = 20; // 20 * 5s = 100s max
          let attempts = 0;

          while (!operation.done && attempts < maxAttempts) {
            console.log(
              `[Vite-Veo] Video is generating... (${attempts + 1}/${maxAttempts})`,
            );
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây

            operation = await ai.operations.getVideosOperation({
              operation: operation,
            });
            attempts++;
          }

          if (!operation.done) {
            throw new Error(
              "Video generation timed out (60s). Please try again.",
            );
          }

          console.log(`[Vite-Veo] Generation complete!`);

          const generatedVideo = operation.response?.generatedVideos?.[0];
          if (!generatedVideo?.video?.uri) {
            throw new Error("No video URI returned from Google API.");
          }

          const videoUri = generatedVideo.video.uri;
          console.log(`[Vite-Veo] Fetching video data from: ${videoUri}`);

          // 3. Tải video về để chuyển sang Base64/DataURL cho Frontend
          const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
          
          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video file from Google: ${videoResponse.statusText}`);
          }

          const buffer = await videoResponse.arrayBuffer();
          console.log(`[Vite-Veo] Video data received. Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
          
          // --- LƯU VIDEO LOCAL ---
          const timestamp = new Date().getTime();
          const safePrompt = prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `video_${safePrompt}_${timestamp}.mp4`;
          const filePath = `./output/${fileName}`;
          
          import('fs').then(fs => {
            fs.writeFileSync(filePath, Buffer.from(buffer));
            console.log(`[Vite-Veo] Video saved locally: ${filePath}`);
          });
          // ------------------------

          const base64Video = Buffer.from(buffer).toString("base64");
          const videoUrl = `data:video/mp4;base64,${base64Video}`;

          console.log(`[Vite-Veo] Sending video data to frontend...`);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, videoUrl }));
        } catch (error) {
          console.error("[Vite-Veo] Error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      } else if (req.url === "/api/save-spritesheet" && req.method === "POST") {
        try {
          const { spriteSheetBase64, state } = req.body;
          const timestamp = new Date().getTime();
          const fileName = `spritesheet_${state}_${timestamp}.png`;
          const filePath = `./output/${fileName}`;
          
          const base64Data = spriteSheetBase64.split(",")[1];
          import('fs').then(fs => {
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            console.log(`[Vite-Storage] Sprite Sheet saved: ${filePath}`);
          });

          res.end(JSON.stringify({ success: true, fileName }));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      } else {
        next();
      }
    });
  },
});

export default defineConfig({
  plugins: [tailwindcss(), apiPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
