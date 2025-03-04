const DiscordClient = require("../../DiscordBot");
const IRCClient = require("../../IRCBot");

class Bridge {
  constructor(config) {
    const verbose = config.verbose ?? false;

    const discordChannels = config.discordChannels;
    const ircChannels = config.ircChannels.map((chan) => chan.toLowerCase());

    if (!discordChannels || !ircChannels) {
      this.log("Missing channels");
      throw new Error("Missing discordChannels or ircChannels");
    }

    this.clients = [
      new DiscordClient(this, verbose, discordChannels),
      new IRCClient(this, verbose, ircChannels),
    ];
  }

  start() {
    return new Promise(async (resolve, reject) => {
      try {
        for (const client of this.clients) {
          await client.start();
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async broadcast(msg) {
    this.log("Broadcasting", msg);

    for (const client of this.clients) {
      client.broadcast(msg);
    }
  }

  log(...args) {
    return console.log("[BRIDGE]", ...args);
  }
}

module.exports = Bridge;
