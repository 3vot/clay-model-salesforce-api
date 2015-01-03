clay-model-vfr
==============

Clay Visualforce Connector for Clay-Model

# Dependencies

clay-model-vfr uses Clay for Salesforce Package Available in App Exchange. There is a package that works with RemoteTK Component.

# Install
npm install clay-model-vfr

# Usage

Register this Connector with Clay-Model at initialization

```
var ClayVfr = require("clay-model-vfr");

var Model = require("clay-model");
var User = Model.configure("User", ["name", "email"])
User.ajax = ClayVfr;
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

Only thing to note, if you don't want to send changes to the servers, use { ignoreAjax: true }

```
var user = User.create({name: "rob"}, {ignoreAjax: true})
user.save({ ignoreAjax: true });
user.destroy({ignoreAjax});
```
## Visualforce Remoting

Because sometimes is useful to wrap Visualforce Remoting Calls inside a Model, we included the Api Method.

```
User.api( remoteAction, argument1, argument2, argumentn,  options );

remoteAction: [STRING] The remote action you want to execute in the form ClassName.MethodName

arguments: optional arguments to be send to RemoteAction.

options: [OBJECT] Options for Visualforce Remoting Configuration

options.nullok: [BOOLEAN] Don't raise error if VFR response is null. Default: false -> will raise error is response is null

## Packages for ISV's

When the app is part of a package simple add the following line
```
User.ajax.namespace = "NAMESPACE.";
```
This must be done for each model. Notice the (.) at the end of the namespace, it is required.

## Clay for Salesforce

To use Clay-Model-VFR with Clay for Salesforce the namespaces work as follows:

[https://appexchange.salesforce.com/listingDetail?listingId=a0N3000000B5XIMEA3]( App Exachange Instalation ) NAMESPACE = threevot.ThreeVotApiController

[https://login.salesforce.com/packaging/installPackage.apexp?p0=04ti0000000XxBH]( Manual Instalation - No Updates ) ThreevotApiController

[https://github.com/3vot/clayforsalesforce]( Open Source ) ThreevotApiController or you Package if using in Managed Package 





