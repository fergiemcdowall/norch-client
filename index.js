const JSONStream = require('JSONStream');
const fs = require('fs')
const levelws = require('level-ws')
const request = require('request')
const searchIndex = require('search-index')
const zlib = require('zlib');

var replicant   // the local datastore

module.exports = function(endPoint, options) {

  var norchClient = {}

  var replicantName = 'theReplicant'  // do this with options eventually

  //init
  fullRefeed(endPoint, function(err) {
    norchClient.replicated = true
    console.log('refeed complete')
  })
  //search-index


  norchClient.replicated = false //set to true on replication
  norchClient.queryNorch = function (query, callback) {
    if (norchClient.replicated) {
      queryReplicatedNorch(query, options, callback)
    } else {
      queryRemoteNorch(query, endPoint, options, callback)
    }
  }


  return norchClient
}

var queryRemoteNorch = function (query, address, options, callback) {
  var url = address + '/search?q=' + JSON.stringify(query)
  console.log('querying REMOTE norch at ' + address + ' with url ' + url)
  request(url, function(err, res, body) {
    callback(err, JSON.parse(body))
  })
}

var queryReplicatedNorch = function (query, options, callback) {
  console.log('querying REPLICATED norch')
  replicant.search(query, callback)
}

var fullRefeed = function(endPoint, callback) {
  searchIndex({indexPath: 'test/sandbox/norch-client'}, function(err, si) {
    var url = endPoint + '/snapshot'
    replicant = si
    request(url)
      .pipe(zlib.createGunzip())
      .pipe(JSONStream.parse())
      .pipe(si.writeStream())
      .on('close', callback)
      .on('error', callback)
  })
}
