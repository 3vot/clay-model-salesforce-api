var Salesforce = require("../../../");
var Account = require("./account");

Salesforce.registerKeys("https://login.salesforce.com", "3MVG9A2kN3Bn17hvV1PXTWx3nXNoLKADFRpsQVpmVvJVPpoMcq7uZo6q_K9rXM0xeBYvFqvjPc3hnu1vd_njX", "https://localhost:3000" );
Salesforce.listerForSalesforceCallback( checkIfPopup);


function checkIfPopup(isPopUp){
	if(isPopUp) loadApp();
	else return; //Do nothing this is a popup loading from Salesforce Return_URL.
}


function loadApp(){
	//Here you could add login to login or re-use an existing token
	Salesforce.openLoginWindow( userLoggedIn );
}


function userLoggedIn(error, token){
	if(error) return console.error(error);
	console.log(token)
	//Here you could store the token for later re-use
	Salesforce.registerToken( token );

	//Using Clay-Model
	var body = document.body;

	Account.query( "select id, Name from Account" ) // also try Account.create, or instance operations like account.save() and account.destroy()
	.then( function(){
		var accounts = Account.all();
		for (var i = accounts.length - 1; i >= 0; i--) {
			body.innerHTML += "<div>"+ accounts[i].Name +"</div>"
		};
	})
	.fail( function(error){
		console.error(error);
	})

}






