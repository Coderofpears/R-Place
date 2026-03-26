import express from "express";
import cors from "cors";
import { GAME_SERVER_URL } from "./constants";
import { randomUUID } from "crypto";
import { matchMaker } from "colyseus";
import bodyParser from "body-parser";

export interface IIntent {
	name: string;
}

export interface IRoom {
	roomId: string;
	mapId: string;
	code: string;
	intents: Map<string, IIntent>;
	colyseusRoomId?: string;
}

export const rooms: IRoom[] = [];

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

app.get("/api/matchmaker/instant-join", (_, res) => {
	res.status(500);
	res.json({ message: { text: "You're not in any groups" } });
});

app.post("/api/matchmaker/find-info-from-code", (req, res) => {
	let room = rooms.find((room) => room.code === req.body.code);

	// Testing only- make the room FOR them

	if (!room) {
		room = {
			roomId: randomUUID(),
			mapId: randomUUID(),
			intents: new Map(),
			code: req.body.code
		};

		rooms.push(room);

		matchMaker.createRoom("MapRoom", {
			intentId: room.roomId
		});
	}

	if (room) {
		res.json({ roomId: room.mapId, useRandomNamePicker: false });
	} else {
		res.status(500);
		res.json({ message: { text: "Game not found" }, code: 404 });
	}
});

app.post("/api/matchmaker/join", (req, res) => {
	if (
		!req.body.name ||
		typeof req.body.name !== "string" ||
		req.body.name.length === 0 ||
		req.body.name.length > 20
	) {
		res.status(500);
		res.json({
			message: { text: "Name must be between 1 and 20 characters" },
			code: 400
		});
		return;
	}
	
	const room = rooms.find((room) => room.mapId === req.body.roomId);

	if (room) {
		const intentId = randomUUID();

		room.intents.set(intentId, { name: req.body.name });

		setTimeout(() => {
			res.json({
				source: "map",
				serverUrl: GAME_SERVER_URL,
				roomId: room.colyseusRoomId,
				intentId
			});
		}, 1000);
	} else {
		res.status(500);
		res.json({ message: { text: "Game not found" }, code: 404 });
	}
});

app.listen(7857, () => {
	console.log("Server running on port 3000");
});
