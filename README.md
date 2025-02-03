# BridgeBot

This is a Bridge made to tie Discord Channels and IRC Channels. It works by using a Discord bot and a IRC Client.

## Installation

### docker

build l'image:

```bash
docker build -t urbridge:latest .
```

run un container temporaire (pour l'instant le bot ne sauve aucune data, donc il n'y a pas d'inconvénient à le recréer à chaque démarrage et delete quand il est arêté):

```bash
docker run -t urlab_viaduk --rm --env-file .env urbridge:latest
```

il faut un fichier .env spécifiant les variables suivantes: 

- DISCORD_TOKEN,
- IRC_HOST, l'adresse du serveur irc
- IRC_PORT, le port
- NICKNAME, le nom du bridge sur irc