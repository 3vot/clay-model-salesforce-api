var test = require('tape');

var Model = require("clay-model")
var VFR = require("../");

var Mock = require("./mock/superagent");
VFR.Request = Mock;

test('Create Records', function (t) {
  t.plan(4);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url, data, callback){       
    t.equal( method,"post" )
    t.equal( url,"/Asset" )
    var obj = data;
    obj.id = 2;
    callback( null, JSON.stringify(obj) );
  }
  
  var asset;
  Asset.create({name: "test.pdf"})
  .then( function( value ){ asset = value; 
    t.equal( asset.name, "test.pdf" ) 
    t.equal( asset.id, 2 );
  })

})

test('Create Records, with error in response', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url,data, callback){       
    callback( "err" );
  }
  
  var asset;
  Asset.create({name: "test.pdf"})
  .fail(function(err){t.notEqual( err, null ) })
})


test('Update record', function (t) {
  t.plan(6);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url, data, callback){
    t.equal( method,"put" )
    t.equal( url,"/Asset/3" )    
    callback(null,null);
  }
  
  var asset = Asset.create({ name: "test.pdf", id: 3 }, { ignoreAjax: true })
  
  t.equal(asset.id, 3);

  asset.visible=true;
  asset.save()

  .then( function(sameAsset){ 
    t.deepEqual( asset.id, sameAsset.id)  
    t.deepEqual( asset.name, sameAsset.name) 
    t.deepEqual( asset.visible, sameAsset.visible)  });
})



test('Destroy record', function (t) {
  t.plan(3);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url, data, callback){
    callback();
  }
  
  var asset = Asset.create({ name: "test.pdf", id: 3 }, { ignoreAjax: true })
  
  t.equal(asset.id, 3);
  t.equal(  Asset.exists(3), true);

  asset.destroy()
  .then( function(sameAsset){ 
    t.equal(  Asset.exists(3), false) } );
})

test('Read record', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url, data, callback){
    callback(null, JSON.stringify({name: "read name", visible: false}));
  }
  
  Asset.read(3)
  .then(function(asset){
    t.equal( asset.visible, false );
  })

})

test('Query record', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Mock.nextReponse= function(method, url, data, callback){
    callback(null, JSON.stringify([{name: "read query", visible: false},{name: "read query 2", visible: false}]));
  }
  
  Asset.query("select id,name from assets")
  .then(function(){
    t.equal( Asset.count() , 2 );
  })

})




