module.exports = {
	getOAuthTokens,
	updateOAuthTokens
};

const fs = require('fs');
const jsonFile = 'token.json';

function getOAuthTokens(){ 
  return new Promise((resolve,reject) =>{
		fs.readFile(jsonFile, 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(JSON.parse(data));
		});
	})
}

function updateOAuthTokens(config_obj){
	return new Promise((resolve,reject) =>{
		getOAuthTokens()
		.then(data => {
			data.accesstoken = config_obj.access_token;
			data.expirytime = config_obj.expires_in;
			let jsonToWrite = JSON.stringify(data);
			fs.writeFile(jsonFile, jsonToWrite, (err) => {
				if (err) reject(err);
				resolve();
			});
		})
	});
}

