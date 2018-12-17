module.exports = {
	getOAuthTokens,
	updateOAuthTokens
};

require('dotenv').config();

function getOAuthTokens(){ 
  return new Promise((resolve,reject) =>{
		let token = {
			useridentifier:process.env.TOKEN_USERIDENTIFIER,
			access_token:process.env.TOKEN_ACCESS,
			refresh_token:process.env.TOKEN_REFRESH,
			expirytime:process.env.TOKEN_EXPIRYTIME
		}
		resolve(token);
	})
}

function updateOAuthTokens(config_obj){
	return new Promise((resolve,reject) =>{
		process.env.TOKEN_ACCESS = config_obj.access_token;
		process.env.TOKEN_EXPIRYTIME = config_obj.expires_in;
		resolve();
	});
}