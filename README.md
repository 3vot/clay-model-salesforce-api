clay-model-salesforce-api
==============

Clay REST API Connector for Clay-Model


# Install
npm install clay-model-salesforce-api

# Overview

Clay-model-salesforce-api works in conjuntion with clay-model in order to interact with the Salesforce API in a modular pattern, this enables developers to interact with Salesforce Objects as Classes `var acme = Account.create({Name: "Acme"})` and in an instance level `acme.Name = 'Acme Corp'` and simply performa API Operations Acme.save().then(...).fail('...')`.

Being able to work with models in a straightforward way, makes it posible to build large Enterprise Apps.

Clay it's being used in production in the companies where @rodriguezartav is a consultant and in several Salesforce AppExchange Packages ( that are listed and passed security review ).

# How it works

We login to Salesforce by using oAuth Login. First open a popup window where the user will login into Salesforce - then register the access token. The popup points to Salesforce oAuth, then it's connected app settings redirects back to our apps URL ( still on the Popup ) - finally the popup comunicates with our main app window to complete login.

The App handles both the main app and popup. Popup operation works when it's being redirected from Salesforce.com. So the app must know it's being called in popup up mode. This module has all that's required for this to work.

Once our app has the access token, it can exchange data with Salesforce.com. 

Why so complicated? So we can work offline and use localstorage. User Experience wise, we don't want to make the user jump in and out of the app to Login. Todo: Use the username/password flow, instead.

# Pre-Setup

1. Configure Remote Access in Saleforce.

2. Configure CORS in Saleforce.

3. Setup your local development enviroment so that it works over https in development. Se /example for demo


# Setup

## Listen for Salesforce Callback
We must register to listen for the Salesforce oAuth redirect, when our app is operating as the popup being redirected from Salesforce oAuth Login. Even if this step should be listed after we open the popup, we put it here because it's need to be first on the app init code.

```
Salesforce.listerForSalesforceCallback( callback );

This is a syncronous function and should be place first in your code. If the callback returns true, then it's a popup and the app should not continue. It will notify the real app, where the callback returns false and close itself.


## Register Salesforce Connected App Keys:

```
var Salesforce = require("clay-model-salesforce-api");
Salesforce.registerKeys(lOGIN_SERVER, CLIENT_ID, REDIRECT_URL);

```

## Login
Note: If login is not executed from a click handler, popup may be blocked.

This will open a salesforce oauth login window popup and call the callback function once it's complete.

```
Salesforce.openLoginWindow( callback );


function callback( err, token){
	//err != null when popup was blocked;
	//token = Salesforce oAuth Token
}
```

## Register Oauth Token
Register the aouth Token, this gives you a change to store in localstorage and then use it after page refresh by calling this function on app initialization.

```
Salesforce.registerToken(token);
```

# Usage

Register this Connector with Clay-Model at initialization

```
var Salesforce = require("clay-model-salesforce-api");

var Model = require("clay-model");
var User = Model.configure("User", ["name", "email"])
User.ajax = Salesforce;
```

# Docs
Read Clay-Model docs for Model API

## Query
Execute a SOQL Query
```
User.query( SOQL )
	.then( function(){
		var users = User.all()
	})
	.fail( function(error){
		// Salesforces API Error Structure
	})
```

## CRUD
Use Clay-Model regularly, behind the scenes it is sending all CRUD's to Salesforce.com via Visualforce Remoting

```
var user = User.create({name: "rob"})
user.save();
user.destroy();

Only important feature to note, if you don't want to send changes to the servers, use { ignoreAjax: true }

```
var user = User.create({name: "rob"}, {ignoreAjax: true})
user.save({ ignoreAjax: true });
user.destroy({ignoreAjax});
```

## APEX
Clay-Model let's you make Apex Rest Calls

```
var Ajax = require("clay-model-salesforce-api");
Ajax.apex( "post", "postMethod", { id: 1, name: "value", other: false }  )
.then( ... )
.fail( ... )


For get requests with query strings, attach the string to the postMethod as in getMethod?query=yes&other=true

Salesforce APEX REST API does not have CORS, so you must use a proxy server.

## Under the hood

We are using jsforce. The connection object it's exposed as Salesforce.conn so you may use any of jsforce methods as well.

`Salesforce.conn.Batch....`


