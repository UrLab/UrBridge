const { Client } = require("discord.js");

class DiscordClient extends Client {
    constructor(bridge, verbose = false) {
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
        this.on("message", (msg) => this.bridge.emit("message", msg))
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