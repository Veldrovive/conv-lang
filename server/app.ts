import express = require('express');
import path = require('path');
import cors = require('cors');
import data = require("./db");
import vRoute = require("./routers/vocabRouter");
import pRoute = require("./routers/phraseRouter");
import uRoute = require("./routers/userRouter");
// Use http://lvh.me:3000/ to avoid having to create your own url

const corsOptions = {
	origin: 'https://adev.ngrok.io'
};

const app: express.Application = express();
app.use("/static", express.static(path.join(__dirname, "../client")));
app.use("/static", express.static(path.join(__dirname, "../lib")));

app.use(express.json()); 
app.use(cors(corsOptions));

const database: data.db = new data.db();

const vocabRoute = new vRoute.VocabRouter(database);
const phraseRoute = new pRoute.PhraseRouter(database);
const userRoute = new uRoute.UsersRouter(database);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../..", "client", "index.html"));
})

app.use(vocabRoute.baseRoute, vocabRoute.router);
app.use(phraseRoute.baseRoute, phraseRoute.router);
app.use(userRoute.baseRoute, userRoute.router);

const server = app.listen(process.env.PORT || 3000, () => {
	var address: any = server.address();
	if(address !== null){
		console.log("Listening on port:",address.port);
	}
})