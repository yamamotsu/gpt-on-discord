import * as toolkitRaw from "@reduxjs/toolkit";
const { configureStore } = ((toolkitRaw as any).default ??
  toolkitRaw) as typeof toolkitRaw;

import { messageHistoryReducer } from "./messageHistorySlice";

export const store = configureStore({
  reducer: {
    messageHistory: messageHistoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
