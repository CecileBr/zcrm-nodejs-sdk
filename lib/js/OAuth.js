let config = null;
const qs = require('querystring');
const httpclient = require('request');

const mand_configurations = {
  generate_token : ['client_id','client_secret','redirect_uri','code','grant_type'],
  refresh_access_token : ['client_id','client_secret','grant_type','refresh_token']
}

const OAuth = function(configuration,action) {
  if (!configuration)
    throw new Error('Missing configuration for Zoho OAuth2 service');
    assertConfigAttributesAreSet(configuration, mand_configurations[action]);
    config = configuration;
};


function assertConfigAttributesAreSet(configuration, attributes) {
  attributes.forEach(attribute => {
    if (!configuration[attribute])
      throw new Error('Missing configuration for Zoho OAuth service: '+ attribute);
  });
}

function constructurl(iamurl){
  let url = "https://"+ iamurl + '/oauth/v2/token?' + qs.stringify(config);
  return url;
}

OAuth.generateTokens = function(iamurl){
  let url = constructurl(iamurl);
  return new Promise((resolve, reject) => {
    httpclient.post(url,{
    }, (err, res) =>{
        if(err) reject(err);
        resolve(res);
    });
  })
}

module.exports = OAuth;let config = null;
const qs = require('querystring');
const httpclient = require('request');

const mand_configurations = {
  generate_token : ['client_id','client_secret','redirect_uri','code','grant_type'],
  refresh_access_token : ['client_id','client_secret','grant_type','refresh_token']
}

const OAuth = function(configuration,action) {
  if (!configuration)
    throw new Error('Missing configuration for Zoho OAuth2 service');
    assertConfigAttributesAreSet(configuration, mand_configurations[action]);
    config = configuration;
};


function assertConfigAttributesAreSet(configuration, attributes) {
  attributes.forEach(attribute => {
    if (!configuration[attribute])
      throw new Error('Missing configuration for Zoho OAuth service: '+ attribute);
  });
}

function constructurl(iamurl){
  let url = "https://"+ iamurl + '/oauth/v2/token?' + qs.stringify(config);
  return url;
}

OAuth.generateTokens = function(iamurl){
  let url = constructurl(iamurl);
  return new Promise((resolve, reject) => {
    httpclient.post(url,{
    }, (err, res) =>{
        if(err) reject(err);
        resolve(res);
    });
  })
}

module.exports = OAuth;