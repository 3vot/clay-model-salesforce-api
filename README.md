clay-model-salesforce-api
==============

Clay REST API Connector for Clay-Model


# Install
npm install clay-model-salesforce-api

# Overview

Clay-model-salesforce-api works in conjuntion with 3vot-salesforce-proxy, a proxy server that translates Salesforce REST into standard Rest API.

You may use the 3VOT Heroku Button to deploy this server, use in your NODE Server or deploy a server yourself. 
[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

https://github.com/3vot/3vot-salesforce-proxy

# Usage

Register this Connector with Clay-Model at initialization

```
var Ajax = require("clay-model-salesforce-api");

var Model = require("clay-model");
var User = Model.configure("User", ["name", "email"])
User.ajax = Ajax;
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

Remember http rest method is delete.
