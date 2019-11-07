import pg = require("pg");

// Methods in tables should interact directly with their database and the routers should handle higher level interactions
export class Table{
	pool: pg.Pool;
	tables: any;
	setupCommands: string[] = []

	constructor(client: pg.Pool, tables: any){
		this.pool = client;
		this.tables = tables;
	}

	async query(call: string | pg.QueryConfig, values?: any[]): Promise<any>{
		const client = await this.pool.connect();
		let res;
		if(typeof call === "string"){
			res = await client.query(call, values);
		}else{
			res = await client.query(call);
		}
		client.release();
		return res;
	}

	async runSetup(): Promise<boolean>{
		for(const commandIndex in this.setupCommands){
			const command: string = this.setupCommands[commandIndex];
			try{
				const res: any = await this.pool.query(command);
			}catch(e){
				console.log("Failed to run command: ",command);
				console.log("Error: ",e);
			}
		}
		return true;
	}
}