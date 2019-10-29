import pg = require("pg");


class dbWords{
	client: pg.Client;

	constructor(client: pg.Client){
		this.client = client;
	}
}