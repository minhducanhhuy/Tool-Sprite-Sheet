/**
 * Client-side interface to call the Backend Proxy for Veo 3.1 Lite
 */

export async function generateVideoAction(imageBase64, state) {
  const actionPrompts = {
    idle: "character blinking eyes and breathing subtly",
    walk: "character walking in a loop with smooth leg movement",
    climb_left: "character climbing up facing left",
    climb_right: "character climbing up facing right",
    fall: "character falling with hair fluttering",
    sit: "character sitting and looking around"
  };

  const prompt = actionPrompts[state] || actionPrompts.idle;

  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageBase64 }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.videoUrl;
}
