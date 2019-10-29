// Used on Client and Server to facilitate interaction
export class Word{
	value: string;
	id: string;
	importance: number;
	difficulty: number;

	constructor(value: string, id: string = "", importance?: number, difficulty?: number){
		this.value = value;
		this.id = id;
		this.importance = importance ? importance : 0.5;
		this.difficulty = difficulty ? difficulty : 0.5;
	}

	setImportance(importance: number): void{
		this.importance = importance;
	}

	setDifficulty(difficulty: number): void{
		this.difficulty = difficulty;
	}

	static default(): Word{
		return Word.default();
	}

	static isDefault(word: Word): boolean{
		return word.value === "" && word.id === "";
	}

	static fromJSON(wordObj: object | string): Word{
		if(typeof wordObj === "string"){
			try{
				wordObj = JSON.parse(wordObj);
			}catch(e){
				return Word.default();
			}
		}
		let {value, id, importance, difficulty} = wordObj as any;
		const word: Word = new Word(value, id, importance, difficulty);
		return word;
	}

	toJSON(): Object{
		let {value, id, importance, difficulty} = this;
		return{value, id, importance, difficulty};
	}
}

// Used on client side to store the user's vocab
export class Vocabulary{
	wordList: Word[];

	constructor(vocab: Word[]){
		this.wordList = [];
		this.wordList.push(...vocab);
	}

	wordExists(value: string): boolean{
		return this.wordList.some((word: Word) => word.value === value);
	}

	addWordByValue(value: string, importance?: number, difficulty?: number): boolean{ // These functions return true if the word already existed in the database
		return true;
	}

	addWordById(id: string, importance?: number, difficulty?: number): boolean{
		return true;
	}

	// API connection
	private async getWordByValue(value: string):Promise<Word>{ // These functions return their associated word if they succeed or the default word otherwise
		return Word.default();
	}

	private async  getWordById(id: string):Promise<Word>{
		return Word.default();
	}

	private async pushNewWord(value: string, importance?: number, difficulty?: number):Promise<string | boolean>{ // If this succeeds, the id of the new word is returned. Otherwise false is returned
		return false;
	}
}