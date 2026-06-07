# BridgeBot

This is a Bridge made to tie Discord Channels and IRC Channels. It works by using a Discord bot and a IRC Client.

## Installation

### docker

build l'image:

```bash
podman build -t urbridge:latest .
```

run un container temporaire (pour l'instant le bot ne sauve aucune data, donc il n'y a pas d'inconvénient à le recréer à chaque démarrage et delete quand il est arêté):

```bash
podman run --name urlab_viaduk --rm --env-file .env urbridge:latest
```

il faut un fichier .env spécifiant les variables suivantes:

- DISCORD_TOKEN,
- IRC_HOST, l'adresse du serveur irc
- IRC_PORT, le port
- NICKNAME, le nom du bridge sur irc

### sur le vps

```bash
podman run --network host -d --name urlab_viaduk --rm --env-file .env urbridge:latest
```

### Matrix

pour regénérer un token:
```bash
curl -X POST "https://matrix.urlab.be/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "urbridge"
    },
    "password": "password"
  }'
```
puis mettre le token dans .env

si vous avez pas le password niquez vous



### to do

- ajouter les /command du lechebot pour avoir l'auto completion de discord
- utiliser des web hook pour poster des messages avec le nom et pp de l'utilisateur sur discord
- permetre de lier le compte discord au compte irc
