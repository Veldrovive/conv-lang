import router = require("./router");
import db = require("../db");
import r = require("../res");
import dbWords = require("../db/dbWords");

export class VocabRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/vocab");

		this.addWordRoutes();

		this.setupRoutes();
	}

	addWordRoutes(): void{
		const wordsTable = this.tables["words"] as dbWords.dbWords;
		this.routes["/add/:word/:lang/:transId?"] = this.getBasicDbInter(wordsTable.add.bind(wordsTable));
		this.routes["/remove/:wordId"] = this.getBasicDbInter(wordsTable.remove.bind(wordsTable));
		this.routes["/get/value/:value"] = this.getBasicDbInter(wordsTable.getByValue.bind(wordsTable));
		this.routes["/get/id/:wordId"] = this.getBasicDbInter(wordsTable.getById.bind(wordsTable));
	}
}
