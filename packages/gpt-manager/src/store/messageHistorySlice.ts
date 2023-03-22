import * as toolkitRaw from "@reduxjs/toolkit";
const { createSlice } = ((toolkitRaw as any).default ??
  toolkitRaw) as typeof toolkitRaw;
import type { PayloadAction } from "@reduxjs/toolkit";

import { HistoryKey, QuestionAndResponse } from "../types";
import { type RootState } from "./rootStore";

interface MessageHistoryByChannel {
  historyKey: HistoryKey;
  history: QuestionAndResponse[];
}
interface MessageHistoryStore {
  [key: HistoryKey]: MessageHistoryByChannel;
}
const initialState: MessageHistoryStore = {};

interface MessageHistoryPayload {
  historyKey: HistoryKey;
  interaction?: QuestionAndResponse;
}
export const messageHistorySlice = createSlice({
  name: "messageHistory",
  initialState,
  reducers: {
    push: (state, action: PayloadAction<MessageHistoryPayload>) => {
      const { historyKey, interaction } = action.payload;
      if (!interaction) {
        return;
      }

      const history = state[historyKey]?.history || [];
      history.push({ ...interaction });
      state[historyKey] = {
        historyKey,
        history,
      };
      console.log("state updated:", state[historyKey]);
    },
    clear: (state, action: PayloadAction<MessageHistoryPayload>) => {
      const { historyKey } = action.payload;
      state[historyKey] = {
        historyKey,
        history: [],
      };
      console.log("state cleared:", state[historyKey]);
    },
  },
});

export const { push, clear } = messageHistorySlice.actions;
export const selectMessageHistory = (
  state: RootState,
  historyKey: HistoryKey
): MessageHistoryByChannel | undefined => state.messageHistory[historyKey];

export const messageHistoryReducer = messageHistorySlice.reducer;
