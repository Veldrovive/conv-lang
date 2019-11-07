import pg = require("pg");
import t = require("./table");

export class dbUsers extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.users (
				google_token VARCHAR PRIMARY KEY,
				full_name VARCHAR
			);`,
		]
	}

	async add(gIdToken: string, fullName?: string): Promise<boolean>{
		if(gIdToken.length < 1){
			return false;
		}
		const existsCheck = await this.query("SELECT * FROM lang.users WHERE google_token=$1", [gIdToken]);
		if(existsCheck.rows.length > 0) return false;
		const res = await this.query("INSERT INTO lang.users(google_token, full_name) VALUES($1, $2);", [gIdToken, fullName]);
		return true;
	}

	async remove(gIdToken: string): Promise<boolean>{
		if(gIdToken.length < 1){
			return false;
		}
		const res = await this.query("DELETE FROM lang.users WHERE google_token=$1", [gIdToken]);
		return res.rowCount > 0;
	}

	async getById(): Promise<object>{return {}}
	async getByName(): Promise<object[]>{return []}
}

export class dbUserWords extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.user_words (
				google_token VARCHAR NOT NULL REFERENCES lang.users (google_token),
				word_id uuid NOT NULL REFERENCES lang.words (word_id),
				difficulty REAL NOT NULL DEFAULT 0,
				importance REAL NOT NULL DEFAULT 0,
				add_time timestamp NOT NULL DEFAULT NOW(),
				CONSTRAINT normalized_difficulty CHECK (difficulty >= 0 AND difficulty <= 1),
				CONSTRAINT normalized_importance CHECK (importance >= 0 AND importance <= 1),
				CONSTRAINT doubled_user_word UNIQUE (google_token, word_id)
			);`,
		]
	}

	async add(gIdToken: string, wordId: string, difficulty: number=0, importance: number=0): Promise<boolean>{
		const existCheck = await this.query("SELECT * FROM lang.user_words WHERE google_token=$1 AND word_id=$2", [gIdToken, wordId]);
		if(existCheck.rows.length > 0) return true;
		const res = await this.query("INSERT INTO lang.user_words(google_token, word_id, difficulty, importance) VALUES($1, $2, $3, $4)", [gIdToken, wordId, difficulty, importance]);
		return res.rowCount > 0;
	}

	async remove(gIdToken: string, wordId: string): Promise<boolean>{
		const res = await this.query("DELETE FROM lang.user_words WHERE google_token=$1 AND word_id=$2", [gIdToken, wordId]);
		return res.rowCount > 0;
	}

	async setDifficulty(gIdToken: string, wordId: string, difficulty: number=0): Promise<boolean>{
		const res = await this.query("UPDATE lang.user_words SET difficulty=$1 WHERE google_token=$2 AND word_id=$3", [difficulty, gIdToken, wordId]);
		return res.rowCount > 0;
	}

	async setImportance(gIdToken: string, wordId: string, importance: number=0): Promise<boolean>{
		const res = await this.query("UPDATE lang.user_words SET importance=$1 WHERE google_token=$2 AND word_id=$3", [importance, gIdToken, wordId]);
		return res.rowCount > 0;
	}

	async get(gIdToken: string, wordId: string): Promise<{importance: number, difficulty: number, timestamp: Date}>{
		const res = await this.query("SELECT importance, difficulty, add_time FROM lang.user_words WHERE google_token=$1 AND word_id=$2", [gIdToken, wordId]);
		if(res.rows.length < 1) return {importance: -1, difficulty: -1, timestamp: new Date()};
		const {importance, difficulty, add_time} = res.rows[0];
		return {importance: importance, difficulty: difficulty, timestamp: add_time};
	}

	async getVocab(gIdToken: string): Promise<{wordId: string, difficulty: number, importance: number, timestamp: Date}[]>{
		const res = await this.query("SELECT word_id, difficulty, importance, add_time FROM lang.user_words WHERE google_token=$1", [gIdToken]);
		return res.rows.map((row: any) => {
			const {word_id, difficulty, importance, add_time} = row;
			return {wordId: word_id, difficulty: difficulty, importance: importance, timestamp: add_time};
		})
	}
}

