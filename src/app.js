import express, { json } from "express";
import cors from "cors";

import * as database from "./database.js";
import { validateUser, validateTweet } from "./validation.js";

function handleError(err, res) {
    if (err.name === "ValidationError") {
        const messages = err.details.map(detail => detail.message);
        return res.status(422).send(messages);
    } else if (err.message === "Not found") {
        res.sendStatus(404);
    } else {
        console.error(err);
        res.sendStatus(500);
    }
}

let loggedUsers = [];

const port = process.env.PORT;
const app = express();
app.use(json());
app.use(cors());

app.post("/sign-up", async (req, res) => {
    const user = req.body;

    try {
        validateUser(user);
        await database.registerUser(user);
        loggedUsers.push(user.username);
        res.sendStatus(201);
    } catch (err) {
        handleError(err, res);
    }
});

app.post("/tweets", async (req, res) => {
    const tweet = req.body;

    try {
        if (!loggedUsers.includes(tweet.username)) {
            return res.sendStatus(401);
        }
        
        validateTweet(tweet);
        await database.postTweet(tweet);
        res.sendStatus(201);
    } catch (err) {
        handleError(err, res);
    }
})

app.get("/tweets", async (req, res) => {
    try {
        const tweets = await database.getTweets();
        res.send(tweets);
    } catch (err) {
        handleError(err, res);
    }
});

app.put("/tweets/:id", async (req, res) => {
    const { id } = req.params;
    const newTweet = req.body;

    try {
        validateTweet(newTweet);
        await database.editTweet(id, newTweet);
        res.sendStatus(204);
    } catch (err) {
        handleError(err, res);
    }
})

app.delete("/tweets/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await database.deleteTweet(id);
        res.sendStatus(204);
    } catch (err) {
        handleError(err, res);
    }
})

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})
