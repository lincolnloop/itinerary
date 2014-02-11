/* global describe, it, expect, beforeEach */
'use strict';

var _ = require('underscore');
var Events = require('../lib/events');

describe('Events', function() {

  describe('#on()', function() {
    var obj, callback, context, counter;

    beforeEach(function() {
      obj = _.extend({counter: 0}, Events);
      callback = function() {};
      counter = function() {
        obj.counter += 1;
      };
      context = {};
    });

    it('adds callbacks to an events registry', function() {
      obj.on('event', callback);

      expect(obj).to.have.property('_events');
      expect(Object.keys(obj._events)).to.have.length(1);
      expect(obj._events).to.have.property('event');
      expect(obj._events['event']).to.have.length(1);
      expect(obj._events['event'][0]).to.have.property('callback', callback);
      expect(obj._events['event'][0]).to.have.property('ctx', obj);
      expect(obj._events['event'][0]).not.to.have.property('context');
    });

    it('assigns custom context if provided', function() {
      obj.on('event', function() {}, context);

      expect(obj._events['event'][0]).to.have.property('context', context);
      expect(obj._events['event'][0]).to.have.property('ctx', context);
    });

    it('binds multiple events if provided', function() {
      obj.on('a b c', callback);

      expect(Object.keys(obj._events)).to.have.length(3);
      expect(obj._events).to.have.property('a');
      expect(obj._events['a']).to.have.length(1);
      expect(obj._events['a'][0]).to.have.property('callback', callback);
      expect(obj._events).to.have.property('b');
      expect(obj._events['b']).to.have.length(1);
      expect(obj._events['b'][0]).to.have.property('callback', callback);
      expect(obj._events).to.have.property('c');
      expect(obj._events['c']).to.have.length(1);
      expect(obj._events['c'][0]).to.have.property('callback', callback);
    });

    it('binds from a map of events if provided', function() {
      obj.on({
        'a b': callback,
        'c': callback
      });

      expect(Object.keys(obj._events)).to.have.length(3);
      expect(obj._events).to.have.property('a');
      expect(obj._events).to.have.property('b');
      expect(obj._events).to.have.property('c');
    });

    it('does not alter the callback list during trigger', function() {
      obj.on('event', function() {
        obj.on('event', counter).on('all', counter);
      }).trigger('event');
      expect(obj.counter).to.equal(0);
    });

    it('is a noop when callback is empty or missing', function() {
      expect(function() {
        obj.on('event');
        obj.on('event', null);
        obj.trigger('event');
      }).to.not.throw(Error);
      expect(obj.counter).to.equal(0);
    });

    it('throws an error if the callback is truthy but not a function', function() {
      obj.on('event', 'noop');
      expect(function() {
        obj.trigger('event');
      }).to.throw(Error);
    });

  });

  describe('#once()', function() {
    var obj, otherObj, counterA, counterB;

    beforeEach(function() {
      obj = _.extend({counterA: 0, counterB: 0}, Events);
      otherObj = _.extend({}, Events);
      counterA = function(){
        obj.counterA += 1;
      };
      counterB = function(){
        obj.counterB += 1;
      };
    });

    it('attaches a callback that only executes once', function() {
      obj.once('event', counterA);
      obj.once('event', counterB);
      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      expect(obj.counterA).to.equal(1);
      expect(obj.counterB).to.equal(1);
    });

    it('accepts multiple events', function() {
      obj.once('a b', counterA);
      obj.trigger('a');
      obj.trigger('b');
      obj.trigger('a b');
      expect(obj.counterA).to.equal(2);
    });

    it('is effective even when the callback triggers the event again', function() {
      var callback = function() {
        obj.counterA += 1;
        obj.trigger('event');
      };
      obj.once('event', callback);

      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      expect(obj.counterA).to.equal(1);
    });

    it('accepts event maps', function() {
      obj.once({
        'a': counterA,
        'b': counterA,
        'c': counterA
      });

      obj.trigger('a');
      expect(obj.counterA).to.equal(1);

      obj.trigger('a b');
      expect(obj.counterA).to.equal(2);

      obj.trigger('c');
      expect(obj.counterA).to.equal(3);

      obj.trigger('a b c');
      expect(obj.counterA).to.equal(3);
    });

    it('doesn\'t affect standard binds for the same callback', function() {
      var counter = 0;
      var incr = function() {
        counter += 1;
      };
      obj.once('event', incr);
      otherObj.on('event', incr);

      obj.trigger('event');
      obj.trigger('event');
      expect(counter).to.equal(1);

      otherObj.trigger('event');
      otherObj.trigger('event');
      expect(counter).to.equal(3);
    });

    it('doesn\'t affect standard binds on the same object', function() {
      obj.once('event', counterA);
      obj.on('event', counterA);

      obj.trigger('event');
      expect(obj.counterA).to.equal(2);

      obj.trigger('event');
      expect(obj.counterA).to.equal(3);
    });

    it('is effective with asyncronous events', function(done) {
      obj.once('async', _.debounce(function() {
        counterA();
      }, 5));

      obj.trigger('async');
      _.delay(function() {
        obj.trigger('async');
      }, 10);
      _.delay(function() {
        obj.trigger('async');
      }, 20);
      _.delay(function() {
        expect(obj.counterA).to.equal(1);
        done();
      }, 30);
    });

    it('is a noop when callback is empty or missing', function() {
      expect(function() {
        obj.once('event');
        obj.once('event', null);
        obj.trigger('event');
      }).to.not.throw(Error);
      expect(obj.counterA).to.equal(0);
    });

    it('should work as expected with "all"', function() {
      obj.once('all', counterA);
      obj.trigger('anything');
      obj.trigger('anything');
      obj.trigger('anything');
      expect(obj.counterA).to.equal(1);
    });

  });

  describe('#off()', function() {
    var obj, callback, otherCallback, context, incrAndUnbindA, incrAndUnbindB,
      counterA;

    beforeEach(function() {
      obj = _.extend({counterA: 0, counterB: 0}, Events);
      callback = function() {};
      otherCallback = function() {};
      incrAndUnbindA = function() {
        obj.counterA += 1;
        obj.off('event', incrAndUnbindA);
      };
      incrAndUnbindB = function() {
        obj.counterB += 1;
        obj.off('event', incrAndUnbindB);
      };
      counterA = function() {
        obj.counterA += 1;
      };
      context = {};
    });

    it('removes all callbacks for an event', function() {
      obj.on('event', callback);
      obj.on('event', otherCallback);

      expect(obj._events['event']).to.have.length(2);

      obj.off('event');
      expect(obj._events).not.to.have.property('event');
    });

    it('removes specific callbacks without removing others', function() {
      obj.on('event', callback);
      obj.on('event', otherCallback);

      expect(obj._events['event']).to.have.length(2);

      obj.off('event', callback);
      expect(obj._events['event']).to.have.length(1);
      expect(obj._events['event'][0]).to.have.property('callback', otherCallback);
    });

    it('removes all bindings for a specific callback if no event is provided', function() {
      obj.on('a b', callback);
      expect(obj._events['a']).to.have.length(1);
      expect(obj._events['a'][0]).to.have.property('callback', callback);
      expect(obj._events['b']).to.have.length(1);
      expect(obj._events['b'][0]).to.have.property('callback', callback);

      obj.on('a b', otherCallback);
      expect(obj._events['a']).to.have.length(2);
      expect(obj._events['b']).to.have.length(2);

      obj.off(null, callback);
      expect(obj._events['a']).to.have.length(1);
      expect(obj._events['a'][0]).to.have.property('callback', otherCallback);
      expect(obj._events['b']).to.have.length(1);
      expect(obj._events['b'][0]).to.have.property('callback', otherCallback);
    });

    it('removes all callbacks for multiple events if provided', function() {
      obj.on('a b c', callback);
      obj.on('a b c', otherCallback);

      expect(obj._events['a']).to.have.length(2);
      expect(obj._events['b']).to.have.length(2);
      expect(obj._events['c']).to.have.length(2);

      obj.off('a c');
      expect(obj._events).not.to.have.property('a');
      expect(obj._events['b']).to.have.length(2);
      expect(obj._events).not.to.have.property('c');
    });

    it('removes all callbacks for a specific context', function() {
      obj.on('a b', callback, context);
      expect(obj._events['a']).to.have.length(1);
      expect(obj._events['a'][0]).to.have.property('context', context);
      expect(obj._events['b']).to.have.length(1);
      expect(obj._events['b'][0]).to.have.property('context', context);

      obj.on('a b', otherCallback);
      expect(obj._events['a']).to.have.length(2);
      expect(obj._events['b']).to.have.length(2);

      obj.off(null, null, context);
      expect(obj._events['a']).to.have.length(1);
      expect(obj._events['a'][0]).not.to.have.property('context');
      expect(obj._events['b']).to.have.length(1);
      expect(obj._events['b'][0]).not.to.have.property('context');
    });

    it('does not skip consecutive events', function() {
      obj.on('event', callback, context);
      obj.on('event', callback, context);
      expect(obj._events['event']).to.have.length(2);
      obj.off(null, null, context);
      expect(obj._events).not.to.have.property('event');
    });

    it('removes a callback in the midst of it firing', function() {
      obj.on('event', incrAndUnbindA);
      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      expect(obj.counterA).to.equal(1);
    });

    it('can handle two binds that unbind themselves', function() {
      obj.on('event', incrAndUnbindA);
      obj.on('event', incrAndUnbindB);
      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      expect(obj.counterA).to.equal(1);
      expect(obj.counterB).to.equal(1);
    });

    it('can handle a nested trigger with an unbind', function() {
      var nestedTriggerUnbind = function() {
        obj.counterA += 1;
        obj.off('event', nestedTriggerUnbind);
        obj.trigger('event');
      };
      var noTriggerUnbind = function() {
        obj.counterA += 1;
      };

      obj.on('event', nestedTriggerUnbind);
      obj.on('event', noTriggerUnbind);
      obj.trigger('event');
      expect(obj.counterA).to.equal(3);
    });

    it('does not alter the callback list during trigger', function() {
      obj.on('event', function(){
        obj.off('event', counterA).off('all', counterA);
      });
      obj.on('event', counterA);
      obj.on('all', counterA);
      obj.trigger('event');
      expect(obj.counterA).to.equal(2);
    });

    it('removes callbacks wrapped with the "once" modifier', function() {
      obj.once('event', callback);
      expect(obj._events['event']).to.have.length(1);

      obj.off('event');
      expect(obj._events).not.to.have.property('event');
    });

    it('removes "once" callbacks by context', function() {
      obj.once('event', callback, context);
      expect(obj._events['event']).to.have.length(1);
      expect(obj._events['event'][0]).to.have.property('context', context);

      obj.off(null, null, context);
      expect(obj._events).not.to.have.property('event');
    });

    it('removes callbacks during iteration with "once"', function() {
      var unbind = function() {
        this.off('event', unbind);
      };
      obj.on('event', unbind);
      obj.once('event', callback);
      obj.on('event', counterA);

      obj.trigger('event');
      obj.trigger('event');

      expect(obj.counterA).to.equal(2);
    });

  });

  describe('#trigger()', function() {
    var obj, counter;

    beforeEach(function() {
      obj = _.extend({counter: 0}, Events);
      counter = function() {
        obj.counter += 1;
      };
    });

    it('triggers an event, firing all bound callbacks', function() {
      obj.on('event', counter);

      obj.trigger('event');
      expect(obj.counter).to.equal(1);
      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      obj.trigger('event');
      expect(obj.counter).to.equal(5);
    });

    it('triggers multiple events if provided', function() {
      obj.on('a b c', counter);

      obj.trigger('a');
      expect(obj.counter).to.equal(1);

      obj.trigger('a b');
      expect(obj.counter).to.equal(3);

      obj.trigger('c');
      expect(obj.counter).to.equal(4);

      obj.off('a c');
      obj.trigger('a b c');
      expect(obj.counter).to.equal(5);
    });

    it('executes callbacks for "all" when any event is triggered', function() {
      var a, b;

      obj.on('all', function(event) {
        obj.counter++;
        if (event === 'a') a = true;
        if (event === 'b') b = true;
      });

      obj.trigger('a b');
      expect(a).to.be.true;
      expect(b).to.be.true;
      expect(obj.counter).to.equal(2);
    });

    it('executes "all" callbacks for each event when multiple events are triggered', function() {
      obj.on('x', function() {
        obj.on('y', counter).on('all', counter);
      });
      obj.trigger('x y');
      expect(obj.counter).to.equal(2);
    });

  });

  describe('#listenTo()', function() {
    var a, b, callback;

    beforeEach(function() {
      a = _.extend({}, Events);
      b = _.extend({}, Events);
      callback = function() {};
    });

    it('allows an object to assign callbacks for another object\'s events', function() {
      a.listenTo(b, 'event', callback);
      expect(b._events['event']).to.have.length(1);
      expect(b._events['event'][0]).to.have.property('callback', callback);
      expect(b._events['event'][0]).to.have.property('ctx', a);
      expect(b._events['event'][0]).to.have.property('context', a);
    });

    it('assigns callbacks from an event map', function() {
      a.listenTo(b, {
        'a c': callback,
        'b': callback
      });

      expect(Object.keys(b._events)).to.have.length(3);
      expect(b._events).to.have.property('a');
      expect(b._events).to.have.property('b');
      expect(b._events).to.have.property('c');
    });

    it('will allow an object to listen to itself, if desired', function() {
      a.listenTo(a, 'event', callback);
      expect(a._events['event']).to.have.length(1);
      expect(a._events['event'][0]).to.have.property('callback', callback);
      expect(a._events['event'][0]).to.have.property('ctx', a);
      expect(a._events['event'][0]).to.have.property('context', a);
    });

    it('can accept an empty or missing callback', function() {
      expect(function() {
        a.listenTo(b, 'foo');
        a.listenTo(b, 'foo', null);
        b.trigger('foo');
      }).to.not.throw(Error);
    });

  });

  describe('#listenToOnce()', function() {
    var a, b, counter;

    beforeEach(function() {
      a = _.extend({counter: 0}, Events);
      b = _.extend({}, Events);
      counter = function() {
        a.counter += 1;
      };
    });

    it('assigns a callback for another object that will only be triggered once', function() {
      a.listenTo(b, 'event', counter);
      expect(b._events['event']).to.have.length(1);
      b.trigger('event');
      expect(a.counter).to.equal(1);
      b.trigger('event');
      b.trigger('event');
      b.trigger('event');
      b.trigger('event');
      expect(a.counter).to.equal(5);
    });

  });

  describe('#stopListening()', function() {
    var a, b, c;
    var callback = function() {};
    var otherCallback = function() {};

    beforeEach(function() {
      a = _.extend({}, Events);
      b = _.extend({}, Events);
      c = _.extend({}, Events);
    });

    it('removes callbacks for another object\'s events', function() {
      a.listenTo(b, 'event', callback);
      a.listenTo(b, 'event', otherCallback);
      expect(b._events['event']).to.have.length(2);

      a.stopListening(b, 'event', callback);
      expect(b._events['event']).to.have.length(1);

      a.stopListening(b, 'event', otherCallback);
      expect(b._events).not.to.have.property('event');
    });

    it('removes callbacks from an event map', function() {
      a.listenTo(b, {
        'a c': callback,
        'b': callback
      });
      expect(Object.keys(b._events)).to.have.length(3);

      a.stopListening(b, {
        'a': callback,
        'b': callback
      });

      expect(Object.keys(b._events)).to.have.length(1);
      expect(b._events).to.have.property('c');
    });

    it('removes all callbacks if one is not specified', function() {
      a.listenTo(b, 'event', callback);
      a.listenTo(b, 'event', otherCallback);
      expect(b._events['event']).to.have.length(2);

      a.stopListening(b, 'event');
      expect(b._events).not.to.have.property('event');
    });

    it('removes a callback from every associated object if none is specified', function() {
      a.listenTo(b, 'event', callback);
      a.listenTo(b, {'event': otherCallback});
      a.listenToOnce(c, 'event', callback);
      expect(b._events['event']).to.have.length(2);
      expect(c._events['event']).to.have.length(1);

      a.stopListening(null, 'event', callback);
      expect(b._events['event']).to.have.length(1);
      expect(c._events).not.to.have.property('event');
    });

    it('removes all callbacks from every associated object if there are no arguments', function() {
      a.listenTo(b, 'event', callback);
      a.listenTo(b, {'event': otherCallback});
      a.listenToOnce(c, 'event', callback);
      expect(b._events['event']).to.have.length(2);
      expect(c._events['event']).to.have.length(1);

      a.stopListening();
      expect(b._events).not.to.have.property('event');
      expect(c._events).not.to.have.property('event');
    });

    it('removes callbacks for itself, if desired', function() {
      a.listenTo(a, 'event', callback);
      a.listenTo(a, 'event', otherCallback);
      expect(a._events['event']).to.have.length(2);

      a.stopListening(a, 'event', callback);
      expect(a._events['event']).to.have.length(1);

      a.stopListening(a, 'event', otherCallback);
      expect(a._events).not.to.have.property('event');
    });

    it('cleans up references', function() {
      a.listenTo(b, 'all', callback).stopListening();
      expect(_.size(a._listeningTo)).to.equal(0);
      a.listenTo(b, 'all', callback).stopListening(b);
      expect(_.size(a._listeningTo)).to.equal(0);
      a.listenTo(b, 'all', callback).stopListening(null, 'all');
      expect(_.size(a._listeningTo)).to.equal(0);
      a.listenTo(b, 'all', callback).stopListening(null, null, callback);
      expect(_.size(a._listeningTo)).to.equal(0);
    });

    it('cleans up references even after an event is triggered', function() {
      a.listenTo(b, 'all', callback);
      b.trigger('anything');
      a.listenTo(b, 'other', callback);
      a.stopListening(b, 'other');
      a.stopListening(b, 'all');
      expect(_.keys(a._listeningTo).length).to.equal(0);
    });

  });

  describe('(misc)', function() {
    var a, b;
    var callback = function() {};

    beforeEach(function() {
      a = _.extend({}, Events);
      b = _.extend({}, Events);
    });

    it('has chainable functions', function() {
      expect(a).to.equal(a.trigger('noeventssetyet'));
      expect(a).to.equal(a.off('noeventssetyet'));
      expect(a).to.equal(a.off('noeventssetyet'));
      expect(a).to.equal(a.stopListening('noeventssetyet'));
      expect(a).to.equal(a.on('a', callback));
      expect(a).to.equal(a.once('c', callback));
      expect(a).to.equal(a.trigger('a'));
      expect(a).to.equal(a.listenTo(b, 'a', callback));
      expect(a).to.equal(a.listenToOnce(b, 'b', callback));
      expect(a).to.equal(a.off('a c'));
      expect(a).to.equal(a.stopListening(b, 'a'));
      expect(a).to.equal(a.stopListening());
    });

  });

});
