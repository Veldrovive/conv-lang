import express = require("express");
import vocab = require("../lib/Vocab");

const router: express.Router = express.Router();

const testWord: vocab.Word = new vocab.Word("test", "testId");

router.get("/", (req, res) => {
	
})

router.get("/wordByVal/:value", (req, res) => {
	const value: string = req.params.value;
	res.send(value);
})

router.get("wordById/:id", (req, res) => {
	const id: string = req.params.id;
	res.send(id);
})

export default router;
