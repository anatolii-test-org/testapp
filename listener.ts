import express from 'express';
import http from "http";
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 3200;

app.get('/ping', (req, res) => {
    res.status(200).send('pong')
})

server.listen(port, () => {
    console.log("e2e listener is started");
});