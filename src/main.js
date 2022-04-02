const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 })

wss.on("listening", () => {
    console.log(`WebSocket Server listening on port ${8080}`)
})

const clients = new Set();

wss.on("connection", (ws) => {
    const id = uuidv4();
    const color = Math.floor(Math.random() * 360);
    const metadata = { id, color };
    ws.metadata = metadata;

    clients.add(ws);

    ws.on("message", (messageAsString) => {
        console.log('received: %s', messageAsString);
        const message = JSON.parse(messageAsString);

        message.sender = ws.metadata.id;
        message.color = ws.metadata.color;

        const outbound = JSON.stringify(message);

        [...clients.keys()].forEach((client) => {
            if (message.sender !== client.metadata.id) {
                client.send(outbound);
            }
        });
    })

    ws.on("close", () => {
        clients.delete(ws);
    });
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}