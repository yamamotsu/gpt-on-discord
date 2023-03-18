import {
  Application,
  ApplicationCommandData,
} from "@yamamotsu/discord-api-helper";

import dotenv from "dotenv";
dotenv.config();

const commandData: ApplicationCommandData = {
  name: "gpt",
  description: "Let's ask GPT something..",
  options: [
    {
      type: 3,
      name: "question",
      description: "enter your question",
      required: true,
    },
  ],
};

const app = new Application();
app.registerAppCommand(commandData);
