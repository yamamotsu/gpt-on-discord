import * as toolkitRaw from "@reduxjs/toolkit";
const { createSlice } = ((toolkitRaw as any).default ??
  toolkitRaw) as typeof toolkitRaw;
import type { PayloadAction } from "@reduxjs/toolkit";

import { ChannelId, QuestionAndResponse } from "../types";
import { type RootState } from "./rootStore";
import { MAX_HISTORIES } from "../constants";

interface MessageHistoryByChannel {
  channelId: ChannelId;
  history: QuestionAndResponse[];
}
interface MessageHistoryStore {
  [key: ChannelId]: MessageHistoryByChannel;
}
const initialState: MessageHistoryStore = {};

interface MessageHistoryPayload {
  channelId: ChannelId;
  interaction?: QuestionAndResponse;
}
export const messageHistorySlice = createSlice({
  name: "messageHistory",
  initialState,
  reducers: {
    push: (state, action: PayloadAction<MessageHistoryPayload>) => {
      const { channelId, interaction } = action.payload;
      if (!interaction) {
        return;
      }

      const history = state[channelId]?.history || [];
      if (history.length >= MAX_HISTORIES) {
        history.shift();
      }
      history.push({ ...interaction });
      state[channelId] = {
        channelId,
        history,
      };
      console.log("state updated:", state[channelId]);
    },
    clear: (state, action: PayloadAction<MessageHistoryPayload>) => {
      const { channelId } = action.payload;
      state[channelId] = {
        channelId,
        history: [],
      };
      console.log("state cleared:", state[channelId]);
    },
  },
});

export const { push, clear } = messageHistorySlice.actions;
export const selectMessageHistoryByChannelId = (
  state: RootState,
  channelId: ChannelId
): MessageHistoryByChannel | undefined => state.messageHistory[channelId];

export const messageHistoryReducer = messageHistorySlice.reducer;
