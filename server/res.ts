export class apiRes{ // This uses the Jsend specification... https://github.com/omniti-labs/jsend
	statusMap: string[] = ["success", "fail", "error"];
	status: string = "";
	data: any = {};
	message: string = "";
	code: number = -1;

	constructor(status: string | number, data: any, code: number=0){
		//console.log("Status:",status,"\nData:",data,"\nCode:",code);
		if((typeof status === "string" && !this.statusMap.includes(status)) || (typeof status === "number" && (status > 2 || status < 0))){
			this.status = this.statusMap[2];
			this.message = "Status does not exist";
			this.code = 501;
			return;
		}
		this.status = typeof status === "string" ? status : this.statusMap[status];
		if(this.status === this.statusMap[2]){
			this.data = null;
			this.message = data;
			this.code = code;
		}else{
			this.data = data;
		}
	}

	checkFields(): boolean{
		if(!this.statusMap.includes(this.status)) return false;
		if(this.status === this.statusMap[0] || this.status === this.statusMap[1]){
			if(!this.data) return false;
			if(this.message.length > 0) return false;
			if(this.code > -1) return false;
			return true;
		}
		if(this.status = this.statusMap[2]){
			if(this.message.length < 1) return false;
			if(this.code < 0) return false;
			return true;
		}
		return false;
	}

	toJSON(): object{
		const template: object = {
			status: this.status,
			data: typeof this.data === "object" || this.data === null ? this.data : {res: this.data},
			message: this.status === this.statusMap[2] ? this.message : undefined,
			code: this.status === this.statusMap[2] ? this.code : undefined
		}
		if(!this.checkFields()) console.log("Response is malformed: ",template);
		return template;
	}
}