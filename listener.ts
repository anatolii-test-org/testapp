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
const appId = process.env.APP_ID
const installationId = process.env.INSTALLATION_ID
const EVENTS = ['edited', 'reopened', 'opened']

let ghApp: App

if (pk && appId) {
    const appIdAsNumber = +(appId)
    ghApp = new App({appId: appIdAsNumber, privateKey: pk})
} else new Error("App Private key is not a string or APP_ID is not a number")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/ping', (req, res) => {
    res.status(200).send('pong')
})

app.post('/gh-webhook', async (req, res) => {
    const body = req.body
    const action = body.action
    console.log("action:" + action)
    console.log("action:" + action)
    console.log("action:" + body)

    const repositoryName = body.repository.name
    const orgName = body.organization.login

    // if (EVENTS.includes(body.action) && body.pull_request) {
    //     const pullRequestNumber = body.pull_request.number
    //     const branch = body.pull_request.head.ref
    //     console.log(action + "/" + orgName + "/" + repositoryName + "/" + pullRequestNumber + " " + branch)
    //     const url = process.env.RESULTS_URL + '/api/v1/task/update/queue/?repository_name=client&build_version=1.18378.0'
    //     const updRes = await axios.default.get(url, {headers: {"accept": "application/json"}})
    //
    //     const commentResult = await createComment(repositoryName, orgName, pullRequestNumber, `[${action}] [${repositoryName}] [${pullRequestNumber}] e2e tests triggered ${JSON.stringify(updRes.data)}`)
    //     console.log(JSON.stringify(commentResult.data.body))
    // }

    res.writeHead(200, {'Content-Type': 'application/json;charset=UTF-8'})
    res.write('')
    res.end()
})

app.post('/tc-webhook', async (req, res) => {
        console.log(req.body)
        const orgName = 'anatolii-test-org' //'Miroapp-dev'
        const repo = req.body.repo
        const buildNumber = req.body.build
        const pr = req.body.pr
        const testResult = req.body.testResult
        const testResultUrl = req.body.testResultUrl
        const testResultPercentage = req.body.testResultPercenatge
        const commentResult = await createComment(repo, orgName, pr, `Build number: ${buildNumber} e2e tests result: ${JSON.stringify(testResultUrl)}, percentage: ${testResultPercentage}`)
        console.log(JSON.stringify(commentResult.data.body))
        if (testResult == 'success') {
            const reviewRes = await approvePR(repo, orgName, pr)
            console.log(JSON.stringify(reviewRes))
        }
        res.writeHead(200, {'Content-Type': 'application/json;charset=UTF-8'})
        res.write('')
        res.end()
    }
)

async function createComment(repoName: string, orgName: string, prNumber: number, comment: string) {
    if (!installationId)
        throw new Error('Installation id is not presented')

    const kit = await ghApp.getInstallationOctokit(+installationId)
    const commentResult = await kit.rest.issues.createComment({
        owner: orgName,
        repo: repoName,
        issue_number: prNumber,
        body: comment
    })
    return commentResult
}

async function approvePR(repoName: string, orgName: string, prNumber: number) {
    if (!installationId)
        throw new Error('Installation id is not presented')

    const kit = await ghApp.getInstallationOctokit(+installationId)
    const approveRest = await kit.rest.pulls.createReview({
        repo: repoName,
        owner: orgName,
        pull_number: prNumber,
        event: "APPROVE"
    })
    return approveRest
}

server.listen(port, () => {
    console.log("e2e listener is started");
});