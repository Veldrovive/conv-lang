import express = require("express");
import db = require("../db");
import r = require("../res");


export class dbRouter{
	db: db.db;
	tables: any;
	baseRoute: string; // The base URL of this route
	router: express.Router = express.Router();
	routes: any = {
		"/": {func: this.mainRoute, method: "get"}
	};

	constructor(db: db.db, route: string){
		this.db = db;
		this.tables = db.tables;
		this.baseRoute = route;
		if(this.baseRoute.charAt(0) !== "/"){
			this.baseRoute = "/"+this.baseRoute;
		}
	}

	mainRoute(req: any, res: any){
		res.send(new r.apiRes("success", Object.keys(this.routes).map((row: string) => {
			return this.baseRoute+row;
		})));
	}

	setupRoutes(){
		for(let [route, {func, method}] of Object.entries(this.routes as object)){
			if(route.charAt(0) !== "/") route = "/"+route;
			if(method === "get"){
				this.router.get(route, func.bind(this));
			}else if(method === "post"){
				this.router.post(route, func.bind(this));
			}else{
				console.error(method,"method does not exist");
			}
		}
	}

	getBasicDbInter(func: Function): {func: Function, method: string}{
		async function resFunc(req: any, res: any){
			try{
				const dbRes: any = await func(...Object.values(req.params))
				res.send(new r.apiRes("success", dbRes));
				return true;
			}catch(e){
				try{
					res.send(new r.apiRes("error", e["routine"], e["code"]));
				}catch(err){
					res.send(new r.apiRes("error", e, 500));
				}
			}
		}
		return {func: resFunc, method: "get"}
	}
}