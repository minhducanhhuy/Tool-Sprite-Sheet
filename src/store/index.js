import { configureStore } from '@reduxjs/toolkit';
import shimejiReducer from './shimejiSlice.js';

const store = configureStore({
  reducer: {
    shimeji: shimejiReducer,
  },
});

export default store;
