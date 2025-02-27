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

    const mentioned_user = this.getMentionedUsers(message.text);

    const userToChanMap = new Map();
    mentioned_user.forEach((user) =>
      userToChanMap.set(user, this.findUserChannels(user))
    );

    for (const chan of this.trackedChannelsIds) {
      const chan_msg = new Message();
      chan_msg.copy(msg);

      for (let [user, user_chans] of userToChanMap) {
        if (
          user_chans.includes(chan) &&
          !user_chans.includes(chan_msg.channel)
        ) {
          const user_id = this.getUserIdOfUserInChan(
            chan,
            user.replace("@", "")
          );
          chan_msg.text = chan_msg.text.replace(user, "<@" + user_id + ">");

          userToChanMap.delete(user);
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
      .members.cache.find((member) => member.user.username === username).id;
  }

  getMentionedUsers(text) {
    const regex = /@\S*(?=\s|$)/g;

    const matches = [...text.matchAll(regex)];

    return matches.map((str) => str[0].trim());
  }

  findUserChannels(user_name) {
    const channels = [];
    for (const [guildId, membersMap] of this.guildsMembers) {
      for (const [memberId, member] of membersMap) {
        if (member.user.username === user_name) {
          // Found the user, now find a readable channel
          for (const [channelId, channel] of this.trackedChannels) {
            if (this.memberCanReadChannel(memberId, channel)) {
              channels.push(channelId);
            }
          }
        }
      }
    }
    return channels;
  }

  sendTextInChannel(text, chan) {
    this.channels.cache
      .get(chan)
      ?.send(text)
      .then(() => {})
      .catch((error) =>
        this.log("when trying to send message in ", chan, " got ", error)
      );
  }

  memberCanReadChannel(userId, channel) {
    const guildId = this.channelsGuilds.get(channel.id);
    const member = this.guildsMembers.get(guildId).get(userId);

    if (!member.guild) {
      console.log("Member not part of a guild");
      return false;
    }

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
        console.error(`Error fetching channel with ID ${channelId}:`, error);
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
        console.error(`Error fetching members for guild ${guildId}:`, error);
      }
    }

    return guildsMembersMap;
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
        this.trackedChannelsIds
      );
      this.guildsMembers = await this.getGuildsMembers(
        Array.from(this.channelsGuilds.values())
      );
      for (const chanId of this.trackedChannelsIds) {
        this.trackedChannels.set(chanId, await this.channels.fetch(chanId));
      }
    });
  }
}

module.exports = DiscordClient;
