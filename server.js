const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });
let clients = new Set();

server.on("connection", (socket) => {
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

console.log("WebSocket server running on ws://localhost:8080");
