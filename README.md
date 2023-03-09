# ChatGPT Discord Bot

ChatGPT-Bot is a discord bot that uses OpenAI's GPT-3 API to generate natural language responses to user input.

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

Clone repo:

`git clone https://github.com/yamamotsu/gpt_on_discord.git`

Copy `.env.sample` to `.env` and modify it for your environment.

```.env
# Set env variables and rename me with '.env'
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
DISCORD_BOT_TOKEN=[YOUR_DISCORD_BOT_TOKEN]
MAX_HISTORIES=10
```

run `yarn install` to install dependencies.

```sh
yarn install
```

### Start your bot and add it to your server

Start your bot by `yarn start`

```sh
yarn start
```

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
1. Navigate to the `OAuth2 > URL Generator` tab
1. Check options as following: `bot` in "Scopes", `Send Messages` and `Use Slash Commands` in "Bot Permissions"
1. Copy and open the generated url
1. Add to your server (you need "Bot add" permission for the server you want to add)

## Usage

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

### Notes

- Message context (a history of conversation) is saved per channel. As default, last 10 conversation will be saved as context.
This number can be changed by `MAX_HISTORIES` environment variable (it's defined in `.env` file).
- In the beginning of the question ChatGPT reads, the questioner's username will be attached in format of "[*username*]"
- You can modify instruction text for ChatGPT by `instructionTexts` variable in `index.ts`.
  - As default, the following instructions are given to bot.
  > Please reply in a friendly and proficient manner using Unicode emojis in Discord chat, and use as many punctuation marks as possible.
  > The name of the questioner is attached to the beginning of the question. Please include the questioner's name at the beginning of your response.

## Acknowledgements

I was able to get a lot of insights from the following article (written in Japanese), to build my first discord bot in NodeJS.
https://qiita.com/xyzmiku/items/1ec18fbb64f194a6a478
