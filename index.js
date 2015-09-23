var Q = require("kew");
var jsforce = require("jsforce");
var qs = require('querystring');


var Ajax = function(eventName, model, options){
  if( !navigator.onLine || window.simulateOffline ){
    return Ajax.networkError.call(this,"internet");
  }

  if( !Ajax.conn){
    return Ajax.networkError.call(this, "login");
  }

  if(eventName == "create") return Ajax.post.call(this, model,options )
  else if(eventName == "update") return Ajax.put.call(this, model,options )
  else if(eventName == "destroy") return Ajax.del.call(this, model,options )
  
  var params = model;
  if(eventName == "query") return Ajax.query.call(this, params, options);  
  else if(eventName == "read") return Ajax.get.call(this, params, options);
  else if(eventName == "pull") return Ajax.pull.call(this, params);  
  else if(eventName == "push") return Ajax.push.call(this, params);  

}

Ajax.Request = Request;

Ajax.listerForSalesforceCallback = function( callback ){
  if( window && window.location.hash.indexOf("access_token") > -1 ){
    window.opener.postMessage( window.location.hash.replace("#",""), "*" );
    callback(false)
  } 
  else callback(true);
}

Ajax.registerKeys = function(loginServer, clientId, redirectUrl){
  Ajax.LOGIN_SERVER = loginServer
  Ajax.CLIENT_ID = clientId
  Ajax.REDIRECT_URL = redirectUrl
}

Ajax.openLoginWindow = function(callback){
  var url =  Ajax.LOGIN_SERVER +  "/services/oauth2/authorize?response_type=token&client_id="+ Ajax.CLIENT_ID+"&redirect_uri=" + Ajax.REDIRECT_URL
  
  Ajax.loginCallback = callback;
  window.addEventListener("message", Ajax.onLoginCallback, false);
  var w = 300;
  var h = 480;
  var left = (screen.width/2)-(w/2); 
  var top = (screen.height/2)-(h/2);
  window.pw = window.open(url, null, 'location=yes,toolbar=no,status=no,menubar=no,width='+w+',height='+h+',top='+top+',left='+left);
  try {
    window.pw.focus();
  }
  catch (e) {
    Ajax.loginCallback(e);
    Ajax.loginCallback =null;
    window.pw=null;
  }
}

 Ajax.onLoginCallback = function(event){
  if( !event || !event.data || !event.data.indexOf || event.data.indexOf("access_token") == -1 ) return false;
  
  window.removeEventListener("message", Ajax.onLoginCallback, false);
  
  var token = qs.parse( event.data );

  if( token ){ 
    Ajax.registerToken(token);
    if( Ajax.loginCallback ){
      Ajax.loginCallback(null, token);
      Ajax.loginCallback = null;
    }
  }
  if( window.pw ){
    window.pw.close();
    window.pw=null;
  }
  
}

Ajax.registerToken = function(token){
  Ajax.token = token;
  Ajax.host = token.instance_url;
  Ajax.access_token = token.access_token;

  Ajax.conn = new jsforce.Connection({
    instanceUrl : token.instance_url,
    accessToken : token.access_token
  });
}

Ajax.logout = function(){
  Ajax.conn = null;
}

Ajax.networkError = function(){
  var deferred = Q.defer(); 

  setTimeout( function(){
    deferred.reject( { errorCode: 'NO_INTERNET' } )
  },1000)

  return deferred.promise;
}

Ajax.apex = function(method, name, params){
  
  if( !navigator.onLine || window.simulateOffline ){
    return Ajax.networkError.call(this,"internet");
  }

  if( !Ajax.conn){
    return Ajax.networkError.call(this, "login");
  }

  var deferred = Q.defer(); 
  
  var conn = new jsforce.Connection({
    instanceUrl : Ajax.conn.instanceUrl,
    accessToken : Ajax.conn.accessToken,
    proxyUrl: process.env.PROXY_URL
  });

  conn.apex[method]("/"+ name +"/", params, function(err, res) {
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject( { errorCode: 'NO_INTERNET' } )
    if( err ) return deferred.reject( err );

    deferred.resolve( res )
  });

  return deferred.promise;

}

Ajax.query = function(params, options){
  var _this = this;
  var deferred = Q.defer();
  
  var records = [];
  Ajax.conn.query(params)
  .on("record", function(record) {
    records.push(record);
  })
  .on("end", function(query) { return deferred.resolve( records ); })
  .on("error", function(err) {
    return deferred.reject( err );
  })
  .run( options );

  return deferred.promise;
}

Ajax.push = function(options){
  var _this = this;
  var url =Ajax.host.replace("/api","")
  var deferred = Q.defer();

  if(options.channel) channel = this.className + "_" + options.channel;
  else options.channel = this.className

  options.socket_id = Ajax.pusher.connection.socket_id;

  Ajax.Request.get( url + "/pusher" )
  .withCredentials()
  .query( options )
  .query("login_server=" +Ajax.login_server)
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject( { errorCode: 'NO_INTERNET' } )
    if(err) deferred.reject(err);
    if(res.status >= 400) return deferred.reject( res.body );
    deferred.resolve(res);
  })
  
  return deferred.promise;
}

Ajax.pull = function(options){
  var _this = this;
  if( !Ajax.pusher ) throw "Remember to register. Ajax.pusher = var pusher = new Pusher('KEY');"
  var channel = Ajax.pusher.subscribe( this.className );
  if(options.channel) channel += "_" + options.channel;

  channel.bind( options.eventName, function(data) {
    
    _this.trigger(options.eventName, JSON.parse( data.message ) );
  });
}

Ajax.realtime = function(){
  Ajax.realtime = true;

  this.pull( { eventName: "create" } )
  this.pull( { eventName: "update" } )
  this.pull( { eventName: "destroy" } )
}

Ajax.get = function(id, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.get( Ajax.generateURL(this) + "/" + id )
  .query("login_server=" +Ajax.login_server)
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject( { errorCode: 'NO_INTERNET' } )
    if(err) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );
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

  Ajax.conn.sobject(model.className).create( this.attributes(), function(err, ret) {
    if (err || !ret.success || ret.errors) { return res.reject(err) }
    _this.id = ret.Id;
    _this.changeID(ret.Id);
    _this.Id = ret.Id;
    Ajax.handleResultWithPromise.call(_this, err, ret, false, deferred  )
  
  });

  return deferred.promise;  
}

Ajax.put = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  var valuesToSend = JSON.parse(JSON.stringify(this.toJSON())); //ugly hack
  var previousAttributes = JSON.parse( model.previousAttributes[this.id] );
  for(key in valuesToSend){
    if( this.constructor.ignoreFields && this.constructor.ignoreFields.indexOf(key) > -1 ) delete valuesToSend[key];
    else if(valuesToSend[key] == previousAttributes[key]){
      delete valuesToSend[key];
    }
  }

  valuesToSend.Id = this.id;

  Ajax.conn.sobject(this.constructor.className).update( valuesToSend, function(err,ret){
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject( { errorCode: 'NO_INTERNET' } )
    if( err ) return deferred.reject( err );
    if( !ret.success ) return deferred.reject( ret );
    Ajax.handleResultWithPromise.call(_this, err, ret, true, deferred  )
  })

  return deferred.promise;  
}

Ajax.del = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.put( Ajax.generateURL(model, this.id ) )
  .query("login_server=" +Ajax.login_server)
  .withCredentials()
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject( { errorCode: 'NO_INTERNET' } )
    if(err) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );
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
  if (result) {
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
      errorCode: 'NULL_RETURNED'
    });
  }
}





module.exports = Ajax;