const sdk = require("matrix-js-sdk");
const { logger } = require("matrix-js-sdk/lib/logger");
const { Message } = require("../../Bridge/class/Message");

class MatrixClient {
    constructor(bridge, verbose = false, server, channels) {
        this.bridge = bridge;
        this.channels = channels;
        this.verbose = verbose;
        this.userId = process.env.MATRIX_USER_ID;
        this.server = server;
        this._room_name_to_id = {};

        logger.disableAll();

        this.log("serv", this.server, "chans", channels);

        this.client = sdk.createClient({
            baseUrl: "https://" + this.server,
            accessToken: process.env.MATRIX_TOKEN,
            userId: this.userId,
        });
    }

    log(...args) {
        if (this.verbose) console.log("[Matrix]", ...args);
    }

    broadcast(message) {
        const msg = this._fromatMessageForForward(message);
        this.log("broadcasting message", msg);
        for (const chan in this._room_name_to_id) {
            // do not send in the channel the message is comming from
            const chanId = this._room_name_to_id[chan];
            if (message.source_type != "matrix" || chanId != msg.channel) {
                this._sendTextInChannel(msg.text, chanId);
            }
        }
    }

    _fromatMessageForForward(msg) {
        const res_msg = { ...msg };
        res_msg.text = "[" + msg.author + "]: " + msg.text;
        return res_msg;
    }

    _sendTextInChannel(text, chanId) {
        this.client.sendMessage(chanId, {
            msgtype: "m.text",
            body: text,
        });
    }

    async _joinRooms() {
        for (const room of this.channels) {
            await this.client.joinRoom(this._formatRoomName(room));
        }
    }

    _formatRoomName(name) {
        return `#${name}:${this.server}`;
    }

    _onMessage(matrixEvent, room, toStartOfTimeline) {
        //this.log(matrixEvent);
        if (matrixEvent.getType() !== "m.room.message") return;
        if (matrixEvent.getSender() == this.userId) return; // catch self messages

        const internal_msg = new Message();
        internal_msg.fromMatrixFormat(matrixEvent, room);
        this.log(internal_msg);

        this.bridge.broadcast(internal_msg);
    }

    async start() {
        this.client.startClient({ initialSyncLimit: 10 });
        this.client.once(
            sdk.ClientEvent.Sync,
            async (state, prevState, res) => {
                if (state === "PREPARED") {
                    this.log("prepared");
                    await this._joinRooms(); // not needed to join every time, once is enough, but rejoin just in case

                    for (const room of this.client.getRooms()) {
                        if (this.channels.includes(room.name)) {
                            this._room_name_to_id[room.name] = room.roomId;
                        }
                    }
                    this.log(this._room_name_to_id);
                    this.client.on(
                        "Room.timeline",
                        (matrixEvent, room, toStartOfTimeline) => {
                            this._onMessage(
                                matrixEvent,
                                room,
                                toStartOfTimeline,
                            );
                        },
                    );
                } else {
                    this.log(state);
                    process.exit(1);
                }
            },
        );
    }
}

module.exports = MatrixClient;
