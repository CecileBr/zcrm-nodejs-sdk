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
				let refresh_token = tokens.refresh_token;
				let config = crmclient.getConfig_refresh(refresh_token);
				new OAuth(config, 'refresh_access_token');

				OAuth.generateTokens(crmclient.getParam('iamurl')).then(newToken => {
					let result_obj = crmclient.parseAndConstructObject(newToken);

					storage_module.updateOAuthTokens(result_obj).then(() =>{
						makeapicall(request, result_obj.access_token).then(res => {
							resolve(res);
						})
						.catch(err => { reject(err) })
					})
					.catch(err => { reject(err) })
				})
				.catch(err => { reject(err) })
			}
			else {
				makeapicall(request, tokens.access_token).then(res =>{
					resolve(res);
				})
				.catch(err => { reject(err) })
			}
		})
		.catch(err => { reject(err) })
	})
}


function makeapicall(request, accesstoken){
	const crmclient = require('./ZCRMRestClient');

  return new Promise(function(resolve,reject){
		let baseUrl = "https://"+crmclient.getParam('baseURL')+"/crm/v2/"+ request.url;
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

		api_headers.Authorization = 'Zoho-oauthtoken '+accesstoken;
		api_headers["User-Agent"] = 'Zoho CRM Node SDK';
		httpclient({
			uri : baseUrl,
			method : request.type,
			headers : api_headers,
			body:req_body,
			encoding: encoding
		}, (err,res) =>{
			if (err) reject(err);
			
			if (res.statusCode != 200){
				reject(res.statusMessage);
			}
			else {
				if (request.download_file){
					let filename;
					let disposition =res.headers["content-disposition"];//No I18N
					if (disposition && disposition.indexOf('attachment') !== -1) {
						let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
						let matches = filenameRegex.exec(disposition);
						if (matches != null && matches[1]) { 
							filename = matches[1].replace(/['"]/g, '');
							filename = filename.replace('UTF-8','');
						}
					}
					res.filename = filename;
					resolve(res);                  
				}
				else {   
					resolve(res);
				}             
			}
		});
	})   
}

function createParams(parameters) {
	let paramArray = [];
	for (const key of Object.keys(parameters)) {
		paramArray.push(key + '=' + parameters[key]);
	}
	let paramToString = paramArray.join('&');
  return paramToString;
}

function constructRequestDetails(input, url, type, isModuleParam) {
  let requestDetails = {};
	requestDetails.type = type;

	if (input != undefined){
		if (input.id){
			url = url.replace('{id}', input.id);
		}
		else{
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