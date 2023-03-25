# gpt-on-discord

Simple discord bot that uses OpenAI's GPT-3 API to generate natural language responses to user input.
Created for my practice of Discord Bot / ChatGPT.

## Features

### Daemon bot

You can run `yarn gpt-on-discord` on your local PC or remote instance, to start the bot daemon that handles `/gpt` command.
This is the simple way to run the bot (and stable), but the bot should always be started whenever you want to use `/gpt`.

### Lambda function bot (Unstable)

As the another option to the daemon bot, you can run this bot on your AWS environment, as two AWS lambda functions:

- the "main" function to handle chatgpt request/response
- the "gateway" function to handle defer reply and async call of "main" function

Lambda function bot releases you from consistently launching the bot process on your local PC.

But this feature is currently in progress so there are some problems(i.e. Bot timeouts due to slow startup during cold boot).

> Setup instructions for lambda function is currently not ready

## Getting Started

Before starting your bot, you need to get OpenAI API key and Discord Bot token.

### Get OpenAI API Key

1. Go to the [OpenAI Website](https://platform.openai.com/).
2. Create an account and log in.
3. Click profile icon on right top then click 'View API keys' ([here](https://platform.openai.com/account/api-keys))
4. Click `+ Create new secret key`.
5. Copy the API key and save it for later use.

### Setup your Discord Bot and get Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an account and log in.
3. Click on the "New Application" button.
4. Enter a name for your application and click "Create".
5. Click on the "Bot" tab. (Please make sure to turn `PUBLIC BOT` switch **OFF** if you don't want to reveal your bot to the others.)
6. Click on the "Add Bot" button.
7. Copy the Bot Token and save it for later use.

### Clone and setup

Clone this repo:

`git clone https://github.com/yamamotsu/gpt-on-discord.git`

Copy `.env.sample` to `.env` and modify it for your environment.

```.env
# Set env variables and rename me with '.env'
# OpenAI API
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]

# Discord bot
DISCORD_BOT_TOKEN=[YOUR_DISCORD_BOT_TOKEN]
PUBLIC_KEY=[YOUR_PUBLIC_KEY]
APPLICATION_ID=[YOUR_APPLICATION_ID]
DISCORD_API_VERSION=10

# Application settings
MODEL_NAME=gpt-3.5-turbo
MAX_HISTORIES=10

# Lambda function
LAMBDA_FUNCTION_NAME=chatgpt

```

run `yarn install` to install dependencies.

```sh
yarn install
```

### Start your bot and add it to your server

Start your bot daemon by `yarn start`

```sh
yarn start
```

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
1. Navigate to the `OAuth2 > URL Generator` tab
1. Check options as following: `bot` in "Scopes", `Send Messages` and `Use Slash Commands` in "Bot Permissions"
1. Copy and open the generated url
1. Add to your server (you need "Bot add" permission for the server you want to add)

## Usage

### `/gpt` command: ask ChatGPT something

You can use `/gpt` command for asking any questions to ChatGPT

```command
/gpt Please tell me the history of Minecraft
>> Sure thing, yamamotsu! 🤓👍

Minecraft is a sandbox video game developed and published by Mojang Studios. The game was created by Markus Persson in 2009 and was fully released in 2011.
The game became very popular due to its open-world gameplay and the ability for players to create their own structures and environments.

Over time, Minecraft has evolved through numerous updates and revisions.
The game features several modes, including Survival, Creative, and Adventure.
Players can work together in multiplayer mode or compete against each other in player-versus-player combat. Minecraft has also spawned numerous spin-offs, including Minecraft: Story Mode and Minecraft: Dungeons.

As of May 2021, Minecraft has sold over 200 million copies across all platforms,
making it one of the best-selling video games of all time. 😲🎮
```

### `/gpt-clear` command: clears current context

`/gpt-clear` command can remove current context.

```command
/gpt-clear
---記憶リセット---
```

### Notes

- Message context (a history of conversation) is saved per channel. As default, last 10 conversation will be saved as context.
This number can be changed from `MAX_HISTORIES` environment variable (it's defined in `.env` file) , or `chatgpt.context.maxHistories` in `config.json` file. If both is specified `config.json`'s value will be used.
- In the beginning of the question ChatGPT reads, the questioner's username will be attached in format of `"*username*さんからの質問:"` (EN: `Question from *username*:` )
- You can modify instruction text for ChatGPT by `chatgpt.instruction.default` property in `config.json`.
  - As default, the following instructions are given to bot.
  > EN: Please reply in a friendly and proficient manner using Unicode emojis in Discord chat, and use as many punctuation marks as possible.
  > The name of the questioner is attached to the beginning of the question. Please include the questioner's name at the beginning of your response.

## Acknowledgements

I was able to get a lot of insights from the following article (written in Japanese), to build my first discord bot in NodeJS.
https://qiita.com/xyzmiku/items/1ec18fbb64f194a6a478
