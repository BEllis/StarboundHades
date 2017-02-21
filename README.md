# StarboundHades

An application that extends Starbound with improved modding support.

## Client

### Installation

Download and run the latest Hades client installer for your platform, following the on screen instructions.

- Windows
- Mac OS

### Troubleshooting

If you run into any trouble, you can search or raise an issue from the issues page. Try to include as much information as you can, including,

- The platform or operating system you're using (e.g. Windows 10 64bit or Windows 7.1 32bit), 
- The contents of your hades.log file.
- The contents of your starbound.log file.
- The steps you can take to reproduce the problem.
- What you expected to happen.
- What actually happened.

## Servers

### Making a server compatible with the Hades client.

In order for a server to be compatible with the hades client, it will need to provide the following,

For each mod (if any),

- *.pak* - A public url to the PAK file for the mod.
- *.pak.sha256* - A public url that responds with the SHA256 of the .pak, this is used to detect changes to the .pak file and update the client where necessary.

- *server-status.json* - A url that gives a JSON response in the form,

```json
{
  "status": "active",
  "version": "1.2.2",
  "platform": "linux x86_64",
  "sourceId": "8656b8d30f3e41248de5868d2168c96962fbf6b2",
  "protocol": "729",
  "players": [
    {
      name: 'DragonWolf',
      registered: true
    },
    {
      name: 'Skubs',
      registered: false
    }    
  ]
}
```

- *server-info.json* - A url that gives a JSON response in the form,

```json
{
  "address": "starbound.hades.rocks",
  "name": "starbound.hades.rocks -=[ http:\/\/starbound.hades.rocks\/ ]=-",
  "url": "http:\/\/starbound.hades.rocks\/",
  "registrationUrl": "http:\/\/starbound.hades.rocks\/register",
  "email": "admin@hades.rocks",
  "description": "Hades Underbound Server",
  "infoUrl": "http:\/\/starbound.hades.rocks:21080\/info",
  "statusUrl": "http:\/\/starbound.hades.rocks:21080\/status",
  "mods": [
    {
      "author": "OokamiNoRyuu",
      "version": "0.1a",
      "friendlyName": "starbound.hades.rocks mod pack",
      "name": "starbound.hades.rocks mod pack",
      "description": "The mods required to play on the starbound.hades.rocks server.",
      "link": "starbound.hades.rocks",
      "pakUrl": "http:\/\/starbound.hades.rocks:21080\/mods\/0db15cfb4cfadfdfaff77a32ecac738efc2a9e31509ea47a101b1de29fd768ef.pak",
      "pakSha256": "0db15cfb4cfadfdfaff77a32ecac738efc2a9e31509ea47a101b1de29fd768ef"
    }
  ]
}
```

### Adding a server to the public server listings

To add your server to the public server listings, you'll need to apply with one of the registered public listing servers below,

- Hades Server Listings ( http://www.hades.rocks/addServer )

### Adding a listing server to the master server list.

To add a listing server, make a git pull request to add your server to the master list of listing servers and we'll try to get back to you within 24 hours.

*Note: We typically only approve requests for servers listing 5 or more servers that they host themselves, if you have less than 5 servers we suggest registering the servers with an existing listing server.*

##Roadmap

1. Allow updating of mods to match server mods.
2. Provide public server listings.
3. Allow ability to add private servers.
4. Lock characters to servers (must create new character when joining a server for the first time).
5. Cloud backup Starbound characters.
6. Allow interprocess communication between lua scripts and the hades application.
7. Allow save/load of local files contained in a local directory.
8. Allow send/receive of messages between client and server.
