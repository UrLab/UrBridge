const { Client } = require("discord.js");
const { Message } = require("../../Bridge/class/Message")


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
    this.trackedChannels = channels;

    this.on("messageCreate", (msg) => {
      //this.log("message recived", msg);

      // catch self messages
      if (msg.author.id == this.user.id) return;

      const internal_msg = new Message();
      internal_msg.fromDiscordFormat(msg);
      this.bridge.broadcast(internal_msg);
    });
  }

  log(...args) {
    if (this.verbose) console.log("[Discord]", ...args);
  }

  broadcast(msg) {
    for (const chan of this.trackedChannels) {
      if (chan != msg.channel) { // do not send in the channel the message
        this.sendTextInChannel(msg.text, chan);
      }
    }
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
