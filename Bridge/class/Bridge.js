const DiscordClient = require("../../DiscordBot")
const IRCClient = require("../../IRCBot")
const {EventEmitter} = require("node:events")

class Bridge extends EventEmitter {
    constructor(verbose) {
        super()
        this.discordClient = new DiscordClient(this, verbose)
        this.ircClient = new IRCClient(this, verbose)
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
}

module.exports = Bridge