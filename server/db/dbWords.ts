import pg = require("pg");
import t = require("./table");

interface Word {
    word_id: string;
    trans_id: string;
    value: string;
    lang_code: string;
}

export class dbWords extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.words (
				word_id uuid PRIMARY KEY,
				trans_id uuid,
				value varchar NOT NULL,
				lang_code char(2) NOT NULL
			);`,
		]
	}

	async add(word: string, lang: string, transId?: string): Promise<string>{
		// Adds the word to the database if it does not exist and then return the ID
		const existingWords: any[] = await this.getByValue(word, lang);
		if(existingWords.length > 0) return existingWords[0]["word_id"];
		const query = {
			text: "INSERT INTO lang.words(word_id, trans_id, value, lang_code) VALUES (uuid_generate_v4(), $1, $2, $3)",
			values: [transId, word, lang]
		}
		const res = await this.query(query);
		const newWord: any = (await this.getByValue(word, lang))[0];
		return newWord["word_id"];
	}

	async remove(wordId: string): Promise<boolean>{
		// Removes a word from the databse. Returns true if a word was removed and false otherwise
		const query = {
			text: "DELETE FROM lang.words WHERE word_id=$1",
			values: [wordId]
		}
		const res = await this.query(query);
		return res.rowCount > 1;
	}

	async getById(id: string): Promise<Word[]>{
		// Returns the word that cooresponds to the ID
		const query = {
			text: "SELECT * FROM lang.words WHERE word_id=$1",
			values: [id]
		}
		const res = await this.query(query);
		return res.rows;
	}

	async getByTransId(id: string, lang: string="%"): Promise<Word[]>{
		// Returns the words that coorespond to the translation array
		const query = {
			text: "SELECT * FROM lang.word WHERE trans_id=$1 AND lang_code LIKE $2",
			values: [id, lang]
		}
		const res = await this.query(query);
		return res.rows;
	}

	async getByValue(word: string, lang: string="%"): Promise<Word[]>{
		// Returns the words that coorespond the the value and given language if provided
		const query = {
			text: "SELECT * FROM lang.words WHERE value=$1 AND lang_code LIKE $2",
			values: [word, lang]
		}
		const res = await this.query(query);
		return res.rows;
	}
}