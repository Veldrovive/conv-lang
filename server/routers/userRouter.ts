import router = require("./router");
import db = require("../db");
import r = require("../res");
import dbUsers = require("../db/dbUsers");

export class UsersRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/users");

		this.addBasicRoutes();
		this.addWordRoutes();
		this.addWordPracticeRoutes();
		this.addPhraseRoutes();
		this.addPhrasePracticeRoutes();

		this.setupRoutes();
	}

	// Basic Usage
	addBasicRoutes(): void{
		const basicTable = this.tables["users"] as dbUsers.dbUsers;
		this.routes["/add/:gIdToken/:fullName?"] = this.getBasicDbInter(basicTable.add.bind(basicTable));
		this.routes["/remove/:gIdToken"] = this.getBasicDbInter(basicTable.remove.bind(basicTable));
	}

	// User Words
	addWordRoutes(): void{
		const wordTable = this.tables["userWords"] as dbUsers.dbUserWords;
		this.routes["/words/add/:gIdToken/:wordId/:difficulty?/:importance?"] = this.getBasicDbInter(wordTable.add.bind(wordTable));
		this.routes["/words/setImportance/:gIdToken/:wordId/:importance"] = this.getBasicDbInter(wordTable.setImportance.bind(wordTable));
		this.routes["/words/setDifficulty/:gIdToken/:wordId/:difficulty"] = this.getBasicDbInter(wordTable.setDifficulty.bind(wordTable));
		this.routes["/words/get/:gIdToken/:wordId"] = this.getBasicDbInter(wordTable.get.bind(wordTable));
		this.routes["/words/getVocab/:gIdToken"] = this.getBasicDbInter(wordTable.getVocab.bind(wordTable));
	}

	// User Words Practice
	addWordPracticeRoutes(): void{
		const wordPracticeTable = this.tables["wordPractice"] as dbUsers.dbWordPractice;
		this.routes["/words/practice/add/:gIdToken/:wordId/:score"] = this.getBasicDbInter(wordPracticeTable.add.bind(wordPracticeTable));
		this.routes["/words/practice/get/:gIdToken/:wordId"] = this.getBasicDbInter(wordPracticeTable.get.bind(wordPracticeTable));
	}

	// User Phrases
	addPhraseRoutes(): void{
		const phraseTable = this.tables["userPhrases"] as dbUsers.dbUserPhrases;
		this.routes["/phrases/add/:gIdToken/:phraseId/:difficulty?/:importance?"] = this.getBasicDbInter(phraseTable.add.bind(phraseTable));
		this.routes["/phrases/setImportance/:gIdToken/:phraseId/:importance"] = this.getBasicDbInter(phraseTable.setImportance.bind(phraseTable));
		this.routes["/phrases/setDifficulty/:gIdToken/:phraseId/:difficulty"] = this.getBasicDbInter(phraseTable.setDifficulty.bind(phraseTable));
		this.routes["/phrases/get/:gIdToken/:phraseId"] = this.getBasicDbInter(phraseTable.get.bind(phraseTable));
		this.routes["/phrases/getList/:gIdToken"] = this.getBasicDbInter(phraseTable.getPhraseList.bind(phraseTable));
	}

	// User Phrase Practive
	addPhrasePracticeRoutes(): void{
		const phrasePracticeTable = this.tables["phrasePractice"] as dbUsers.dbPhrasePractice;
		this.routes["/phrases/practice/add/:gIdToken/:phraseId/:score"] = this.getBasicDbInter(phrasePracticeTable.add.bind(phrasePracticeTable));
		this.routes["/phrases/practice/get/:gIdToken/:phraseId"] = this.getBasicDbInter(phrasePracticeTable.get.bind(phrasePracticeTable));
	}
}
