
utils = require('../lib/utils')
path = require 'path'

describe 'Utils', ->

  describe 'resolveExt', ->
    it 'should resolve javascript files', ->
      p = path.join __dirname, 'fixtures', 'controllers', 'home-controller'
      file = utils.resolveExt p

      (file != null).should.be.true
      file.should.equal(p + '.js')

    it 'should resolve any file', ->
      p = path.join __dirname, 'utils'
      file = utils.resolveExt p, ['coffee','js']

      (file != null).should.be.true
      file.should.equal(p + '.coffee')


  describe 'resolveFile', ->

    it 'should resolve with default suffix', ->
      cp = path.join __dirname, 'fixtures', 'controllers'

      file = utils.resolveFile(cp, 'home')

      (file isnt null).should.be.true
      file.should.equal(path.join(cp,'home-controller.js'))
