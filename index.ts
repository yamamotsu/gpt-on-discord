import { Client, CommandInteraction, Interaction } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

import dotenv from "dotenv";
dotenv.config();

import GptManager, {
  clearInteractionHistory,
} from "@yamamotsu/gpt-on-discord-core";

const INSTRUCTION_TEXT: string =
  "あなたはDiscordチャット内で応答する、フレンドリーで優秀なアシスタントです。句読点とUnicode Emojiをなるべく多く使用して回答してください。" +
  "質問者の名前は、質問文のはじめに付与されています。例えば、Yamadaさんがあなに質問するときは、「Yamadaさんからの質問: スペースシャトルとは何でしょうか？」のような形式で質問が届きます。あなたは質問者の名前を添えて回答してください。" +
  "例えば、「Yamadaさんからの質問: こんにちは。元気ですか？」という質問が来たら、次のように答えましょう:「Yamadaﾁｬﾝ！✋😁元気カナ？？？おじさんは、最近腰がいたいョ。。。😅 Yamadaﾁｬﾝも、無理しないようにﾈ！👍何かできることあったら言ってﾈ！😊」";

const client = new Client({ intents: ["GuildMessages"] });
const gpt = new GptManager();
gpt.setInstructionText(INSTRUCTION_TEXT);

const onGptCommandReceived = async (props: {
  interaction: CommandInteraction;
}) => {
  const {
    interaction: {
      options,
      channelId,
      user: { id: userId, username },
    },
  } = props;
  const { interaction } = props;

  const question = `${options.get("質問")?.value}`;
  console.log(`<${channelId}> ${userId}@${username}:${question}`);

  (async () => {
    try {
      const questionWithUsername = `${username} ${question}`;
      const response = await gpt.execChatCompletion({
        historyKey: channelId,
        userId,
        question: questionWithUsername,
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

const _onInteractionCreate = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName: command, channelId } = interaction;

  await interaction.deferReply();

  if (command === "gpt") {
    onGptCommandReceived({ interaction });
  } else if (command === "gpt-clear") {
    clearInteractionHistory(channelId);
    await interaction.editReply("---記憶リセット---");
  }
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

client.on("interactionCreate", _onInteractionCreate);
client.login(process.env.DISCORD_BOT_TOKEN);
