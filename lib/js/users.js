const util = require('./util');

function users(){
	return {
		get : function (input)
		{
			return util.promiseResponse(util.constructRequestDetails(input, "users/{id}", HTTP_METHODS.GET, true));
		}
	}
}

module.exports = users;