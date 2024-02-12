const { Client } = require("irc-framework");

class IRCClient extends Client {
    constructor(bridge, verbose = false) {
        super()
        this.bridge = bridge
        this.verbose = verbose
        this.on("message", (msg) => this.bridge.emit("message", msg))
    }

    log(...args) {
        if (this.verbose) console.log("[IRC]", ...args)
    }

    start() {
        return new Promise((resolve, reject) => {
            this.on("connected", () => {
                this.log("Client connected")
                resolve()
            })

            this.on("reconnecting", () => {
                this.log("Client reconnecting")
            })

            try {
                this.log("Trying to connect")
                this.connect({
                    host: process.env.IRC_HOST,
                    port: process.env.IRC_PORT,
                    nick: process.env.NICKNAME,
                    username: process.env.NICKNAME,
                })
            } catch (error) {
                reject(error)
            }
        })
    }

}

module.exports = IRCClient