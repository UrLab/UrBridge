const DiscordClient = require("../../DiscordBot")
const IRCClient = require("../../IRCBot")
const { EventEmitter } = require("node:events")

class Bridge extends EventEmitter {
    constructor(config) {
        super()
        const verbose = (config.verbose ?? false)
        const discordChannels = config.discordChannels
        const ircChannels = config.ircChannels
        if (!discordChannels || !ircChannels) {
            this.log("Missing channels");
            throw new Error("Missing discordChannels or ircChannels")
        }
        this.config = config
        this.discordClient = new DiscordClient(this, verbose, discordChannels)
        this.ircClient = new IRCClient(this, verbose, ircChannels)

        this.on("message", (msg, channel) => {
            this.log("NEW MESSAGE !")
            this.messageListener(msg, channel)
        })
    }

    start() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.discordClient.start()
                await this.ircClient.start()
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    broadcast(msg, excludechan) {
        this.log("Broadcasting", msg)
        for (const dchan of this.config.discordChannels) {
            // this.log("DCHAN BROADCAST", dchan, msg, excludechan)
            if (!(excludechan.type == "discord" && dchan == excludechan.id)) {

                this.discordClient.channels.cache.get(dchan)?.send(msg)
            }
        }

        this.log("IRC Channels", this.config)
        for (const ichan of this.config.ircChannels) {
            this.log("ICHAN BROADCAST", ichan, msg, excludechan)
            if (!(excludechan.type == "irc" && msg.target == excludechan.name)) {

                this.log("verif chan", this.ircClient.channels.includes(ichan))
                if (this.ircClient.channels.includes(ichan)) {
                    this.log(this.ircClient.channel(ichan))
                    this.ircClient.channel(ichan).say(msg.content)
                }
            }
        }
    }

    log(...args) {
        return console.log("[BRIDGE]", ...args)
    }

    messageListener(msg, channel) {
        this.log("Message listener", msg, channel)
        if (msg.target && msg.nick && msg.message && msg.target !== process.env.NICKNAME) {
            this.log("Message from IRC")
            this.broadcast({
                content: `**<${msg.nick}>** ${msg.message}`
            }, channel)
        }
        else if (msg.author) {
            this.log("Message from Discord")
            this.broadcast({
                content: `**<${msg.author.username}>** ${msg.content}`
            }, channel)
        }
    }
}

module.exports = Bridge