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
generate systemd --name urlab_viaduk > /etc/systemd/system/urlab_viaduk.service
systemctl start urlab_viaduk
```

il faut potentiellement stop le service précédent et le reload une fois recréé


### to do

- diférencier le format entre irc et discord (pour avoir le gras dans le nom coté discord)
- ajouter les /command du lechebot pour avoir l'auto completion de discord