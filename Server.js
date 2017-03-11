var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var schema = require('js-schema');
var request = require('request-promise');
var mongo = require('mongodb');
// var url = "mongodb://172.17.0.2:27017/CostumerDB";
var url = "mongodb://127.0.0.1:27017/CostumerDB";
var costCollection = 'costumers';
var assert = require('assert');
var mongoClient = mongo.MongoClient;
app.use(bodyParser.json());
var mongodb;

// Build a service that manages customers.
// The service needs to have the following functionality:
// - create customer
// - update customer
// - delete customer
// - fetch customer according to id
//
// each customer has an id, name, email, address and related credit card tokens (credit cards are managed in a different service)
// when creating a customer it can be linked to one or more credit cards. an existing customer can be linked to a new credit card.

//Robust size getter
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var sizeOfDoc = 5; //id, name, email, address, credit card tokens

var validateCostumer = schema({
  id: /^[0-9]{1,9}$/,
  name: /^[a-zA-Z][a-zA-Z ]{1,30}$/,
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  address: /^[A-Za-z0-9'\.\-\s\,]{8,40}$/,
  credit_card_tokens: Array //This is validated in a different service
})

mongoClient.connect(url, {
    poolSize: 5
  },
  function(err, db) {
    if(err) throw err;
    mongodb = db;
  }
);

app.route('/costumers')
  .get(function(req, res){ //fetchById
    var idQuery = req.query["id"];
    var resultArray = [];
    var validateIdRegex = new RegExp("^[0-9]{1,9}$");
    if (!validateIdRegex.test(idQuery)) {
      res.status(400).send("The supplied ID isn't valid");
      return;
    }else{
      mongodb.collection(costCollection).find({id:idQuery}).limit(1).next(function(err, doc) {
        if (err != null){
          console.log(err.message);
          res.status(500).send("An error occurred, please try again");
          return;
        }
        console.log("This is doc:", doc);
        res.send(doc);
        return;
      })
    }
  })
  .patch(function(req, res){ //updateCostumer

    //Validation
    var schemaIsValidated = validateCostumer(req.body);
    if (!schemaIsValidated || Object.size(req.body) != sizeOfDoc){
      res.status(400).send("Could not update costumer, data is not according to schema");
      return;
    }

    //Update costumer:
    mongodb.collection(costCollection).findAndModify(
      {id: req.body.id},     // query
      [],               // represents a sort order if multiple matches
      { $set: {name:req.body.name, email:req.body.email, address:req.body.address, credit_card_tokens:req.body.credit_card_tokens}},   // update statement
      { new: true },    // options - new to return the modified document
      function(err,doc) {
        if (err == null) {
          if (doc.lastErrorObject.updatedExisting) {
            console.log(doc.value);
            res.status(200).send("Managed to update costumer with id: '" + req.body.id + "'");
          }else{
            console.log("Client tried to update a non-existing costumer/Change the ID");
            res.status(403).send("You cannot change your ID/There is no pre-existing account with this ID, please create account");
          }
        }else {
          console.log("An error occurred: ", err.message);
          res.status(500).send(err.message);
        }
      }
    )
  })
  .delete(function(req, res) { //deleteCostumer
      var queryId = req.query["id"];
      var validateIdRegex = new RegExp("^[0-9]{1,9}$");
      if (!validateIdRegex.test(queryId)) {
        res.status(404).send("The supplied ID isn't valid");
        return;
      }else{
        mongodb.collection(costCollection).findAndRemove({id: queryId}, [], function(err, doc) {
            if (err == null){
              if (doc.value != null){
                console.log("Costumer deleted:'" + queryId + "'");
                console.log(doc);
                res.status(200).send("Costumer deleted:'" + queryId + "'"); //not using 204 in order to add response body
              }else {
                console.log("There is no costumer:'" + queryId + "'");
                console.log(doc);
                res.status(404).send("There is no costumer:'" + queryId + "'");
              }
            }else{
              console.log(err.message);
              res.status(500).send("An error ocurred, please try again");
            }
          });
      }

  })
  .post(function(req, res){ //createCostumer
    console.log(process.env);

    //Validation
    var schemaIsValidated = validateCostumer(req.body);
    if (!schemaIsValidated || Object.size(req.body) != sizeOfDoc){
      res.status(400).send("Could not create costumer, data is not according to schema");
      return;
    }

    //Insert to mongoDB
    var insertDocument = function(db, callback) {
      db.collection(costCollection)
        .insertOne(req.body, function(err, result) {
                      if (err == null) { //no errors
                          callback();
                      }else {
                        if (err.code == 11000) { //Uniqueness is on the line
                          console.log(err.message);
                          res.status(400).send("There is already an account with the provided id");
                          return;
                        }else { //Some other error
                          console.log("Something went wrong");
                          res.status(500).send("Something went wrong, please try again");
                          return;
                        }
                      }
                    });
    };

    //ID is unique - no duplicates allowed:
    mongodb.collection(costCollection).ensureIndex({id:1}, {unique:true}, function(err, indexName){
      insertDocument(mongodb, function() {
                        
                        console.log("Costumer was created");
                        res.status(201).send("Thank you for creating an account " + req.body["name"]);
                      });
    });
  });

app.listen(8080, function() {
    console.log("Listening on port 8080");
});
