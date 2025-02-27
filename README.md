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
docker run --name urlab_viaduk --rm --env-file .env urbridge:latest
```

il faut un fichier .env spécifiant les variables suivantes: 

- DISCORD_TOKEN,
- IRC_HOST, l'adresse du serveur irc
- IRC_PORT, le port
- NICKNAME, le nom du bridge sur irc

### sur le vps

pour déployer sur le vps, on utilise podman à la place de docker

il faut donc remplacer docker par podman pour build l'image

le lancement est chelou, pour l'instant on le fait en passant par un service systemd:

d'abord créer le container
```bash
podman create --name urlab_viaduk --rm --env-file .env urbridge:latest
```

puis créer le service:

```bash
podman generate systemd --name urlab_viaduk > /etc/systemd/system/urlab_viaduk.service
systemctl start urlab_viaduk
```

il faut potentiellement stop le service précédent et faire un `systemctl daemon-reload` une fois recréé


### to do

- ajouter les /command du lechebot pour avoir l'auto completion de discord
- utiliser des web hook pour poster des messages avec le nom et pp de l'utilisateur sur discord
- permetre de lier le compte discord au compte irc
