const qs = require('querystring');
const httpclient = require('request');

const actionvsurl = {
  generate_token:'/oauth/v2/token'
}

const mand_configurations = {
  generate_token : ['client_id','client_secret','redirect_uri','code','grant_type'],
  refresh_access_token : ['client_id','client_secret','grant_type','refresh_token']
}

let config = null;
const OAuth = (configuration,action) => {
  if (!configuration) throw new Error('Missing configuration for Zoho OAuth2 service');
  assertConfigAttributesAreSet(configuration, mand_configurations[action]);
  config = configuration;
};


function assertConfigAttributesAreSet(configuration, attributes) {
  attributes.forEach(attribute => {
    if (!configuration[attribute]) throw new Error('Missing configuration for Zoho OAuth service: '+ attribute);
  });
}

function constructurl(action){
	let crmclient = require('./ZCRMRestClient');
	let url = "https://"+crmclient.getParam('iamurl')+actionvsurl[action]+'?' + qs.stringify(config);
	return url;
}

function generateTokens(url){
	return new Promise(function(resolve,reject){
		httpclient.post(url,{},
			(err, response) => {
        if (err) reject(err);
        resolve(response);
    });
  })
}

module.exports  = {
	OAuth,
	constructurl,
	generateTokens
}