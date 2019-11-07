import pg = require("pg");
import t = require("./table");

enum SearchMethod {
	phonetic,
	levenshtein
}

interface Phrase {
    phrase_id: string;
    conv_start_votes: number;
    conv_start_flags: number;
    translations: {lang: string, text: string}[];
    children: {childId: string, votes: number, flags: number}[],
    parents: {parentId: string, votes: number, flags: number}[]
}

export class dbPhrases extends t.Table{
	constructor(client: pg.Pool, tables: any){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.phrases (
				phrase_id uuid PRIMARY KEY,
				conv_start_votes INTEGER DEFAULT 0,
				conv_start_flags INTEGER DEFAULT 0
			);`,
		]
	}

	async add(): Promise<string>{
		// Creates a new empty phrase and returns the id
		const query = {
			text: "INSERT INTO lang.phrases(phrase_id) VALUES(uuid_generate_v4())"
		}
		const res = await this.query(query);
		return res;
	}

	async get(phraseId: string): Promise<Phrase>{
		const res = await this.query("SELECT * FROM lang.phrases WHERE phrase_id=$1", [phraseId]);
		if(res.rows.length < 1){
			// Then the phrase does not exist so we return a default
			return {phrase_id: "", conv_start_flags: -1, conv_start_votes: -1, translations: [], children: [], parents: []};
		}else{
			const translations = await (this.tables["phraseWords"] as dbPhraseWords).getTranslations(phraseId);
			const children = await (this.tables["phraseChildren"] as dbPhraseChildren).getChildren(phraseId);
			const parents = await (this.tables["phraseChildren"] as dbPhraseChildren).getParents(phraseId);
			return{
				phrase_id: phraseId, 
				conv_start_flags: res.rows[0].conv_start_flags, 
				conv_start_votes: res.rows[0].conv_start_votes, 
				translations: translations,
				children: children,
				parents: parents
			};
		}
	}

	async voteStart(phrase_id: string): Promise<boolean>{
		// Adds a vote to conv start and returns wherther it worked
		const query = {
			text: "UPDATE lang.phrases SET conv_start_votes = conv_start_votes + 1 WHERE phrase_id=$1",
			values: [phrase_id]
		}
		const res = await this.query(query);
		return res.rowCount > 0;
	}

	async flagStart(phrase_id: string): Promise<boolean>{
		// Adds a flag to conv start and returns wherther it worked
		const query = {
			text: "UPDATE lang.phrases SET conv_start_flags = conv_start_flags + 1 WHERE phrase_id=$1",
			values: [phrase_id]
		}
		const res = await this.query(query);
		return res.rowCount > 0;
	}
}

export class dbPhraseWords extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.phrase_words (
				phrase_id uuid REFERENCES lang.phrases (phrase_id),
				lang_code char(2) NOT NULL,
				words uuid [],
				word_string VARCHAR
			);`,
		]
	}

	async getTranslations(phraseId: string): Promise<{lang: string, text: string}[]>{
		const res = await this.query("SELECT lang_code, word_string FROM lang.phrase_words WHERE phrase_id=$1", [phraseId]);
		return res.rows.map((row: {lang_code: string, word_string: string}) => {
			return {lang: row.lang_code, text: row.word_string};
		})
	}

	async setWords(phrase_id: string, string: string, lang: string, word_ids: string[]=[]): Promise<boolean>{
		// Sets the word list for a given phrase_id
		string = string.toLowerCase();
		const resExists = await this.query("SELECT * FROM lang.phrase_words WHERE phrase_id=$1 AND lang_code=$2", [phrase_id, lang]);
		if(word_ids.length < 1){
			// Then we get the word ids from the word table
			for(const word of string.split(' ')){
				const wordRes = await this.query("SELECT word_id FROM lang.words WHERE value=$1 AND lang_code=$2", [word, lang])
				let wordId;
				if(wordRes.rows.length < 1){
					wordId = await this.tables["words"].add(word, lang);
				}else wordId = wordRes.rows[0].word_id;
				word_ids.push(wordId);
			}
		}
		let res;
		if(resExists.rows.length > 0){
			// Then the phrase already has text in this language so we will udpate it
			res = await this.query("UPDATE lang.phrase_words SET words=$1::uuid[], word_string=$2::VARCHAR WHERE phrase_id=$3 AND lang_code=$4 ", [word_ids, string, phrase_id, lang]);
		}else{
			// Then the phrase does not already exist in the langauge so we will add it
			res = await this.query("INSERT INTO lang.phrase_words(phrase_id, lang_code, words, word_string) VALUES($1, $2, $3, $4)", [phrase_id, lang, word_ids, string]);
		}
		return res.rowCount > 0;
	}

	async matchPhrase(search_string: string, limit: number=5, lang: string="%",): Promise<{similarity: number, lang: string, phrase: Phrase}[]>{
		search_string = search_string.toLowerCase();
		const query = {
			text: `SELECT phrase_id, lang_code, GREATEST(word_similarity(word_string, $2), word_similarity(dmetaphone(word_string), dmetaphone($2))) AS similarity FROM lang.phrase_words WHERE
					lang_code LIKE $1 AND
					(
						word_similarity(word_string, $2) > 0.5 OR
						word_similarity(dmetaphone(word_string), dmetaphone($2)) > 0.5
					)
					ORDER BY levenshtein(dmetaphone(word_string), dmetaphone($2)),
					levenshtein((word_string), $2)
					LIMIT $3;`,
			values: [lang, search_string, limit]
		}
		const res = await this.query(query);
		const phrases = [];
		for(const {phrase_id, similarity, lang_code} of res.rows){
			console.log(phrase_id);
			phrases.push({similarity: <number> similarity, lang: lang_code, phrase: <Phrase> await this.tables["phrases"].get(phrase_id)});
		}
		return phrases;
	}
}

