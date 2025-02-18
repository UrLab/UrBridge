export class Message{
    constructor(){
        this.text;
        this.channel;
        this.author;
        this.source_type; // irc/discord...
    }

    fromDiscordFormat(discord_message){
        this.text = discord_message.content
        this.channel = discord_message.channelId
        this.author = discord_message.author.username
        this.source_type = "discord"
    }

    fromIRCFormat(irc_message){
        this.text = irc_message.message,
        this.channel = irc_message.target.toLowerCase(),
        this.author = irc_message.nick,
        this.source_type = "irc" 
    }
}