export class dbUserPhrases extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.user_phrases (
				google_token VARCHAR REFERENCES lang.users (google_token),
				phrase_id uuid NOT NULL REFERENCES lang.phrases (phrase_id),
				difficulty REAL NOT NULL DEFAULT 0,
				importance REAL NOT NULL DEFAULT 0,
				add_time timestamp NOT NULL DEFAULT NOW(),
				CONSTRAINT normalized_difficulty CHECK (difficulty >= 0 AND difficulty <= 1),
				CONSTRAINT normalized_importance CHECK (importance >= 0 AND importance <= 1),
				CONSTRAINT doubled_user_phrase UNIQUE (google_token, phrase_id)
			);`,
		]
	}

	async add(gIdToken: string, phraseId: string, difficulty: number=0, importance: number=0): Promise<boolean>{
		const existCheck = await this.query("SELECT * FROM lang.user_phrases WHERE google_token=$1 AND phrase_id=$2", [gIdToken, phraseId]);
		if(existCheck.rows.length > 0) return true;
		const res = await this.query("INSERT INTO lang.user_phrases(google_token, phrase_id, difficulty, importance) VALUES($1, $2, $3, $4)", [gIdToken, phraseId, difficulty, importance]);
		const phrase = await this.query("SELECT words FROM lang.phrase_words WHERE phrase_id=$1", [phraseId]);
		for(const word of Object.values(phrase.rows[0].words)){
			this.tables["userWords"].add(gIdToken, word)
		}
		return res.rowCount > 0;
	}

	async remove(gIdToken: string, phraseId: string): Promise<boolean>{
		const res = await this.query("DELETE FROM lang.user_phrases WHERE google_token=$1 AND phrase_id=$2", [gIdToken, phraseId]);
		return res.rowCount > 0;
	}

	async setDifficulty(gIdToken: string, phraseId: string, difficulty: number=0): Promise<boolean>{
		const res = await this.query("UPDATE lang.user_phrases SET difficulty=$1 WHERE google_token=$2 AND phrase_id=$3", [difficulty, gIdToken, phraseId]);
		return res.rowCount > 0;
	}

	async setImportance(gIdToken: string, phraseId: string, importance: number=0): Promise<boolean>{
		const res = await this.query("UPDATE lang.user_phrases SET importance=$1 WHERE google_token=$2 AND phrase_id=$3", [importance, gIdToken, phraseId]);
		return res.rowCount > 0;
	}

	async get(gIdToken: string, phraseId: string): Promise<{importance: number, difficulty: number, timestamp: Date}>{
		const res = await this.query("SELECT importance, difficulty, add_time FROM lang.user_phrases WHERE google_token=$1 AND phrase_id=$2", [gIdToken, phraseId]);
		if(res.rows.length < 1) throw {routine: "User does not exist", code: 400};
		const {importance, difficulty, add_time} = res.rows[0];
		return {importance: importance, difficulty: difficulty, timestamp: add_time};
	}

	async getPhraseList(gIdToken: string): Promise<{wordId: string, difficulty: number, importance: number, timestamp: Date}[]>{
		const res = await this.query("SELECT phrase_id, difficulty, importance, add_time FROM lang.user_phrases WHERE google_token=$1", [gIdToken]);
		return res.rows.map((row: any) => {
			const {phrase_id, difficulty, importance, add_time} = row;
			return {wordId: phrase_id, difficulty: difficulty, importance: importance, timestamp: add_time};
		})
	}
}

export class dbWordPractice extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.user_word_practice (
				google_token VARCHAR NOT NULL REFERENCES lang.users (google_token),
				word_id uuid NOT NULL REFERENCES lang.words (word_id),
				time timestamp NOT NULL DEFAULT NOW(),
				score REAL NOT NULL DEFAULT 0,
				CONSTRAINT normalized_score CHECK (score >= 0 AND score <= 1)
			);`,
		]
	}

	async add(gIdToken: string, wordId: string, score: number): Promise<boolean>{
		const res = await this.query("INSERT INTO lang.user_word_practice(google_token, word_id, score) VALUES($1, $2, $3)", [gIdToken, wordId, score]);
		return res.rowCount > 0;
	}

	async get(gIdToken: string, wordId: string): Promise<{score: number, timestamp: Date}>{
		const res = await this.query("SELECT score, time FROM lang.user_word_practice WHERE google_token=$1 AND word_id=$2 ORDER BY time DESC;", [gIdToken, wordId]);
		return res.rows.map((row: any) => {
			const {score, time}: {score: number, time: Date} = row;
			return {score: score, timestamp: time};
		})
	}
}

export class dbPhrasePractice extends t.Table{
	constructor(client: pg.Pool, tables: object){
		super(client, tables);
		this.setupCommands = [
			`CREATE TABLE IF NOT EXISTS lang.user_phrase_practice (
				google_token VARCHAR REFERENCES lang.users (google_token),
				phrase_id uuid NOT NULL REFERENCES lang.phrases (phrase_id),
				time timestamp NOT NULL DEFAULT NOW(),
				score REAL NOT NULL DEFAULT 0,
				CONSTRAINT normalized_score CHECK (score >= 0 AND score <= 1)
			);`,
		]
	}

	async add(gIdToken: string, phraseId: string, score: number): Promise<boolean>{
		const res = await this.query("INSERT INTO lang.user_phrase_practice(google_token, phrase_id, score) VALUES($1, $2, $3)", [gIdToken, phraseId, score]);
		return res.rowCount > 0;
	}

	async get(gIdToken: string, phraseId: string): Promise<{score: number, timestamp: Date}>{
		const res = await this.query("SELECT score, time FROM lang.user_phrase_practice WHERE google_token=$1 AND phrase_id=$2 ORDER BY time DESC;", [gIdToken, phraseId]);
		return res.rows.map((row: any) => {
			const {score, time}: {score: number, time: Date} = row;
			return {score: score, timestamp: time};
		})
	}
}