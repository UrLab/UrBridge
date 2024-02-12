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
            const timeOutMsg = setTimeout(() => {
                this.log("Trying to connect . . . ")
            }, 10000)
            this.on("connected", () => {
                clearTimeout(timeOutMsg)
                this.log("Client connected")
                resolve()
            })

            this.on("close", () => {
                clearTimeout(timeOutMsg)
                this.log(`Can't connect to ${process.env.IRC_HOST}:${process.env.IRC_PORT}`)
            })

            try {
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