module.exports  = {
	promiseResponse : promiseResponse,
	constructRequestDetails : constructRequestDetails,
}

const httpclient = require('request');
const FormData = require('form-data');

function promiseResponse(request) {
	const crmclient = require('./ZCRMRestClient');
	const OAuth = require('./OAuth');
	const storage_module = require('./tokenstorage/tokenstorage');
	return new Promise((resolve,reject) => {
		storage_module.getOAuthTokens().then(tokens => {
			let current_time = Date.now();
			let expires_in = tokens.expirytime;

			if (current_time > expires_in) {
				let refresh_token = tokens.refreshtoken;
				let config = crmclient.getConfig_refresh(refresh_token);
				new OAuth(config,'refresh_access_token');
				let url = OAuth.constructurl('generate_token');

				OAuth.generateTokens(url).then(newToken => {
					let result_obj = crmclient.parseAndConstructObject(newToken);

					storage_module.updateOAuthTokens(result_obj).then(() =>{
						makeapicall(request, tokens).then(res =>{
								resolve(res);
						})
						.catch(err => {
							reject(err);
						})
					});
				})
			}
			else {
				makeapicall(request, tokens).then(res =>{
					resolve(res);
				})
				.catch(err => {
					reject(err);
				})
			}
		})
	})
}


function makeapicall(request, tokens){
	const crmclient = require('./ZCRMRestClient');

  return new Promise(function(resolve,reject){
		let access_token = tokens.accesstoken;
		let baseUrl = "https://"+crmclient.getAPIURL()+"/crm/v2/"+ request.url;
		if (request.params) {
			baseUrl = baseUrl + '?' + request.params;
		}
		let api_headers = {};
		let encoding ="utf8";
		let req_body = null;

		if (request.download_file){
				encoding = "binary";
		}

		let form_Data = null;
		if (request.x_file_content) {
			form_Data = new FormData();        
			form_Data.append('file', request.x_file_content);//No I18N           
			req_body = form_Data;            
			api_headers = form_Data.getHeaders();          
		}
		else {
			req_body = request.body || null;
		}
			
		if (request.headers) {
			let header_keys = Object.keys(request.headers);
			for(i in header_keys){
				api_headers[header_keys[i]] = request.headers[header_keys[i]];
			}
		}

		api_headers.Authorization = 'Zoho-oauthtoken '+access_token;
		api_headers["User-Agent"] = 'Zoho CRM Node SDK';
		httpclient({
			uri : baseUrl,
			method : request.type,
			headers : api_headers,
			body:req_body,
			encoding: encoding
		}, (error,response) =>{
			if (error) reject(error);

			if (response.statusCode == 204){
				var respObj = {
					"message" : "no data",
					"status_code" : "204"
				}
				resolve(JSON.stringify(respObj));
			}
			else {
				if (request.download_file){
					let filename;
					let disposition =response.headers["content-disposition"];//No I18N
					if (disposition && disposition.indexOf('attachment') !== -1) {
						let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
						let matches = filenameRegex.exec(disposition);
						if (matches != null && matches[1]) { 
							filename = matches[1].replace(/['"]/g, '');
							filename = filename.replace('UTF-8','');
						}
					}
					response.filename = filename;
					resolve(response);                  
				}
				else {   
					resolve(response);
				}             
			}
		});
	})   
}


function createParams(parameters) {
	var params, key;
	for (key in parameters)
	{
		if (parameters.hasOwnProperty(key)) {
			if (params) {
				params = params + key + '=' + parameters[key] + '&';
			}
			else {
				params = key + '=' + parameters[key] + '&';
			}
		}
	}
  return params;
}

function constructRequestDetails(input, url, type, isModuleParam) {
  let requestDetails = {};
	requestDetails.type = type;

	if (input != undefined)
	{
		if (input.id)
		{
			url = url.replace('{id}', input.id);
		}
		else
		{
			url = url.replace('/{id}', '');
		}
		if(input.api_name){
			url = url.replace('{api_name}',input.api_name);
			var params = {};
			if (input.params){
				params = input.params;
			}
			params.auth_type = 'oauth';
			input.params = params;
		}
		else {
			url = url.replace('/{api_name}','');
		}

		if (input.params){
			requestDetails.params = createParams(input.params) + (input.module && isModuleParam ? 'module=' + input.module : '');
		}
		if (!requestDetails.params && isModuleParam){
				requestDetails.params = 'module=' + input.module;
		}
		if (input.body && (type == HTTP_METHODS.POST || type == HTTP_METHODS.PUT)){
				requestDetails.body = JSON.stringify(input.body);
		}
		if (input.x_file_content){
				requestDetails.x_file_content = input.x_file_content;   
		}
		if (input.download_file){
				requestDetails.download_file = input.download_file;  
		}
		if (input.headers){
			requestDetails.headers = input.headers;
		}
	}
	requestDetails.url = url;

	return requestDetails;
}