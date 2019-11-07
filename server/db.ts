import config = require("config");
import pg = require("pg");
import t = require("./db/table");
import words = require("./db/dbWords");
import phrases = require("./db/dbPhrases");
import users = require("./db/dbUsers");

export class db{
	client: pg.Pool;
	setupCommands: string[] = [
		'CREATE SCHEMA IF NOT EXISTS "lang";',
		'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA lang;',
		'CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch" WITH SCHEMA lang;',
		'CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA lang'
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
		this.addTable("phrasePractice", users.dbPhrasePractice);

		this.setup();
	}

	addTable(name: string, table: any): void{
		this.tables[name] = new table(this.client, this.tables);
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
		return true;
	}
}
