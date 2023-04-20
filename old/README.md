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

### Build Setup

```bash
# install dependencies
$ npm install

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
-   [ ] Buyer Takes Sell
-   [ ] Seller Takes Buy
-   [ ] Handling multiple relays
-   [ ] NIP-07 for key management
-   [ ] Persisting old events?

### License

This project is licensed under the MIT License 📜. See the `LICENSE` file for more information.