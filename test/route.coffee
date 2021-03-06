
Route = require '../lib/router/route'
toRegexp = require 'path-to-regexp'
require 'should'

describe 'route', ->

  it 'should create a route', ->

    m = ->

    route = new Route '/', ['get'], [m]

    route.path.should.equal '/'
    route.regexp.toString().should.equal toRegexp('/').toString()
    route.methods.length.should.equal 1
    route.methods[0].should.equal 'GET'


  it 'should match /', ->

    route = new Route '/', ['get'], [->]

    match = route.match '/'

    (match?).should.be.true
    match.should.be.an.Array
    match.length.should.be.equal 0

    match = route.match '/wrong'

    (match?).should.be.false

  it 'sould match /:param and get parameters', ->

    route = new Route '/:param', ['get'], [->]

    params = []

    route.path.should.equal '/:param'
    route.regexp.toString().should.equal toRegexp('/:param', params ).toString()
    
    match = route.match '/some'

    (match?).should.be.true
    match.should.be.an.Array
    match.should.have.property 'param', 'some'

  it 'should match multiple method', ->

    route = new Route '/', ['get','post'], [->]
