import router = require("./router");
import db = require("../db");
import r = require("../res");

export class VocabRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/vocab");
		this.routes = {
			"/": {func: this.mainRoute, method: "get"},
			"/add/:word/:lang/:transId?": {func: this.add, method: "get"},
			"/remove/:wordId": {func: this.remove, method: "get"},
			"/get/value/:value": {func: this.getByValue, method: "get"},
			"/get/id/:wordId": {func: this.getById, method: "get"} ,
			"/get/sentence": {func: this.getBySentence, method: "post"}
		}
		this.setupRoutes();
	}

	async mainRoute(req: any, res: any){
		res.send("Vocab Route");
	}

	async add(req: any, res: any){
		let {word, lang, transId} = req.params;
		word = word.toLowerCase();
		try{
			const dbRes: string = await this.tables["words"].add(word, lang, transId);
			res.send(new r.apiRes("success", dbRes));
			return true;
		}catch(e){
			res.send(new r.apiRes("error", e, 500));
			return false;
		}
	}

	async remove(req: any, res: any){
		const {wordId} = req.params;
		try{
			const dbRes: boolean = await this.tables["words"].remove(wordId);
			res.send(new r.apiRes("success", dbRes));
			return true;
		}catch(e){
			res.send(new r.apiRes("error", e, 500));
			return false;
		}
	}

	async getByValue(req: any, res: any){
		let {value} = req.params;
		value = value.toLowerCase();
		try{
			const dbRes: any[] = await this.tables["words"].getByValue(value);
			res.send(new r.apiRes("success", dbRes));
			return true;
		}catch(e){
			res.send(new r.apiRes("error", e, 500));
			return false;
		}
	}

	async getById(req: any, res: any){
		const {wordId} = req.params;
		try{
			const dbRes: any[] = await this.tables["words"].getById(wordId);
			res.send(new r.apiRes("success", dbRes));
			return true;
		}catch(e){
			res.send(new r.apiRes("error", e, 500));
			return false;
		}
	}

	async getBySentence(req: any, res: any){
		const {sentence, lang} = req.body;
		if(sentence === undefined || lang === undefined) return res.send(new r.apiRes("error", "Language and Sentence must be satisfied"));
		const words: string[] = sentence.split(" ");
		const wordIds: string[] = [];
		for(const word of words){
			const dbRes: any[] = await this.tables["words"].getByValue(word, lang);
			if(dbRes.length > 0){
				// Then the word is already in the database
				wordIds.push(dbRes[0].wordId);
			}else{
				// Then we need to add the word to the database
			}
		}
	}
}
