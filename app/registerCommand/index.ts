#!/usr/bin/env node
import {
  Application,
  ApplicationCommandData,
} from "@yamamotsu/discord-api-helper";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

const commandJson: {
  commands: ApplicationCommandData[];
} = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
console.log("commands:", commandJson.commands);

const app = new Application();
commandJson.commands.forEach(async (command) => {
  await app.registerAppCommand(command);
});
