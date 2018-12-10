module.exports = {
  initialize,
  generateAuthTokens,
  generateAuthTokenfromRefreshToken,

};


const OAuth = require('./OAuth');
const tokenStorage = require('./tokenstorage/tokenstorage');
const API = require('./crmapi');

const PropertiesReader = require('properties-reader');

let client_id = null,
  client_secret = null,
  redirect_url = null,
  user_identifier = null,
  iamurl = 'accounts.zoho.com',
  baseURL = 'www.zohoapis.com',
  version = 'v2',
  default_user_identifier = 'zcrm_default_user';

function initialize (configJSON){
  return new Promise((resolve,reject) =>{
    let properties = PropertiesReader('resources/oauth_configuration.properties');
    let id = properties.get('zoho.crm.clientid'),
      secret = properties.get('zoho.crm.clientsecret'),
      redirectUrl = properties.get('zoho.crm.redirecturl');

    let iam_url =properties.get('zoho.crm.iamurl')?properties.get('zoho.crm.iamurl'):iamurl;
    
    let config_properties = PropertiesReader('resources/configuration.properties');
    baseURL = config_properties.get('crm.api.url')?config_properties.get('crm.api.url'):baseURL;

    if (config_properties.get('crm.api.user_identifier')){
      ZCRMRestClient.setUserIdentifier(config_properties.get('crm.api.user_identifier'));
    }
    else {
      ZCRMRestClient.setUserIdentifier(default_user_identifier);
    }

    if (!id || !secret || !redirectUrl){
      reject("Populate the oauth_configuration.properties file");
    }

    ZCRMRestClient.setClientId(id);
    ZCRMRestClient.setClientSecret(secret);
    ZCRMRestClient.setRedirectURL(redirectUrl);
    ZCRMRestClient.setIAMUrl(iam_url);
    
    resolve();
  })
}

function generateAuthTokens (user_identifier,grant_token){
  return new Promise((resolve,reject) =>{
    if (!user_identifier){
      user_identifier = getUserIdentifier();
    }

    let config = getConfig(grant_token);
    new OAuth(config,"generate_token");
    let api_url = OAuth.constructurl("generate_token");

    OAuth.generateTokens(api_url).then(res =>{
      if (response.statusCode != 200){
        reject("Problem occured while generating access token from grant token. Response : "+JSON.stringify(response));
      }

      let result_obj = parseAndConstructObject(response);
      result_obj.user_identifier = user_identifier;
      
      if (result_obj.access_token){
        tokenStorage.saveOAuthTokens(result_obj).then(() =>{
          ZCRMRestClient.setUserIdentifier(user_identifier),
          resolve(result_obj)
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
      user_identifier = ZCRMRestClient.getUserIdentifier();
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
					tokenStorage.saveOAuthTokens(resultObj).then(() => {
						ZCRMRestClient.setUserIdentifier(user_identifier);
						resolve(resultObj);
					});
				}
				else{
					reject("Problem occured while generating access token from refresh token. Response : "+JSON.stringify(newToken));
				}
		})
	})
};


ZCRMRestClient.getConfig = function(grant_token){

    var config = {};

    config.client_id = ZCRMRestClient.getClientId();
    config.client_secret = ZCRMRestClient.getClientSecret();
    config.code = grant_token;
    config.redirect_uri = ZCRMRestClient.getRedirectURL();
    config.grant_type = "authorization_code";

    return config;

};

ZCRMRestClient.getConfig_refresh = function(refresh_token){

        var config = {};

        config.client_id = ZCRMRestClient.getClientId();
        config.client_secret = ZCRMRestClient.getClientSecret(); 
        config.refresh_token = refresh_token;
        config.grant_type = "refresh_token";

        return config;

}

ZCRMRestClient.setClientId = function(clientid){

    client_id = clientid;
}

ZCRMRestClient.setClientSecret = function(clientsecret){

    client_secret = clientsecret;

}

ZCRMRestClient.setRedirectURL = function(redirecturl){

    redirect_url = redirecturl;
}

ZCRMRestClient.setUserIdentifier = function(useridentifier){

    user_identifier = useridentifier;

}

ZCRMRestClient.setIAMUrl = function(iam_url){

    iamurl = iam_url;
}

ZCRMRestClient.setBaseURL = function(baseurl){

    baseURL = baseurl;
}

ZCRMRestClient.getClientId = function(){

    return client_id;

}

ZCRMRestClient.getClientSecret = function(){

    return client_secret;

}

ZCRMRestClient.getRedirectURL = function(){

    return redirect_url;
}

ZCRMRestClient.getUserIdentifier = function(){

    if(!user_identifier){
        
        return default_user_identifier;
    }
    return user_identifier;
}

ZCRMRestClient.getMySQLModule = function(){

    return mysql_module;
}

ZCRMRestClient.getAPIURL = function(){

    return baseURL;
}
ZCRMRestClient.getIAMUrl = function(){

    return iamurl;
}
ZCRMRestClient.getMySQLUserName = function(){

    return mysql_username;
}
ZCRMRestClient.getMYSQLPassword = function(){

    return mysql_password;

}
ZCRMRestClient.parseAndConstructObject = function(response){

    var body = response["body"];
    body = JSON.parse(body);

    var date = new Date();
    var current_time = date.getTime();

    var resultObj = {};
    
    if(body.access_token){

        resultObj.access_token = body.access_token;

        if(body.refresh_token){

            resultObj.refresh_token = body.refresh_token;
        }

        resultObj.expires_in = body.expires_in+current_time;
    }
    return resultObj;

}