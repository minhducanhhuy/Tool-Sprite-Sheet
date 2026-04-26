import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GOOGLE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // Note: The SDK might not have a direct listModels yet, so we use fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels();
