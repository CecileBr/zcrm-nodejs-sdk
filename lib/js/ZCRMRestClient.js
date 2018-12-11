const API = require('./crmapi');
module.exports = {
  initialize,
  generateAuthTokens,
  generateAuthTokenfromRefreshToken,
  getConfig,
  getConfig_refresh,
	getParam,
  API,
  parseAndConstructObject
};

const OAuth = require('./OAuth');
const tokenStorage = require('./tokenstorage/tokenstorage');

const PropertiesReader = require('properties-reader');

const configParams = {
  'client_id':'',
  'client_secret':'',
  'redirect_url':'',
  'user_identifier':'zcrm_default_user',
  'iamurl':'accounts.zoho.com',
  'baseURL':'www.zohoapis.com',
}

function initialize (){
  return new Promise((resolve,reject) =>{
    let properties = PropertiesReader('resources/oauth_configuration.properties');
    let id = properties.get('zoho.crm.clientid'),
      secret = properties.get('zoho.crm.clientsecret'),
      redirectUrl = properties.get('zoho.crm.redirecturl');

    if (!id || !secret || !redirectUrl){
      reject("Populate the oauth_configuration.properties file");
    }
    configParams.client_id = id;
    configParams.client_secret = secret;
    configParams.redirect_url = redirectUrl;
    
    let config_properties = PropertiesReader('resources/configuration.properties');
    baseURL = config_properties.get('crm.api.url')?config_properties.get('crm.api.url'):baseURL;

    if (config_properties.get('crm.api.user_identifier')){
      configParams.user_identifier = config_properties.get('crm.api.user_identifier');
    }

    resolve();
  })
}

function generateAuthTokens (user_identifier,grant_token){
  return new Promise((resolve,reject) =>{
    if (!user_identifier){
      user_identifier = configParams.user_identifier;
    }

    let config = getConfig(grant_token);
    new OAuth(config,"generate_token");
    let api_url = OAuth.constructurl("generate_token");

    OAuth.generateTokens(api_url).then(res =>{
      if (res.statusCode != 200){
        reject("Problem occured while generating access token from grant token. Response : "+JSON.stringify(response));
      }

      let result_obj = parseAndConstructObject(res);
      result_obj.user_identifier = user_identifier;
      
      if (result_obj.access_token){
        tokenStorage.updateOAuthTokens(result_obj).then(() =>{
          configParams.user_identifier = user_identifier;
          resolve(result_obj);
        })
      }
      else{
        reject("Problem occured while generating access token and refresh token from grant token.Response : "+JSON.stringify(response));
      }
    })
  })
}


function generateAuthTokenfromRefreshToken(user_identifier,refresh_token){
  return new Promise((resolve,reject) => {
    if(!user_identifier){
      user_identifier = configParams.user_identifier;
    }

		let config = getConfig_refresh(refresh_token);
		new OAuth(config,"refresh_access_token");
		let api_url = OAuth.constructurl("generate_token");

		OAuth.generateTokens(api_url).then(newToken => {	
			if(newToken.statusCode!=200){
				reject("Problem occured while generating access token from refresh token . Response : "+JSON.stringify(newToken));
			}

			let result_obj = parseAndConstructObject(newToken);
			result_obj.user_identifier = user_identifier;
			result_obj.refresh_token = refresh_token;

				if (result_obj.access_token){
					tokenStorage.updateOAuthTokens(result_obj).then(() => {
            configParams.user_identifier = user_identifier;
						resolve(result_obj);
					});
				}
				else{
					reject("Problem occured while generating access token from refresh token. Response : "+JSON.stringify(newToken));
				}
		})
	})
};


function getConfig(grant_token){
	let config = {
		client_id:configParams.client_id,
		client_secret:configParams.client_secret,
		code:grant_token,
		redirect_uri:configParams.redirect_url,
		grant_type:'authorization_code'
	};
	return config;
};

function getConfig_refresh(refresh_token){
  let config = {
		client_id:configParams.client_id,
		client_secret:configParams.client_secret,
		refresh_token:refresh_token,
		grant_type:'refresh_token'
	};
  return config;
}

function getParam(param){
  return configParams[param];
}

function parseAndConstructObject(response){
	let body = JSON.parse(response['body']);
	let current_time = Date.now();
	let resultObj = {};
	
	if (body.access_token){
		resultObj.access_token = body.access_token;
		if (body.refresh_token){
			resultObj.refresh_token = body.refresh_token;
		}
		resultObj.expires_in = body.expires_in+current_time;
	}
	return resultObj;
}