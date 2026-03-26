import config from "@colyseus/tools";
import GimkitRoom from "./room";

export default config({
	options: {
		devMode: false
	},

	initializeGameServer(gameServer) {
		gameServer.define("MapRoom", GimkitRoom).enableRealtimeListing();
	}
});
