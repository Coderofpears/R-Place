import { CharactersItem, GimkitState } from "./schema/gimkitSchema";
import { IRoom, rooms } from "./mockBackend";
import { type Client, Room } from "colyseus";
import { randomUUID } from "crypto";
import fs from "fs";

const initialMsgs = JSON.parse(fs.readFileSync("assets/initial.json", "utf8"));

const afterRequestMsgs = JSON.parse(fs.readFileSync("assets/afterRequest.json", "utf8"));

interface IJoinArgs {
	intentId?: string;
	authToken?: string;
}

export default class GimkitRoom extends Room<GimkitState> {
	updateInterval: NodeJS.Timeout;
	room: IRoom;

	onCreate(opts: any) {
		this.setState(new GimkitState({ mapStyle: "platformer" }));

		this.onMessage("REQUEST_INITIAL_WORLD", (client) => {
			for (let message of afterRequestMsgs) {
				client.send(message.channel, message.message);
			}
		});

		this.onMessage("START_GAME", (client) => {
			// TODO: check if the client is actually allowed to do this

			this.state.session.phase = "game";
			this.state.session.gameSession.phase = "game";

			// TODO: do the rest of the map init things
		});

		// silence errors
		this.onMessage("*", () => {});

		this.updateInterval = setInterval(() => {
			this.state.session.gameTime = Date.now();
		}, 500);

		this.room = rooms.find((room) => room.roomId === opts.intentId);

		if (this.room) {
			this.room.colyseusRoomId = this.roomId;
			console.log("Room created with code", this.room.code);

			this.state.matchmaker.gameCode = this.room.code;
		} else {
			this.disconnect();
		}
	}

	onDispose() {
		clearInterval(this.updateInterval);
	}

	onJoin(client: Client, joinArgs: IJoinArgs) {
		const intent = this.room?.intents.get(joinArgs.intentId);
		
		if (!intent) {
			client.leave(4001, "Invalid intentId");
			return;
		}

		const id = randomUUID();

		if (!this.state.session.gameOwnerId) {
			this.state.session.gameOwnerId = id;
		}

		let player = new CharactersItem({
			id,
			name: intent.name,
			x: 626.0000228881836,
			y: 63645.013427734375
		});

		this.state.characters.set(id, player);

		client.send("AUTH_ID", id);

		for (let message of initialMsgs) {
			client.send(message.channel, message.message);
		}

		player.completedInitialPlacement = true;
	}

	onLeave(client: Client, consented: boolean) {
		if (!consented) {
			return; // TODO: What does this actually mean?
		}

		this.allowReconnection(client, 30);
	}
}
