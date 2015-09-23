



var test = require('tape');

var Model = require("clay-model")
var VFR = require("../");

var token = {"access_token":"00D17000000Cn6J!AR0AQCDbfV3DantZDp_Tbc.sTIt0VDBa53Iwwnyq1X_Mm3h60S6zlp54kWOPnFUIwvTrPGOpMLgP4FWWRi6T1Rt3ViRqL4M2","instance_url":"https://cs22.salesforce.com","id":"https://test.salesforce.com/id/00D17000000Cn6JEAS/005A0000000f4mEIAQ","issued_at":"1443025697951","signature":"KuvdZyoEde5ScgkcwsTDFgezk2EX03PE5xUyrDInA/c=","scope":"api full","token_type":"Bearer","state":"ok"};

VFR.registerToken(token);


test('Create Records', function (t) {
  t.plan(2);
  var Account = Model.setup("Account", ["Name"]);
  Account.ajax = VFR;
 
  var asset;
  Account.create({name: "test.pdf"})
  .then( function( value ){ asset = value; 
    console.log(argumernts)
    t.equal( asset.name, "test.pdf" ) 
    t.equal( asset.id, 2 );
  })
  .fail(function(){
    console.log(argumernts)
    
  })

})
/*
test('Create Records, with error in response', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  var asset;
  Asset.create({name: "test.pdf"})
  .fail(function(err){t.notEqual( err, null ) })
})


test('Update record', function (t) {
  t.plan(6);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;


  
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

  
  Asset.read(3)
  .then(function(asset){
    t.equal( asset.visible, false );
  })

})

test('Query record', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Asset.query("select id,name from assets")
  .then(function(){
    t.equal( Asset.count() , 2 );
  })

})
*/



