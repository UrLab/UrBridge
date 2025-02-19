const { Client } = require("irc-framework");
const { Message } = require("../../Bridge/class/Message");

class IRCClient extends Client {
  constructor(bridge, verbose = false, channels) {
    super();
    this.bridge = bridge;
    this.channels = channels.map((chan) => chan.toLowerCase());
    this.verbose = verbose;

    this.on("message", (msg) => {
      this.log("message recived", msg);

      if (msg.from_server) return;
      if (!msg.target) return;

      msg.target = msg.target.toLowerCase();

      // catch self messages
      if (msg.nick == this.user.nick) return;

      const internal_msg = new Message();
      internal_msg.fromIRCFormat(msg);

      this.bridge.broadcast(internal_msg);
    });
  }

  log(...args) {
    if (this.verbose) console.log("[IRC]", ...args);
  }

  broadcast(message) {
    const msg = this.fromatMessageForForward(message);
    for (const chan of this.channels) {
      // do not send in the channel the message is comming from
      if (chan != msg.channel) {
        this.sendTextInChannel(msg.text, chan);
      }
    }
  }

  fromatMessageForForward(msg) {
    const res_msg = { ...msg };
    res_msg.text = "[" + msg.author + "]: " + msg.text;
    return res_msg;
  }

  sendTextInChannel(text, chan) {
    try {
      this.channel(chan).say(text);
    } catch (error) {
      this.log("when tryin to send message in ", chan, " got ", error);
    }
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
