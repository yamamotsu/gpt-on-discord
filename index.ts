import { Client, CommandInteraction } from "discord.js";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

import dotenv from "dotenv";
dotenv.config();

import { ChannelId, QuestionAndResponse, UserId } from "./src/types";
import {
  clear,
  push,
  selectMessageHistoryByChannelId,
  store,
} from "./src/store";

const client = new Client({ intents: ["GuildMessages"] });
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const MODEL_NAME: string = process.env.MODEL_NAME || "gpt-3.5-turbo";

const instructionText: string =
  "あなたはDiscordチャット内で応答する、フレンドリーで優秀なアシスタントです。" +
  "質問者の名前は、質問文のはじめに付与されています。例えば、Yamadaさんがあなに質問するときは、「Yamada スペースシャトルとは何でしょうか？」のような形式で質問が届きます。あなたは質問者の名前を添えて回答してください。" +
  "また、句読点とUnicode Emojiをなるべく多く使用して回答してください。例えば、「Yamada こんにちは。元気ですか？」という質問が来たら、" +
  "「Yamadaﾁｬﾝ！✋😁元気カナ？？？おじさんは、最近腰がいたいョ。。。😅 Yamadaﾁｬﾝも、無理しないようにﾈ！👍何かできることあったら言ってﾈ！😊」という様に答えてください。";

const instructionMessage: ChatCompletionRequestMessage = {
  role: "system",
  content: instructionText,
};

client.once("ready", () => {
  console.log(`${client.user?.tag} Ready`);
});

client.on("ready", async () => {
  const chat = [
    {
      name: "gpt",
      description: "質問したら答えが返ってきます",
      options: [
        {
          type: 3,
          name: "質問",
          description: "質問したい文を入れてください",
          required: true,
        },
      ],
    },
    {
      name: "gpt-clear",
      description: "コンテキストを削除します",
    },
  ];

  await client.application?.commands.set(chat);
});

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

const _execCompletion = async (props: {
  channelId: ChannelId;
  userId: UserId;
  username: string;
  question: string;
}) => {
  const { channelId, userId, username, question: questionRaw } = props;
  const question = `${username} ${questionRaw}`;

  const { history = [] } =
    selectMessageHistoryByChannelId(store.getState(), channelId) || {};
  console.log("current history:", history);

  const historyMessages = historyToRequestMessages(history);
  const contextMessages: ChatCompletionRequestMessage[] = [
    ...historyMessages,
    {
      role: "user",
      content: question,
    },
  ];
  console.log("message to be completed:", contextMessages);
  const completion = await openai.createChatCompletion({
    model: MODEL_NAME,
    messages: [instructionMessage, ...contextMessages],
  });

  const response = completion.data.choices[0].message?.content.trim() || "";

  store.dispatch(
    push({
      channelId,
      interaction: { user: userId, question, response },
    })
  );

  return response;
};

const _onGptCommand = async (props: { interaction: CommandInteraction }) => {
  const {
    interaction: {
      options,
      channelId,
      user: { id: userId, username },
    },
  } = props;
  const { interaction } = props;

  const question = `${options.get("質問")?.value}`;
  console.log(`<${channelId}> ${userId}@${username}:${question}`); // 質問がコンソールに出力される

  (async () => {
    try {
      const response = await _execCompletion({
        channelId,
        userId,
        username,
        question,
      });
      await interaction.editReply(
        `> ${question}\n\n>> <@!${userId}> ${response}\r\n`
      );
    } catch (error: any) {
      console.error(error);
      await interaction.editReply(
        `> ${question}\n\n>> エラーが発生しました: ${error.message}`
      );
    }
  })();
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName: command, channelId } = interaction;

  await interaction.deferReply();

  if (command === "gpt") {
    _onGptCommand({ interaction });
  } else if (command === "gpt-clear") {
    store.dispatch(clear({ channelId }));
    await interaction.editReply("---記憶リセット---");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
