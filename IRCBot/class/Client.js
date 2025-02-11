const { Client } = require("irc-framework");

class IRCClient extends Client {
  constructor(bridge, verbose = false, channels) {
    super();
    this.bridge = bridge;
    this.channels = channels.map((chan) => chan.toLowerCase());
    this.verbose = verbose;

    this.on("message", (msg) => {
      if (!msg.target) {
        return;
      }
      msg.target = msg.target.toLowerCase();
      if (!channels.includes(msg.target) && msg.nick != this.user.nick) {
        return;
      }

      this.log("Message is okay");
      this.bridge.emit("message", msg, { type: "irc", name: msg.target });
    });
  }
  nick;
  log(...args) {
    if (this.verbose) console.log("[IRC]", ...args);
  }

  start() {
    return new Promise((resolve, reject) => {
      const timeOutMsg = setTimeout(() => {
        this.log("Trying to connect . . . ");
      }, 10000);
      this.on("connected", () => {
        clearTimeout(timeOutMsg);
        this.log("Client connected");
        for (const channel of this.channels) {
          this.join(channel);
        }
        resolve();
      });

      this.on("join", (channel) => {
        this.log(`Joined ${channel.channel}`);
      });

      this.on("socket close", () => {
        clearTimeout(timeOutMsg);
        this.log("Socket closed");
      });

      this.on("socket error", (error) => {
        clearTimeout(timeOutMsg);
        this.log("Socket error: ", error);
      });

      this.on("irc error", (error) => {
        clearTimeout(timeOutMsg);
        this.log("IRC error: ", error);
      });

      this.on("error", (error) => {
        clearTimeout(timeOutMsg);
        this.log("Error: ", error);
      });

      this.on("close", () => {
        clearTimeout(timeOutMsg);
        this.log(
          `Can't connect to ${process.env.IRC_HOST}:${process.env.IRC_PORT}`
        );
      });

      try {
        this.connect({
          host: process.env.IRC_HOST,
          port: process.env.IRC_PORT,
          nick: process.env.NICKNAME,
          username: process.env.NICKNAME,
          tls: true,
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = IRCClient;
