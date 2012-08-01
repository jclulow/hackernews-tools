#!/usr/bin/env node

var hardWrap = require('./lib/hardwrap').hardWrap;
var parseStream = require('./lib/parser').parseStream;
var request = require('request');
var assert = require('assert');
var log = console.log;
var $ = require('async');
var pg = require('pg');
var C;
try {
  C = require('./config.json');
} catch (err) {
  log('could not read config: %s', err.message);
  process.exit(1);
}
var VERBOSE = !!process.env.VERBOSE;

Object.keys(C.database).forEach(function(k) {
  pg.defaults[k] = C.database[k];
});

function printComment(p, cb)
{
  log('--------------');
  log('username: %s', p.username);
  log('id: %d      postId: %d', p.id, p.postId);
  log('url: http://news.ycombinator.com/item?id=%d', p.postId);
  log('comment:\n%s', hardWrap(p.comment, 76));
  log();
  return cb();
}

var comments = [];
function processComment(p, cb)
{
  pg.connect(function(err, db) {
    if (err) return cb(err);
    db.query('INSERT INTO items (id, post_id, user_id, json) ' +
      'VALUES ($1, $2, $3, $4)', [ p.id, p.postId, p.username,
      JSON.stringify(p) ], function(err, res) {

        if (err) {
          if (err.code === '23505') {
            // this means we already have an item by that id
            if (VERBOSE)
              log('already seen: comment %d on post %d from %s', p.id,
                p.postId, p.username);
            return cb();
          }
          return cb(err);
        }
        // this comment was new:
        printComment(p, cb);
     });
  });
}

function processUser(user, next)
{
  if (VERBOSE) {
    log('user: ' + user);
    log();
  }
  var url = 'http://news.ycombinator.com/threads?id=' + user;
  var req = request(url);
  parseStream(req, function(err, out) {
    out = out.filter(function(o) { return o.username === user; });
    $.forEachSeries(out, processComment, function(err) {
      if (VERBOSE) log();
      next(err);
    });
  });
}

$.forEachSeries(C.users, processUser, function(err) {
  assert.ifError(err);
  process.exit(0);
});
