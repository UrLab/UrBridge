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
      internal_msg.fromDiscordFormat(msg);
      this.bridge.broadcast(internal_msg);
    });
  }

  log(...args) {
    if (this.verbose) console.log("[Discord]", ...args);
  }

  async broadcast(message) {
    const msg = await this.formatMessageForForward(message);
    for (const chan of this.trackedChannelsIds) {
      if (chan != msg.channel) {
        // do not send in the channel the message is comming from
        this.sendTextInChannel(msg.text, chan);
      }
    }
  }

  async formatMessageForForward(msg) {
    const res_msg = { ...msg };

    res_msg.text = await this.escapePing(res_msg.text, (id) => {
      return this.memberCanReadChannel(id, this.trackedChannels.get(msg.channel));
    });
    res_msg.text = `[**${msg.author}**]: ${res_msg.text}`;

    return res_msg;
  }

  async escapePing(text, filter) {
    let res_text = text;
    if (text.includes("<@")) {
      const regex = /<@(\d+)>/g;

      const matches = [...text.matchAll(regex)];

      const userReplacements = [];

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const userId = match[1];
        try {
          const user = await this.users.fetch(userId);
          userReplacements.push({ match, username: user.username });
        } catch (error) {
          console.error("Error fetching user:", error);
          userReplacements.push({ match, username: null });
        }
      }

      for (let i = 0; i < userReplacements.length; i++) {
        const { match, username } = userReplacements[i];

        const replacement = username ? `@${username}` : match[0];
        res_text = res_text.replace(match[0], replacement);
      }

      return res_text;
    }
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
    return (permissions && permissions.has("ViewChannel"));
  }

  async mapChannelIdsToGuild(channelIds) {
    const channelToGuildMap = new Map();

    for (let i = 0; i < channelIds.length; i++) {
      const channelId = channelIds[i];
      try {
        const channel = await this.channels.fetch(channelId);

        if (channel.guild) {
          channelToGuildMap.set(channel.id, channel.guild.id);
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