export class dbPhraseChildren extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.phrase_children (
				phrase_id uuid NOT NULL REFERENCES lang.phrases (phrase_id),
				phrase_child_id uuid NOT NULL REFERENCES lang.phrases (phrase_id),
				votes INTEGER DEFAULT 0,
				flags INTEGER DEFAULT 0
			);`,
		]
	}

	async getChildren(phraseId: string): Promise<{childId: string, votes: number, flags: number}[]>{
		// Gets an array of phrase ids cooresponding to the phrase's children
		const res = await this.query("SELECT phrase_child_id, votes, flags FROM lang.phrase_children WHERE phrase_id=$1", [phraseId]);
		return res.rows.map((row: {phrase_child_id: string, votes: number, flags: number}) => {
			return {childId: row.phrase_child_id, votes: row.votes, flags: row.flags}
		});
	}

	async getParents(childId: string): Promise<{parentId: string, votes: number, flags: number}[]>{
		// Gets an array of phrase ids cooresponding to the phrase's parents
		const res = await this.query("SELECT phrase_id, votes, flags FROM lang.phrase_children WHERE phrase_child_id=$1", [childId]);
		return res.rows.map((row: {phrase_id: string, votes: number, flags: number}) => {
			return {parentId: row.phrase_id, votes: row.votes, flags: row.flags}
		});
	}

	async add(phraseId: string, childId: string): Promise<boolean>{
		// Adds the child with default values. Returns success
		const res = await this.query("INSERT INTO lang.phrase_children(phrase_id, phrase_child_id) VALUES($1, $2)", [phraseId, childId]);
		return res.rowCount > 0;
	}

	async remove(phraseId: string, childId: string): Promise<boolean>{
		// Removes the cooresponding child
		const res = await this.query("DELETE FROM lang.phrase_children WHERE phrase_id=$1 AND phrase_child_id=$2", [phraseId, childId]);
		return res.rowCount > 0;
	}

	async vote(phraseId: string, childId: string): Promise<boolean>{
		// Increments upvotes by one
		const res = await this.query("UPDATE lang.phrase_children SET votes = votes+1, flags = flags+1 WHERE phrase_id=$1 AND phrase_child_id=$2", [phraseId, childId]);
		return res.rowCount > 0;
	}

	async flag(phraseId: string, childId: string): Promise<boolean>{
		// Increments downvotes by one
		const res = await this.query("UPDATE lang.phrase_children SET votes = votes+1, flags = flags+1 WHERE phrase_id=$1 AND phrase_child_id=$2", [phraseId, childId]);
		return res.rowCount > 0;
	}
}