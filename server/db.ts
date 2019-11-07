import config = require("config");
import pg = require("pg");
import t = require("./db/table");
import words = require("./db/dbWords");
import phrases = require("./db/dbPhrases");
import users = require("./db/dbUsers");

export class db{
	client: pg.Pool;
	setupCommands: string[] = [
		'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
		'CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";',
		'CREATE EXTENSION IF NOT EXISTS "pg_trgm"',
		'CREATE SCHEMA IF NOT EXISTS "lang";'
	]
	tables: any = {};

	constructor(){
		if(process.env.DATABASE_URL === undefined){
			const dbConfig: object = config.get('dbConfig');
			this.client = new pg.Pool(dbConfig);
		}else{	
			this.client = new pg.Pool({
			  connectionString: process.env.DATABASE_URL,
			  ssl: true,
			});
		}

		this.addTable("words", words.dbWords);
		this.addTable("phrases", phrases.dbPhrases);
		this.addTable("phraseWords", phrases.dbPhraseWords);
		this.addTable("phraseChildren", phrases.dbPhraseChildren);
		this.addTable("users", users.dbUsers);
		this.addTable("userWords", users.dbUserWords);
		this.addTable("userPhrases", users.dbUserPhrases);
		this.addTable("wordPractice", users.dbWordPractice);
		this.addTable("phrasePractive", users.dbPhrasePractice);

		this.setup();
	}

	addTable(name: string, table: any): void{
		this.tables[name] = new table(this.client, this.tables);
	}

	async runTests(): Promise<void>{
		// this.tables["phraseWords"].setWords('4655bd3d-c122-41f8-8496-df1d02213a2f', "je m'appelle aidan", 'fr');
		// console.log(await this.tables["phraseWords"].matchPhrase("His name is aidan"));
		// console.log(await this.tables["phrases"].get("4655bd3d-c122-41f8-8496-df1d02213a2f"))

		// const newId = await this.tables["phrases"].add()
		await (this.tables["phraseWords"] as phrases.dbPhraseWords).setWords('a462c94e-2803-4278-9ecc-f74fe3583f80', "Nice to meet you", 'en');
	}

	async setup(): Promise<boolean>{
		try{
			await this.client.connect();
			console.log("Connected to database");
		}catch(e){
			console.error("Could not connect to database: ", e);
			return false;
		}
		for(const commandIndex in this.setupCommands){
			const command: string = this.setupCommands[commandIndex];
			try{
				const res: any = await this.client.query(command);
			}catch(e){
				console.log("Failed to run command: ",command);
				console.log("Error: ",e);
			}
		}
		for(const table of Object.values(this.tables)){
			
			await (table as t.Table).runSetup();
		}
		this.runTests();
		return true;
	}
}
