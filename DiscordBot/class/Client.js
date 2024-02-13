const { Client } = require("discord.js");

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
            ]
        })
        this.bridge = bridge
        this.verbose = verbose
        this.on("messageCreate", (msg) => {
            // this.log(msg)
            if (!channels.includes(msg.channel.id) || msg.author.id == this.user.id) return
            // this.log("Message is ok")
            this.bridge.emit("message", msg, {type: "discord", id: msg.channel.id})
        })
    }

    log(...args) {
        if (this.verbose) console.log("[Discord]", ...args)
    }

    start() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.login(process.env.DISCORD_TOKEN)
                this.log("Client connected")
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}

module.exports = DiscordClient