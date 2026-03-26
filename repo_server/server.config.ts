import { config } from "./src/utils.js";

export default config({
    // The address that the server uses
    address: "localhost",

    // The internal ports to use 
    apiPort: 5923,
    gamePort: 5924,

    // The game server port to send to clients (if different)
    // visibleGamePort: 5924,

    // Plugins for the server to use
    plugins: [],

    // Plugins to apply per-map
    // mapPlugins: {}
});
