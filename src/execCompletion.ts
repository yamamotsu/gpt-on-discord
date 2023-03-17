import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { INSTRUCTION_MESSAGE, MODEL_NAME } from "./constants";
import { selectMessageHistoryByChannelId, store, push, clear } from "./store";
import { ChannelId, QuestionAndResponse, UserId } from "./types";

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

export const getHistoryMessageByChannelId = (channelId: string) => {
  const { history = [] } =
    selectMessageHistoryByChannelId(store.getState(), channelId) || {};
  return historyToRequestMessages(history);
};

export const dispatchPushInteractionHistory = (params: {
  channelId: string;
  userId: string;
  question: string;
  response: string;
}) => {
  const { channelId, userId, question, response } = params;

  store.dispatch(
    push({
      channelId,
      interaction: { user: userId, question, response },
    })
  );
};

export const dispatchClearInteractionHistory = (channelId: string) => {
  store.dispatch(clear({ channelId }));
};

export const execCompletion = async (props: {
  openai: OpenAIApi;
  channelId: ChannelId;
  userId: UserId;
  username: string;
  question: string;
}) => {
  const { openai, channelId, userId, username, question: questionRaw } = props;
  const question = `${username}: ${questionRaw}`;

  const contextMessages: ChatCompletionRequestMessage[] = [
    ...getHistoryMessageByChannelId(channelId),
    {
      role: "user",
      content: question,
    },
  ];
  console.log("message to be completed:", contextMessages);

  const completion = await openai.createChatCompletion({
    model: MODEL_NAME,
    messages: [INSTRUCTION_MESSAGE, ...contextMessages],
  });

  const response = completion.data.choices[0].message?.content.trim() || "";
  dispatchPushInteractionHistory({ channelId, userId, question, response });
  return response;
};
