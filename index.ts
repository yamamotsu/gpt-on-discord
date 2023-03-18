import { Client, CommandInteraction, Interaction } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

import dotenv from "dotenv";
dotenv.config();

import {
  execCompletion,
  dispatchClearInteractionHistory,
} from "@yamamotsu/gpt-on-discord-core";

const client = new Client({ intents: ["GuildMessages"] });
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
      const response = await execCompletion({
        openai,
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

const _onInteractionCreate = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName: command, channelId } = interaction;

  await interaction.deferReply();

  if (command === "gpt") {
    onGptCommandReceived({ interaction });
  } else if (command === "gpt-clear") {
    dispatchClearInteractionHistory(channelId);
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
