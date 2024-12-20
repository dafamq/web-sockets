const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const disconnectButton = document.getElementById("disconnect");

let reconnectAttempts = 0;
let socket = null;
let isWindowActive = true;
let userDisconnectInitiated = false;

function connect() {
	socket = new WebSocket("ws://localhost:8080");

	socket.onopen = () => {
		addMessage("Connected to the chat.", "info");
		messageInput.disabled = false;
		sendButton.disabled = false;
		disconnectButton.classList.remove("connect");
		disconnectButton.textContent = "Disconnect";
		reconnectAttempts = 0;
		userDisconnectInitiated = false;
	};

	socket.onclose = () => {
		if (userDisconnectInitiated) return;
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

disconnectButton.addEventListener("click", () => {
	if (userDisconnectInitiated) {
		connect();
		return;
	}

	fetch("http://localhost:8080/disconnect", {
		method: "GET",
	})
		.then((response) => {
			if (response.ok) {
				socket.close();
				userDisconnectInitiated = true;
				sendButton.disabled = true;
				messageInput.disabled = true;
				disconnectButton.classList.add("connect");
				disconnectButton.textContent = "Connect";
				addMessage(
					'Disconnected from the chat. Click "Connect" to reconnect.',
					"info"
				);
			}
		})
		.catch((error) => {
			addMessage("Failed to disconnect.", "error");
			console.error("Помилка при відключенні:", error);
		});
});

document.addEventListener("visibilitychange", () => {
	isWindowActive = document.visibilityState === "visible";
});
