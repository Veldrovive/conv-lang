import router = require("./router");
import db = require("../db");

export class PhraseRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/phrases");
		this.routes = {
			"/": {func: this.mainRoute, method: "get"},
			"/add": {func: this.add, method: "post"}
		}
		this.setupRoutes();
	}

	mainRoute(req: any, res: any){
		res.send("Phrase Route");
	}

	add(req: any, res: any){
		res.send({res: req.body});
		const {gIdToken, words} = req.body; // gIdToken should be the user google id token and words should be an array of objects with a lang code and text

		console.log("Id Token:",gIdToken);
		console.log("Phrase:",words);
	}
}
