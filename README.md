## Mostro Web

Super early version of a web client for the [Mostro](https://github.com/MostroP2P/mostro) P2P System.

This project is a web interface that facilitates peer-to-peer bitcoin trading over the lightning network ⚡️ using nostr 🦩. The lightning network is a layer 2 scaling solution for bitcoin that enables fast and low-cost transactions.

### Configuration - (Dev only 🧑‍💻)

Create a `.env` file with these 3 environment variable defined:

```
RELAYS=<comma-separated-list-of-relay-urls>
MOSTRO_PUB_KEY=<public-key-of-your-mostro-instance>
SECRET_KEY=<the-user-secret-key>
```

### Prerequisites
#### Polar
* Install [Docker](https://docs.docker.com/get-docker/)
* Install [Polar](https://lightningpolar.com/)
  * If you're on Mac please follow [Open a Mac app from an unidentified developer](https://support.apple.com/en-lk/guide/mac-help/mh40616/mac)
* Create a new default network
* Add some funds to the nodes

#### Mostro
* Clone the [Mostro App](https://github.com/MostroP2P/mostro)
* See detailed instructions [here](https://github.com/MostroP2P/mostro?tab=readme-ov-file#requirements)


#### Mostro Web
* Install [Node](https://nodejs.org/en/download/) latest LTS version
* Create a new environment file by `cp .env-sample .env`
* Generate som `nsec` and `npub` keys using [nostrtool](https://nostrtool.com/) or [Rana](https://github.com/grunch/rana) and paste it in a new `.env` file under `MOSTRO_PUB_KEY` and `SECRET_KEY` keys
* Set RELAYS to `ws://localhost:7000` in the `.env` file
* Run `yarn install`

### You're now ready to go.
With `docker` and `polar` already running then do...
1. In `mostro` folder 
    ```bash
    $ ./init_db.sh
    $ cargo run
    $ cd relay
    $ docker compose up -d
    ```
2. In `mostro-web` folder
    ```bash
    $ yarn dev
    ```
That's it! 🎉

### Build Setup

```bash
# install dependencies
$ npm install

# Production build and version generation
# There's no need to run this every time, but run this at least once 
# before running `npm run dev`
$ npm run build

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out the [documentation](https://nuxtjs.org).

### Features
-   [x] Posts Orders (Buy & Sell)
-   [x] Displays order list
-   [x] Decodes DMs from mostro
-   [x] Buy flow (maker / market rate)
-   [x] Buy flow (maker / fixed price)
-   [x] Sell flow (maker / market rate)
-   [x] Sell flow (maker / fixed price)
-   [x] Buy flow (taker / market rate)
-   [x] Buy flow (taker / fixed price)
-   [x] Sell flow (taker / market rate)
-   [x] Sell flow (taker / fixed price)
-   [x] Handling multiple relays
-   [x] NIP-07 for key management
-   [x] Persisting old events
-   [ ] Direct message with peers
-   [ ] Ephemeral identities
-   [ ] Disputes

### License

This project is licensed under the MIT License 📜. See the `LICENSE` file for more information.
