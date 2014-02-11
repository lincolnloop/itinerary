'use strict';

var _ = require('underscore');

var arrayNext = function (array, currentItem) {
  var len = array.length;
  var newIndex = array.indexOf(currentItem) + 1;
  if (newIndex > (len - 1)) newIndex = 0;
  return array[newIndex];
};

var createDerivedProperty = function (modelProto, name, definition) {
  var def = modelProto._derived[name] = {
    fn: _.isFunction(definition) ? definition : definition.fn,
    cache: (definition.cache !== false),
    depList: definition.deps || []
  };

  // add to our shared dependency list
  _.each(def.depList, function (dep) {
    modelProto._deps[dep] = _(modelProto._deps[dep] || []).union([name]);
  });

  // defined a top-level getter for derived names
  Object.defineProperty(modelProto, name, {
    get: function () {
      return this._getDerivedProperty(name);
    },
    set: function () {
      throw new TypeError('"' + name + '" is a derived property, it can\'t be set directly.');
    }
  });
};

// Wrap an optional error callback with a fallback error event.
var wrapError = function (model, options) {
  var error = options.error;
  options.error = function (resp) {
    if (error) error(model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

// Throw an error when a URL is needed, and none is supplied.
var urlError = function () {
  throw new Error('A "url" property or function must be specified');
};


exports.arrayNext = arrayNext;
exports.createDerivedProperty = createDerivedProperty;
exports.wrapError = wrapError;
exports.urlError = urlError;
