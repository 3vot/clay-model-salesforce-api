var Q = require("kew");
var Request = require("superagent")
//var Qs = require('qs');
//var QueryString = require("querystring");


var Ajax = function(eventName, model, options){
  if(eventName == "create") return Ajax.post.call(this, model,options )
  else if(eventName == "update") return Ajax.put.call(this, model,options )
  else if(eventName == "destroy") return Ajax.del.call(this, model,options )
  
  var params = model;
  if(eventName == "query") return Ajax.query.call(this, params, options);  
  else if(eventName == "read") return Ajax.get.call(this, params, options);

}

Ajax.Request = Request;

Ajax.host = "";


Ajax.apex = function(method, name, params){
  
  var deferred = Q.defer();

  Ajax.Request[method]( Ajax.host + "/apex/" + name )
  .send(params)
  .withCredentials()
  .end( function( err, res ){ 
    if( err ) return deferred.reject( err );
    deferred.resolve( res )
  });
  return deferred.promise;
}


Ajax.query = function(params, options){
var _this = this;
  //var pctEncodeSpaces = true;
//  var params = encodeURIComponent(params).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
  
  var deferred = Q.defer();
  
  Ajax.Request.get( Ajax.generateURL(this) )
  //.set('X-Ajax.Requested-With', true)
  .query( "query=" + params )
  .query( options )
  .withCredentials()
  .end( function( err, res ){ 
    if( err ) return deferred.reject( err );

    for (var i = res.body.length - 1; i >= 0; i--) {
      var item = res.body[i];
      item.id = item.Id;
    };

    deferred.resolve( res.body )
  });
  return deferred.promise;

}

Ajax.login = function(id, options){
  var _this = this;
  var url =Ajax.host.replace("/api","")
  var deferred = Q.defer();

  Ajax.Request.get( url + "/login/whoami" )
  .withCredentials()
  .end( function( err, res ){ 
    if( err || res.status != 200 ) return window.location = url + "/login?app_url=" + window.location.href
    Ajax.user = res.body;
    deferred.resolve();
  })
  

  return deferred.promise;
}

Ajax.get = function(id, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.get( Ajax.generateURL(this) + "/" + id )
  .end( function( err, res ){ 
    res.id = res.Id;
    Ajax.handleResultWithPromise.call(_this, err, res.body, false, deferred  );
  })
  

  return deferred.promise;
}

Ajax.post = function(model, options){
  var deferred = Q.defer();

  var _this = this;

  var id = this.id;
  this.id = null;

  Ajax.Request.post( Ajax.generateURL(model) )
  .send( this.toJSON() )
  .withCredentials()
  .end( function( err, res ){ 
    _this.changeID(res.body.Id);
    _this.Id = res.body.Id;
    Ajax.handleResultWithPromise.call(_this, err, res.body, false, deferred  )
  });

  return deferred.promise;  
}

Ajax.put = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  var valuesToSend = JSON.parse(JSON.stringify(this.toJSON())); //ugly hack
  var previousAttributes = JSON.parse( model.previousAttributes[this.id] );
  for(key in valuesToSend){
    if(valuesToSend[key] == previousAttributes[key]){
      delete valuesToSend[key];
    }
  }

  Ajax.Request.put( Ajax.generateURL(model, this.id ) )
  .send( valuesToSend )
  .withCredentials()
  .end( function( err, res ){ 
    Ajax.handleResultWithPromise.call(_this, err, res.body, true, deferred  )
  });

  return deferred.promise;  
}

Ajax.del = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.put( Ajax.generateURL(model, this.id ) )
  .withCredentials()
  .end( function( err, res ){ 
    Ajax.handleResultWithPromise.call(_this, err, res.body, true, deferred  )
  });

  return deferred.promise;  
}

Ajax.generateURL = function() {
  var args, collection, object, path, scope;
  object = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  collection = object.className;
  
  args.unshift(collection);
  args.unshift(scope);
  path = args.join('/');
  path = path.replace(/(\/\/)/g, "/");
  path = path.replace(/^\/|\/$/g, "");
  
  return  Ajax.host + "/"+path;
};

Ajax.handleResultWithPromise = function(err, result, nullok, deferred) {
  
  if(err) deferred.reject( err );
  else if (result) {
    if (typeof result !== 'object') {
      result = JSON.parse(result);
    }
    if (Array.isArray(result) && result.length > 0 && result[0].message && result[0].errorCode) {
      return deferred.reject(result);
    } else {      
      return deferred.resolve(this);
    }
  } else if (typeof nullok !== 'undefined' && nullok) {
    return deferred.resolve(this);
  } else {
    deferred.reject({
      message: 'Null returned by RemoteAction not called with nullOk flag',
      errorCode: 'NULL_RETURN'
    });
  }
}

module.exports = Ajax;