const { Client } = require("discord.js");
const { Message } = require("../../Bridge/class/Message");

class DiscordClient extends Client {
  constructor(bridge, verbose = false, channels) {
    super({
      intents: [
        "Guilds",
        "GuildMessages",
        "GuildMessageReactions",
        "GuildMessageTyping",
        "GuildMembers",
        "MessageContent",
      ],
    });

    this.bridge = bridge;
    this.verbose = verbose;
    this.trackedChannelsIds = channels;

    this.on("messageCreate", (msg) => {
      this.log("message recived", msg);

      // catch self messages
      if (msg.author.id == this.user.id) return;
      // only propagate messages from tracked channels
      if (!this.trackedChannelsIds.includes(msg.channelId)) return;

      const internal_msg = new Message();
      internal_msg
        .fromDiscordFormat(msg, this)
        .then(() => this.bridge.broadcast(internal_msg));
    });
  }

  log(...args) {
    if (this.verbose) console.log("[Discord]", ...args);
  }

  async broadcast(message) {
    const msg = await this.formatMessageForForward(message);
    for (const chan of this.trackedChannelsIds) {
      if (chan != msg.channel) {
        // do not send in the channel the message is comming from
        this.sendTextInChannel(msg.text, chan);
      }
    }
  }

  async formatMessageForForward(msg) {
    const res_msg = { ...msg };

    res_msg.text = `[**${msg.author}**]: ${res_msg.text}`;

    return res_msg;
  }

  sendTextInChannel(text, chan) {
    this.channels.cache
      .get(chan)
      ?.send(text)
      .then(() => {})
      .catch((error) =>
        this.log("when trying to send message in ", chan, " got ", error)
      );
  }

  start() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.login(process.env.DISCORD_TOKEN);
        this.log("Client connected");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = DiscordClient;
