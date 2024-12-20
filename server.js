const http = require("http");
const WebSocket = require("ws");

const wsServer = new WebSocket.Server({ noServer: true });
let clients = new Set();

const server = http.createServer((req, res) => {
	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	// Handle preflight request (OPTIONS)
	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	// Handle disconnect route
	if (req.url === "/disconnect" && req.method === "GET") {
		const socket = req.socket;

		clients.delete(socket);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				type: "success",
				message: "Disconnected successfully",
			})
		);
	} else {
		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ type: "error", message: "Not Found" }));
	}
});

wsServer.on("connection", (socket) => {
	clients.add(socket);
	console.log("New user joined");

	broadcast({ type: "info", message: "A new user joined the chat." }, socket);

	socket.on("message", (message) => {
		try {
			const parsed = JSON.parse(message);
			if (parsed.type && parsed.message) {
				broadcast(parsed);
			} else {
				socket.send(
					JSON.stringify({
						type: "error",
						message: "Invalid message format",
					})
				);
			}
		} catch {
			socket.send(
				JSON.stringify({ type: "error", message: "Invalid JSON" })
			);
		}
	});

	socket.on("close", () => {
		clients.delete(socket);
		console.log("User left");
		broadcast({ type: "info", message: "A user left the chat." });
	});

	socket.on("error", (err) => {
		console.error("Socket error:", err.message);
	});
});

function broadcast(data, sender) {
	clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN && sender !== client) {
			client.send(JSON.stringify(data));
		}
	});
}

server.on("upgrade", (req, socket, head) => {
	wsServer.handleUpgrade(req, socket, head, (ws) => {
		wsServer.emit("connection", ws, req);
	});
});

server.listen(8080, () => {
	console.log("WebSocket server running on ws://localhost:8080");
});
