import express = require("express");
import db = require("../db");

export class dbRouter{
	db: db.db;
	tables: any;
	baseRoute: string; // The base URL of this route
	router: express.Router = express.Router();
	routes: object = {};

	constructor(db: db.db, route: string){
		this.db = db;
		this.tables = db.tables;
		this.baseRoute = route;
		if(this.baseRoute.charAt(0) !== "/"){
			this.baseRoute = "/"+this.baseRoute;
		}
	}

	setupRoutes(){
		for(let [route, {func, method}] of Object.entries(this.routes)){
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
}