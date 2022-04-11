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

    ws.send(JSON.stringify({
        type: "metadata",
        client: ws.metadata
    }));

    [...clients.keys()].forEach((client) => {
        if (client.metadata.id !== ws.metadata.id) {
            client.send(JSON.stringify({
                type: "new-client",
                client: ws.metadata
            }));
            ws.send(JSON.stringify({
                type: "new-client",
                client: client.metadata
            }))
        }
    })

    ws.on("message", (messageAsString) => {
        console.log('received: %s', messageAsString);
        const message = JSON.parse(messageAsString);

        message.sender = ws.metadata.id;
        message.color = ws.metadata.color;

        const outbound = JSON.stringify(message);

        if (message.type === "audio-toggle") {
            [...clients.keys()].forEach((client) => {
                if (ws.metadata.id !== client.metadata.id) {
                    client.send(outbound);
                }
            });    
        } else if(message.type === "login") {
            ws.metadata.name = message.data.name;
            ws.send(JSON.stringify({
                type: "login-success",
                data: message.data.name
            }))
        } else {
            [...clients.keys()].forEach((client) => {
                if (message.to.id === client.metadata.id) {
                    client.send(outbound);
                }
            });
        }
    })

    ws.on("close", () => {
        [...clients.keys()].forEach((client) => {
            if (client.metadata.id !== ws.metadata.id) {
                client.send(JSON.stringify({
                    type: "client-disconnected",
                    client: ws.metadata
                }))
            }
        })
        clients.delete(ws);
    });
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}