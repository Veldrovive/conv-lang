import router = require("./router");
import db = require("../db");
import r = require("../res");

export class UsersRouter extends router.dbRouter{
	constructor(db: db.db){
		super(db, "/users");
		this.routes = {
			"/": {func: this.mainRoute, method: "get"},
			"/add/:gIdToken/:fullName?": {func: this.addUser, method: "get"},
			"/remove/:gIdToken": {func: this.removeUser, method: "get"}
		}
		this.setupRoutes();
	}

	mainRoute(req: any, res: any){
		res.send("Users Route");
	}

	async addUser(req: any, res: any): Promise<boolean>{
		const {gIdToken, fullName} = req.params;
		try{
			const dbRes: boolean = await this.tables["users"].add(gIdToken, fullName);
			res.send(new r.apiRes("success", dbRes));
			return true;
		}catch(e){
			res.send(new r.apiRes("error", "Failed to add user"));
			return false;
		}
	}

	async removeUser(req: any, res: any): Promise<boolean>{
		const {gIdToken} = req.params;
		try{
			const dbRes: boolean = await this.tables["users"].remove(gIdToken);
			res.send(new r.apiRes("success", dbRes));
			return dbRes;
		}catch(e){
			res.send(new r.apiRes("error", e));
			return false;
		}
	}
}
