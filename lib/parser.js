#!/usr/bin/env node

var sax = require('sax');
var util = require('util');
var log = console.log;
var ins = util.inspect;
var assert = require('assert');
//var hardWrap = require('./hardwrap').hardWrap;

//var f = fs.createReadStream('/tmp/bmc.html');

function parseStream(stream, done)
{
  var ss = sax.createStream(false);

  var out = [];

  var comhead = false;
  var comment = false;
  var cstr = '';
  var itemreg = null;
  var hrefreg = null;

  var post = null;
  var item = null;
  var user = null;

  ss.on('opentag', function(tag) {
    if (tag.name === 'SPAN') {
      var clazz = tag.attributes.CLASS;
      if (clazz === 'comhead')
        comhead = true;
      else if (clazz === 'comment')
        comment = true;
    } else if (comment) {
      if (tag.name === 'P')
        cstr += '\n\n';
      else if (tag.name === 'I')
        cstr += '_';
      else if (tag.name === 'B')
        cstr += '*';
      else if (tag.name === 'A')
        hrefreg = tag.attributes.HREF;
    } else if (comhead) {
      if (tag.name === 'A') {
        var m;
        var href = tag.attributes.HREF;
        if (m = href.match(/^user\?id=(.*)$/)) {
          //log('USER:   ' + m[1]);
          user = m[1];
        } else if (m = href.match(/^item\?id=(.*)$/)) {
          itemreg = m[1];
        }
      }
    }
  });

  ss.on('closetag', function(tag) {
    if (comment) {
      if (tag === 'A')
        hrefreg = null;
      else if (tag === 'I')
        cstr += '_';
      else if (tag === 'B')
        cstr += '*';
      else if (tag === 'SPAN') {
        comment = false;
        assert.ok(parent);
        assert.ok(post);
        assert.ok(item);
        assert.ok(user);
        out.push({
          parentId: parent,
          postId: post,
          username: user,
          id: item,
          comment: cstr
        });
        parent = item;
        item = null;
        user = null;
        cstr = '';
      }
    } else if (comhead && tag === 'SPAN') {
      comhead = false;
    }
  });

  ss.on('text', function(text) {
    if (comhead && itemreg) {
      var tt = text.trim().toLowerCase();
      if (tt === 'parent')
        parent = itemreg;
      else if (tt === 'link')
        item = itemreg;
      else {
        post = itemreg;
      }
      itemreg = null;
    }
    else if (comment) {
      if (cstr)
        cstr += ' ';
      if (hrefreg) {
        cstr += hrefreg;
      } else {
        cstr += text.replace(/\n/g, ' ').trim();
      }
    }
  });

  ss.on('end', function() {
    done(null, out);
    out = null;
  });

  stream.pipe(ss);
}

module.exports = {
  parseStream: parseStream
};
