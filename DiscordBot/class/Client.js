const { Client } = require("discord.js");
const { Message } = require("../../Bridge/class/Message");

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
            ],
        });

        this.bridge = bridge;
        this.verbose = verbose;
        this.trackedChannelsIds = channels;
        this.trackedChannels = new Map();
        this.channelsGuilds = new Map();
        this.guildsMembers = new Map();

        this.on("messageCreate", (msg) => {
            this.log("message recived", msg);

            // catch self messages
            if (msg.author.id == this.user.id) return;
            // only propagate messages from tracked channels
            if (!this.trackedChannelsIds.includes(msg.channelId)) return;

            const internal_msg = new Message();
            internal_msg
                .fromDiscordFormat(msg, this)
                .then(() => this.bridge.broadcast(internal_msg));
        });
    }

    log(...args) {
        if (this.verbose) console.log("[Discord]", ...args);
    }

    async broadcast(message) {
        const msg = await this.formatMessageForForward(message);

        const mentioned_users = this.getMentionedUsers(message.text);

        const mentionned_users_info = new Map();
        mentioned_users.forEach((user) =>
            mentionned_users_info.set(
                user,
                this.getUserInfoFromMention(user.replace("@", "")),
            ),
        );

        for (const chan of this.trackedChannelsIds) {
            const chan_msg = new Message();
            chan_msg.copy(msg);

            for (let [user, user_info] of mentionned_users_info) {
                if (
                    user_info.channels.includes(chan) &&
                    !user_info.channels.includes(chan_msg.channel)
                ) {
                    this.log(
                        "replaced with",
                        "<@" + (user_info.id ? user_info.id : user) + ">",
                    );
                    // mentionned user is in the channel we are sending to, and not in the channel we are sending from
                    chan_msg.text = chan_msg.text.replace(
                        user,
                        "<@" + (user_info.id ? user_info.id : user) + ">",
                    );

                    mentionned_users_info.delete(user);
                }
            }

            if (chan != msg.channel) {
                // do not send in the channel the message is comming from
                this.sendTextInChannel(chan_msg.text, chan);
            }
        }
    }

    async formatMessageForForward(msg) {
        const res_msg = { ...msg };

        res_msg.text = `[**${msg.author}**]: ${res_msg.text}`;

        return res_msg;
    }

    getUserIdOfUserInChan(chan, username) {
        return this.channelsGuilds
            .get(chan)
            .members.cache.find((member) => member.user.username === username)
            ?.id;
    }

    getMentionedUsers(text) {
        const regex = /@\S*(?=\s|$)/g;

        const matches = [...text.matchAll(regex)];

        return matches.map((str) => str[0].trim());
    }

    getUserInfoFromMention(user_name) {
        const info = {
            channels: [],
            id: null,
        };
        for (const [chan, guild] of this.channelsGuilds) {
            for (const [member_id, member] of guild.members.cache) {
                this.log(member);
                if (member.user.username === user_name) {
                    // maybe also check against global name and displayname
                    info.id = member.user.id;
                    // Found the user, now find readable channels
                    for (const [channelId, channel] of this.trackedChannels) {
                        if (this.memberCanReadChannel(member, channel)) {
                            info.channels.push(channelId);
                        }
                    }
                }
            }
        }
        return info;
    }

    sendTextInChannel(text, chan) {
        this.channels.cache
            .get(chan)
            ?.send(text)
            .then(() => {})
            .catch((error) =>
                this.log(
                    "when trying to send message in ",
                    chan,
                    " got ",
                    error,
                ),
            );
    }

    memberCanReadChannel(member, channel) {
        const permissions = channel.permissionsFor(member);
        return permissions && permissions.has("ViewChannel");
    }

    async mapChannelIdsToGuild(channelIds) {
        const channelToGuildMap = new Map();

        for (let i = 0; i < channelIds.length; i++) {
            const channelId = channelIds[i];
            try {
                const channel = await this.channels.fetch(channelId);

                if (channel.guild) {
                    channelToGuildMap.set(channel.id, channel.guild);
                }
            } catch (error) {
                console.error(
                    `Error fetching channel with ID ${channelId}:`,
                    error,
                );
            }
        }

        return channelToGuildMap;
    }

    async getGuildMembers(guildId) {
        const guild = await this.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        const memberMap = new Map();
        members.forEach((member) => {
            memberMap.set(member.id, member);
        });

        return memberMap;
    }

    async getGuildsMembers(guildIds) {
        const guildsMembersMap = new Map();

        for (const guildId of guildIds) {
            try {
                const membersMap = await this.getGuildMembers(guildId);

                guildsMembersMap.set(guildId, membersMap);
            } catch (error) {
                console.error(
                    `Error fetching members for guild ${guildId}:`,
                    error,
                );
            }
        }

        return guildsMembersMap;
    }

    async refreshMembersCache() {
        for (const [channel, guild] of this.channelsGuilds) {
            guild.members.fetch().then((members) => {
                this.log("members cache loaded for ", guild.name);
            });
        }
    }

    start() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.login(process.env.DISCORD_TOKEN);
                this.log("Client connected");
                resolve();
            } catch (error) {
                reject(error);
            }

            this.channelsGuilds = await this.mapChannelIdsToGuild(
                this.trackedChannelsIds,
            );

            this.refreshMembersCache();

            for (const chanId of this.trackedChannelsIds) {
                this.trackedChannels.set(
                    chanId,
                    await this.channels.fetch(chanId),
                );
            }
        });

        this.on("guildMemberAdd", (member) => {
            this.refreshMembersCache();
        });

        this.on("guildMemberRemove", (member) => {
            this.refreshMembersCache();
        });
    }
}

module.exports = DiscordClient;
