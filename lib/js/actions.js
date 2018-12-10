const util = require("./util");

function actions(){
	return {
		convert : function (input)
		{
			return util.promiseResponse(util.constructRequestDetails(input, "Leads/{id}/actions/convert", HTTP_METHODS.POST, false));//No I18N
		}
	}
}

module.exports = actions;