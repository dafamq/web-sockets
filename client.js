const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

let reconnectAttempts = 0;
let socket = null;
let isWindowActive = true;

function connect() {
	socket = new WebSocket("ws://localhost:8080");

	socket.onopen = () => {
		addMessage("Connected to the chat.", "info");
		reconnectAttempts = 0;
	};

	socket.onclose = () => {
		if (reconnectAttempts < 5) {
			setTimeout(() => {
				reconnectAttempts++;
				connect();
			}, 1000 * reconnectAttempts); // Експоненціальне збільшення часу між спробами
		} else {
			addMessage("Failed to reconnect.", "error");
		}
	};

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		addMessage(data.message, data.type);
	};

	socket.onerror = () => {
		addMessage("Error: Failed to connect to the chat.", "error");
	};
}

connect();
if (Notification.permission === "default") {
	Notification.requestPermission();
}

function addMessage(content, type = "message") {
	const messageElement = document.createElement("div");
	messageElement.textContent = content;
	messageElement.className = type;
	chat.appendChild(messageElement);
	chat.scrollTop = chat.scrollHeight;

	if (!isWindowActive && type === "message") {
		showNotification("New message", content);
	}
}

function showNotification(title, message) {
	if (Notification.permission === "granted") {
		new Notification(title, { body: message });
	} else if (Notification.permission === "default") {
		Notification.requestPermission().then((permission) => {
			if (permission === "granted") {
				new Notification(title, { body: message });
			}
		});
	}
}

sendButton.addEventListener("click", () => {
	const message = messageInput.value.trim();
	if (message) {
		socket.send(JSON.stringify({ type: "message", message }));
		messageInput.value = "";
	}
});

document.addEventListener("visibilitychange", () => {
	isWindowActive = document.visibilityState === "visible";
});
