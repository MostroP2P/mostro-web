## Mostro Web

Super early version of a web client for the [Mostro](https://github.com/MostroP2P/mostro) P2P System.

This project is a web interface that facilitates peer-to-peer bitcoin trading over the lightning network ⚡️ using nostr 🦩. The lightning network is a layer 2 scaling solution for bitcoin that enables fast and low-cost transactions.

### Prerequisites

#### Node.js and NPM
Node.js: Recommended version: `v20.15.1`

NPM: Recommended version: `10.7.0`

#### Mostro
* Clone [Mostro](https://github.com/MostroP2P/mostro)
* See detailed instructions [here](https://github.com/MostroP2P/mostro?tab=readme-ov-file#requirements)

### Installation
#### 1- Clone the repository
```bash
git clone git@github.com:MostroP2P/mostro-web.git
```

#### 2- Install Node Dependencies
```bash
npm install
```
#### 3 - Set up configuration
- Create a new environment file by `cp .env-sample .env`. Here you'll want to set 2 environment variables:

- `RELAYS`: A comma separated list of relays URLs. For example:
```bash
RELAYS=wss://relay.mostro.network,wss://relay.nostr.net
```
- `MOSTRO_PUB_KEY`: This is the identity of the mostro daemon you want to interact with and should match the private key (nsec) you specified in `mostro`. For example:
```bash
MOSTRO_PUB_KEY=npub19m9laul6k463czdacwx5ta4ap43nlf3lr0p99mqugnz8mdz7wtvskkm5wg
```

Once this is set, just run `source .env` to load these environment variables.

**Obs.** It is also possible, and sometimes desirable to run a private relay. There are instructions on how to do this with a docker container in the [mostro]([https://github.com/MostroP2P/mostro](https://github.com/MostroP2P/mostro?tab=readme-ov-file#option-1-run-mostro-with-a-private-dockerized-relay)) repository.

### 4. Run it
```bash
$ npm run dev
```

That's it! 🎉

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
-   [x] Direct message with peers
-   [x] Disputes
-   [ ] NIP59 support

### Generic Nuxt Scripts
This is a Nuxt 3 project, and as such you have these scripts to build an SSR ready version and/or generate a static release.

```bash
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

### License

This project is licensed under the MIT License 📜. See the `LICENSE` file for more information.
