import express = require('express');
import vocabRoute = require('./vocabRoutes');
import phraseRoute = require('./phraseRoutes');

const app: express.Application = express();

app.get("/", (req, res) => {
	res.send("Hello World");
})

app.use("/vocab", vocabRoute.default);
app.use("/phrase", phraseRoute.default);

app.listen(3000, () => {
	console.log("Listening on port 3000!");
})