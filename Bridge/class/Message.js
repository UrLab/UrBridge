export class Message {
    constructor() {
        this.text;
        this.channel;
        this.author;
        this.source_type; // irc/discord...
    }

    async fromDiscordFormat(discord_message, discordClient) {
        this.text = await this.escapeDiscordPing(
            discord_message.content,
            discordClient,
        );
        this.text += discord_message.attachments.map((a) => a.url).join("\n");
        console.log("escaped text", this.text);
        this.channel = discord_message.channelId;
        this.author = discord_message.author.displayName;
        this.source_type = "discord";
    }

    fromIRCFormat(irc_message) {
        (this.text = irc_message.message),
            (this.channel = irc_message.target.toLowerCase()),
            (this.author = irc_message.nick),
            (this.source_type = "irc");
    }

    async escapeDiscordPing(text, client) {
        let res_text = text;

        const regex = /<@(\d+)>/g;

        const matches = [...text.matchAll(regex)];
        const userReplacements = [];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const userId = match[1];
            try {
                const user = await client.users.fetch(userId);
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

    copy(msg) {
        this.text = msg.text;
        this.channel = msg.channel;
        this.author = msg.author;
        this.source_type = msg.source_type;
    }
}
