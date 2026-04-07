const DiscordClient = require("../../DiscordBot");
const IRCClient = require("../../IRCBot");
const MatrixClient = require("../../MatrixBot");

class Bridge {
    constructor() {
        const verbose = process.env.VERBOSE == "true" ? true : false;

        const discordChannels = process.env.DISCORD_CHANNELS.split(",");
        const ircChannels = process.env.IRC_CHANNELS.split(",");
        const matrixChannels = process.env.MATRIX_CHANNELS.split(",");

        if (!discordChannels || !ircChannels) {
            this.log("Missing channels");
            throw new Error("Missing discordChannels or ircChannels");
        }

        this.clients = [
            new DiscordClient(
                this,
                verbose,
                discordChannels,
                process.env.DISCORD_APP_ID,
            ),
            //new IRCClient(this, verbose, ircChannels),
            new MatrixClient(
                this,
                verbose,
                process.env.MATRIX_SERVER,
                matrixChannels,
            ),
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
