import { Client, Room } from "blueboat-client";
import StegCloak from "stegcloak";

import type API from "./api";

export class LiveGame {
	api: API;
	useStegCloak: boolean;
	gameCode: number;
	name: string;
	roomID?: string;
	intentID?: string;
	source?: string;
	serverURL?: string;

	constructor(api: API, useStegCloak: boolean, gameCode: number, name: string) {
		this.api = api;
		this.useStegCloak = useStegCloak;
		this.gameCode = gameCode;
		this.name = name;
	}

	async getClientType() {
		if (this.useStegCloak) {
			const response = await this.api.getPlaintext("/api/v1/jid");

			const cloak = new StegCloak(true, false);

			return cloak.hide(
				response.split("").reverse().join(""),
				"BSKA",
				"Gimkit Web Client V3.1"
			);
		}

		return "librekit";
	}

	async join() {
		const roomInfo = await this.api.post(
			"/api/matchmaker/find-info-from-code",
			{
				code: this.gameCode
			}
		);

		console.info("roomInfo:", roomInfo);

		if (
			typeof roomInfo.message === "object" &&
			typeof roomInfo.message.text === "string"
		) {
			// We know something went wrong.
			throw new Error(roomInfo.message.text);
		}

		const roomId = roomInfo.roomId;
		const useRandomNamePicker = roomInfo.useRandomNamePicker;

		if (useRandomNamePicker) {
			throw new Error(
				"librekit does not implement the nickname generator yet, so you can't join this game with librekit. Sorry!"
			);
		}

		//
		// This is the part where we actually start to join the game.
		//

		const joinInfo = await this.api.post("/api/matchmaker/join", {
			clientType: await this.getClientType(),
			roomId: roomId,
			name: this.name
		});

		console.info("joinInfo:", joinInfo);

		if (
			typeof roomInfo.message === "object" &&
			typeof roomInfo.message.text === "string"
		) {
			// We know something went wrong.
			throw new Error(roomInfo.message.text);
		}

		this.roomID = joinInfo.roomId;
		this.intentID = joinInfo.intentId;
		this.source = joinInfo.source;
		this.serverURL = joinInfo.serverUrl;
	}
}

export class OriginalLiveGame {
	liveGame: LiveGame;
	client: Client;
	room?: Room;

	constructor(liveGame: LiveGame, callback: (room: Room) => void) {
		this.liveGame = liveGame;

		if (
			!this.liveGame.serverURL ||
			typeof this.liveGame.serverURL !== "string"
		) {
			throw new Error(
				"liveGame.serverURL is invalid or not defined. Make sure to run the join async function first!"
			);
		}

		if (!this.liveGame.roomID || typeof this.liveGame.serverURL !== "string") {
			throw new Error(
				"liveGame.roomID is invalid or not defined. Make sure to run the join async function first!"
			);
		}

		if (
			!this.liveGame.intentID ||
			typeof this.liveGame.serverURL !== "string"
		) {
			throw new Error(
				"liveGame.intentID is invalid or not defined. Make sure to run the join async function first!"
			);
		}

		this.client = new Client(this.liveGame.serverURL, {
			blockClientIdSaving: true
		});

		(window as any).blueboatClient = this.client;

		this.client.onConnect.add(() => {
			console.info("Connected to the Blueboat server!");

			// @ts-ignore
			this.room = this.client.joinRoom(this.liveGame.roomID, {
				intent: this.liveGame.intentID
			});

			this.room.onJoin.add(() => {
				console.info("Joined the Blueboat room!");

				(window as any).blueboatRoom = this.room;
			});

			callback(this.room);

			this.room.onLeave.add(() => {
				console.info("Left the Blueboat room!");
			});
		});

		this.client.onConnectError.add(() => {
			throw new Error("Failed to connect to Blueboat!");
		});

		this.client.onDisconnect.add(() => {
			console.info("Disconnected from the Blueboat server!");
		});
	}
}
