const nc = require('../../')
const norch = require('norch')
const sandbox = 'test/sandbox'
const supertest = require('supertest')
const tape = require('tape')
var server
var norchClient

tape('should create a mother norch', function (t) {
  t.plan(1)
  norch({indexPath: sandbox + '/norch-mother'}, function(err, thisServer) {
    var options = {}
    server = thisServer
    options.batchName = 'reuters'
    options.fieldOptions = [
      {fieldName: 'places', filter: true},
      {fieldName: 'topics', filter: true},
      {fieldName: 'organisations', filter: true}
    ]
    supertest('http://localhost:3030').post('/add')
      .field('options', JSON.stringify(options))
      .attach('document', './node_modules/reuters-21578-json/data/justTen/justTen.json')
      .expect(200)
      .end(function (err, res) {
        t.error(err)
      })
  })
})


tape('norch-client should connect to the norch', function (t) {
  t.plan(3)
  try {
    norchClient = nc('http://localhost:3030', {})
  } catch (err) {
    t.error(err, 'this error should not occur')    
  }
  t.false(norchClient.replicated)
  norchClient.queryNorch({query: {'*': ['sunoil']}}, function(err, results) {
    t.equal(results.totalHits, 1)
    t.equal(results.hits[0].document.title,
            'ARGENTINE 1986/87 GRAIN/OILSEED REGISTRATIONS')
  })
})


tape('waiting for replication to complete', function (t) {
  t.plan(1)
  setTimeout(function () {
    t.true(norchClient.replicated, 'replication flag is truthy')
  }, 4000)
})

tape('this time norch-client should hit the replicated norch', function (t) {
  t.plan(3)
  t.true(norchClient.replicated)
  norchClient.queryNorch({query: {'*': ['sunoil']}}, function(err, results) {
    t.equal(results.totalHits, 1)
    t.equal(results.hits[0].document.title,
            'ARGENTINE 1986/87 GRAIN/OILSEED REGISTRATIONS')
  })
})


tape('teardown - closing norch', function (t) {
  server.close()
  t.end()
})


tape('norch is shut down but it is still possible to hit the replicated norch', function (t) {
  t.plan(3)
  t.true(norchClient.replicated)
  norchClient.queryNorch({query: {'*': ['sunoil']}}, function(err, results) {
    t.equal(results.totalHits, 1)
    t.equal(results.hits[0].document.title,
            'ARGENTINE 1986/87 GRAIN/OILSEED REGISTRATIONS')
  })
})
