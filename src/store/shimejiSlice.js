import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const generateVideo = createAsyncThunk(
  'shimeji/generateVideo',
  async ({ prompt, imageBase64 }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageBase64 }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.videoUrl;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const shimejiSlice = createSlice({
  name: 'shimeji',
  initialState: {
    currentState: 'idle',
    spriteSheetUrl: null,
    frames: {
      idle: [], walk: [], climb_left: [], climb_right: [], fall: [], sit: []
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    setState: (state, action) => {
      state.currentState = action.payload;
    },
    setSpriteSheet: (state, action) => {
      state.spriteSheetUrl = action.payload;
    },
    setFrames: (state, action) => {
      const { actionType, frames } = action.payload;
      state.frames[actionType] = frames;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateVideo.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(generateVideo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Video URL is handled in the component/main.js to extract frames
      })
      .addCase(generateVideo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setState, setSpriteSheet, setFrames } = shimejiSlice.actions;
export default shimejiSlice.reducer;
