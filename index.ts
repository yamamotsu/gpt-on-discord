import { Client } from "discord.js";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
// dotenvを使って、環境変数を読み込む
import dotenv from "dotenv";
dotenv.config();

import { QuestionAndResponse } from "./src/types";
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

const instructionTexts: string[] = [
  "あなたはDiscordチャット内で応答する、フレンドリーで優秀なアシスタントです。Unicode Emojiをたくさん使用して回答してください。句読点もなるべく多く使用してください。",
  "質問者の名前は、質問文のはじめに付与されています。例えば、山田さんがあなたに質問するときは、「[山田] スペースシャトルとは何でしょうか？」のような形式で質問が届きます。あなたは質問者の名前を添えて回答してください。",
];
const exampleConversations: string[][] = [
  [
    "[山田] こんにちは。元気ですか？",
    "山田ﾁｬﾝ！✋😁元気カナ？？？おじさんは最近腰がいたいョ。。。😅 山田ﾁｬﾝも、無理しないようにﾈ！👍何かできることあったら言ってﾈ！😊",
  ],
];
const instructionMessages: ChatCompletionRequestMessage[] =
  instructionTexts.map((content) => ({
    role: "system",
    content,
  }));
const exampleMessages: ChatCompletionRequestMessage[] =
  exampleConversations.flatMap(([question, answer]) => {
    return [
      {
        role: "user",
        content: question,
      },
      {
        role: "assistant",
        content: answer,
      },
    ];
  });

// Discordクライアントが起動すると、一度だけ呼び出される関数を定義する
client.once("ready", () => {
  console.log(`${client.user?.tag} Ready`);
});

// Discordクライアントが起動すると、一度だけ呼び出される関数を定義する
client.on("ready", async () => {
  // コマンドを定義する
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

  // コマンドを登録する
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

client.on("interactionCreate", async (interaction) => {
  // インタラクションがコマンドでなければ、何もしない
  if (!interaction.isCommand()) return;

  // インタラクションがどのコマンドかを取得する
  const {
    commandName: command,
    channelId,
    user: { id: userId, username },
  } = interaction;

  // gptコマンドが呼び出された場合、OpenAIに質問を送信する
  if (command === "gpt") {
    // 質問を取得する
    const question = interaction.options.get("質問")?.value;
    console.log(`${channelId}: <${userId}> ${question}`); // 質問がコンソールに出力される

    // interactionの返信を遅延する
    await interaction.deferReply();

    const { history = [] } =
      selectMessageHistoryByChannelId(store.getState(), channelId) || {};
    console.log("current history:", history);

    const historyMessages = historyToRequestMessages(history);
    (async () => {
      try {
        const contextMessages: ChatCompletionRequestMessage[] = [
          ...historyMessages,
          {
            role: "user",
            content: `[${username}] ${question}`,
          },
        ];
        console.log("message to be completed:", contextMessages);
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            ...instructionMessages,
            ...exampleMessages,
            ...contextMessages,
          ],
        });

        const response =
          completion.data.choices[0].message?.content.trim() || "";

        store.dispatch(
          push({
            channelId,
            interaction: { user: userId, question: `${question}`, response },
          })
        );
        await interaction.editReply(`${question}\n>> ${response}\r\n`);
      } catch (error: any) {
        console.error(error);
        await interaction.editReply(`エラーが発生しました: ${error.message}`);
      }
    })();
  } else if (command === "gpt-clear") {
    store.dispatch(clear({ channelId }));
    await interaction.reply("---記憶リセット---");
  }
});

//Discordクライアントにログイン
client.login(process.env.DISCORD_BOT_TOKEN);
