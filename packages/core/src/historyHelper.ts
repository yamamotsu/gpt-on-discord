import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { selectMessageHistory, store, push, clear } from "./store";
import { HistoryKey, QuestionAndResponse, UserId } from "./types";

const historyToRequestMessages = (
  history: QuestionAndResponse[]
): ChatCompletionRequestMessage[] =>
  history.flatMap((interaction) => [
    {
      role: "user",
      content: `${interaction.question}`,
    },
    { role: "assistant", content: `${interaction.response}` },
  ]);

export const getMessageHistory = (
  historyKey: HistoryKey,
  maxHistories?: number
) => {
  let { history = [] } =
    selectMessageHistory(store.getState(), historyKey) || {};

  if (maxHistories) {
    history = history.slice(-maxHistories);
  }
  return historyToRequestMessages(history);
};

export const pushInteractionHistory = (params: {
  historyKey: string;
  userId: string;
  question: string;
  response: string;
}) => {
  const { historyKey, userId, question, response } = params;

  store.dispatch(
    push({
      historyKey,
      interaction: { user: userId, question, response },
    })
  );
};

export const clearInteractionHistory = (historyKey: string) => {
  store.dispatch(clear({ historyKey: historyKey }));
};
