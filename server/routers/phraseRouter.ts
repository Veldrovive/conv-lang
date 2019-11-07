import router = require("./router");
import r = require("../res");
import db = require("../db");
import dbPhrases = require("../db/dbPhrases");

export class PhraseRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/phrases");
		
		this.addPhrasesRoutes();
		this.addPhraseWordsRoutes();
		this.addPhraseChildrenRoutes();

		this.setupRoutes();
	}

	addPhrasesRoutes(): void{
		const phraseTable = this.tables["phrases"] as dbPhrases.dbPhrases;
		this.routes["/add"] = this.getBasicDbInter(phraseTable.add.bind(phraseTable)); // Works
		this.routes["/get/:phraseId"] = this.getBasicDbInter(phraseTable.get.bind(phraseTable)); // Works. May want to change it so that it errors if no phrase is found instead of returning a default
		this.routes["/voteStart/:phraseId"] = this.getBasicDbInter(phraseTable.voteStart.bind(phraseTable)); // Works
		this.routes["/flagStart/:phraseId"] = this.getBasicDbInter(phraseTable.flagStart.bind(phraseTable)); // Works
	}

	addPhraseWordsRoutes(): void{
		const phraseWordsTable = this.tables["phraseWords"] as dbPhrases.dbPhraseWords;
		this.routes["/words/translations/:phraseId"] = this.getBasicDbInter(phraseWordsTable.getTranslations.bind(phraseWordsTable)); // Might want to check for a valid uuid
		this.routes["/words/set/:phraseId/:lang"] = {func: this.setPhraseWords, method: "post"}; // Works 
		this.routes["/words/match"] = {func: this.matchPhrase, method: "post"}; // Works
	}

	async setPhraseWords(req: any, res: any): Promise<void>{
		const {phraseId, lang} = req.params;
		const {text} = req.body;
		if(text === undefined || text.length < 1 || typeof text !== "string") return res.send(new r.apiRes("error", "Text must be a string"));
		let dbRes: boolean = false;
		try{
			dbRes = await this.tables["phraseWords"].setWords(phraseId, text, lang);
		}catch(e){
			return res.send(new r.apiRes("error", e["routine"], e["code"]));
		}
		res.send(new r.apiRes("success", dbRes));
		return;
	}

	async matchPhrase(req: any, res: any): Promise<void>{
		const {text, lang, limit} = req.body;
		if(text === undefined || typeof text !== "string" || text.length < 1) return res.send(new r.apiRes("error", "Text must be a string", 400));
		if(limit < 0) return res.send(new r.apiRes("error", "Limit must be greater than or equal to zero", 400));
		let dbRes: boolean = false;
		try{
			dbRes = await this.tables["phraseWords"].matchPhrase(text, lang, limit);
		}catch(e){
			return res.send(new r.apiRes("error", e["routine"], e["code"]));
		}
		res.send(new r.apiRes("success", dbRes));
		return;
	}

	addPhraseChildrenRoutes(): void{
		const phraseChildrenTable = this.tables["phraseChildren"] as dbPhrases.dbPhraseChildren;
		this.routes["/parents/get/:phraseId"] = this.getBasicDbInter(phraseChildrenTable.getParents.bind(phraseChildrenTable));
		this.routes["/children/get/:phraseId"] = this.getBasicDbInter(phraseChildrenTable.getChildren.bind(phraseChildrenTable));
		this.routes["/children/add/:phraseId/:childId"] = this.getBasicDbInter(phraseChildrenTable.add.bind(phraseChildrenTable));
		this.routes["/children/remove/:phraseId/:childId"] = this.getBasicDbInter(phraseChildrenTable.remove.bind(phraseChildrenTable));
		this.routes["/children/vote/:phraseId/:childId"] = this.getBasicDbInter(phraseChildrenTable.vote.bind(phraseChildrenTable));
		this.routes["/children/flag/:phraseId/:childId"] = this.getBasicDbInter(phraseChildrenTable.flag.bind(phraseChildrenTable));
	}
}
