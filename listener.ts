import express, { raw } from 'express';
import http from "http";
import { Octokit, App } from "octokit";
import * as axios from "axios";
import * as dotenv from 'dotenv';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 3000;
const bodyParser = require('body-parser')
dotenv.config()
const pk = process.env.PRIVATE_KEY
const EVENTS = ['edited', 'reopened', 'opened']

let ghApp: App
if (typeof pk === "string")
    ghApp = new App({appId: 233277, privateKey: pk})
else new Error("App Private key is not a string")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/ping', (req, res) => {
    res.status(200).send('pong')
})

app.post('/gh-webhook', async (req, res) => {
    const body = req.body
    const action = body.action
    console.log("action:" + action)

    const repositoryName = body.repository.name
    const orgName = body.organization.login

    if (EVENTS.includes(body.action) && body.pull_request) {
        const pullRequestNumber = body.pull_request.number
        console.log(action + "/" + orgName + "/" + repositoryName + "/" + pullRequestNumber)
        const url = process.env.RESULTS_URL + '/api/v1/task/update/queue/?repository_name=client&build_version=1.18378.0'
        const updRes = await axios.default.get(url, {headers: {"accept": "application/json"}})

        const commentResult = await createComment(body, `[${action}] [${repositoryName}] [${pullRequestNumber}] e2e tests triggered ${JSON.stringify(updRes.data)}`)
        console.log(JSON.stringify(commentResult.data.body))
    }

    res.writeHead(200, {'Content-Type': 'application/json;charset=UTF-8'})
    res.write('')
    res.end()
})

async function createComment(reqBody: any, comment: string) {
    const repositoryName = reqBody.repository.name
    const orgName = reqBody.organization.login
    const pullRequestNumber = reqBody.pull_request.number
    const kit = await ghApp.getInstallationOctokit(28771873)
    const commentResult = await kit.rest.issues.createComment({
        owner: orgName,
        repo: repositoryName,
        issue_number: pullRequestNumber,
        body: comment
    })
    return commentResult
}
server.listen(port, () => {
    console.log("e2e listener is started");
});