const modules = require('./modules'),
	settings = require('./settings'),
	actions = require('./actions'),
	users = require('./users'),
	org = require('./org'),
	attachments = require('./attachments'),
	functions = require('./functions');

global.HTTP_METHODS = {
	GET : "GET",//No I18N
	POST : "POST",//No I18N
	PUT : "PUT",//No I18N
	DELETE : "DELETE"//No I18N
};

const API = (function() {
	return { 
		MODULES : new modules(),
		SETTINGS : new settings(),
		ACTIONS : new actions(),
		USERS : new users(),
		ORG : new org(),
		ATTACHMENTS : new attachments(),
		FUNCTIONS :new functions()
	}
})(this)

module.exports = API;