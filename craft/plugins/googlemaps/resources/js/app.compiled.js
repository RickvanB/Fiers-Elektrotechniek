//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

// Backbone.Wreqr (Backbone.Marionette)
// ----------------------------------
// v1.3.1
//
// Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://github.com/marionettejs/backbone.wreqr


(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore'], function(Backbone, _) {
      return factory(Backbone, _);
    });
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    module.exports = factory(Backbone, _);
  } else {
    factory(root.Backbone, root._);
  }

}(this, function(Backbone, _) {
  "use strict";

  var previousWreqr = Backbone.Wreqr;

  var Wreqr = Backbone.Wreqr = {};

  Backbone.Wreqr.VERSION = '1.3.1';

  Backbone.Wreqr.noConflict = function () {
    Backbone.Wreqr = previousWreqr;
    return this;
  };

  // Handlers
  // --------
  // A registry of functions to call, given a name
  
  Wreqr.Handlers = (function(Backbone, _){
    "use strict";
    
    // Constructor
    // -----------
  
    var Handlers = function(options){
      this.options = options;
      this._wreqrHandlers = {};
      
      if (_.isFunction(this.initialize)){
        this.initialize(options);
      }
    };
  
    Handlers.extend = Backbone.Model.extend;
  
    // Instance Members
    // ----------------
  
    _.extend(Handlers.prototype, Backbone.Events, {
  
      // Add multiple handlers using an object literal configuration
      setHandlers: function(handlers){
        _.each(handlers, function(handler, name){
          var context = null;
  
          if (_.isObject(handler) && !_.isFunction(handler)){
            context = handler.context;
            handler = handler.callback;
          }
  
          this.setHandler(name, handler, context);
        }, this);
      },
  
      // Add a handler for the given name, with an
      // optional context to run the handler within
      setHandler: function(name, handler, context){
        var config = {
          callback: handler,
          context: context
        };
  
        this._wreqrHandlers[name] = config;
  
        this.trigger("handler:add", name, handler, context);
      },
  
      // Determine whether or not a handler is registered
      hasHandler: function(name){
        return !! this._wreqrHandlers[name];
      },
  
      // Get the currently registered handler for
      // the specified name. Throws an exception if
      // no handler is found.
      getHandler: function(name){
        var config = this._wreqrHandlers[name];
  
        if (!config){
          return;
        }
  
        return function(){
          var args = Array.prototype.slice.apply(arguments);
          return config.callback.apply(config.context, args);
        };
      },
  
      // Remove a handler for the specified name
      removeHandler: function(name){
        delete this._wreqrHandlers[name];
      },
  
      // Remove all handlers from this registry
      removeAllHandlers: function(){
        this._wreqrHandlers = {};
      }
    });
  
    return Handlers;
  })(Backbone, _);
  
  // Wreqr.CommandStorage
  // --------------------
  //
  // Store and retrieve commands for execution.
  Wreqr.CommandStorage = (function(){
    "use strict";
  
    // Constructor function
    var CommandStorage = function(options){
      this.options = options;
      this._commands = {};
  
      if (_.isFunction(this.initialize)){
        this.initialize(options);
      }
    };
  
    // Instance methods
    _.extend(CommandStorage.prototype, Backbone.Events, {
  
      // Get an object literal by command name, that contains
      // the `commandName` and the `instances` of all commands
      // represented as an array of arguments to process
      getCommands: function(commandName){
        var commands = this._commands[commandName];
  
        // we don't have it, so add it
        if (!commands){
  
          // build the configuration
          commands = {
            command: commandName, 
            instances: []
          };
  
          // store it
          this._commands[commandName] = commands;
        }
  
        return commands;
      },
  
      // Add a command by name, to the storage and store the
      // args for the command
      addCommand: function(commandName, args){
        var command = this.getCommands(commandName);
        command.instances.push(args);
      },
  
      // Clear all commands for the given `commandName`
      clearCommands: function(commandName){
        var command = this.getCommands(commandName);
        command.instances = [];
      }
    });
  
    return CommandStorage;
  })();
  
  // Wreqr.Commands
  // --------------
  //
  // A simple command pattern implementation. Register a command
  // handler and execute it.
  Wreqr.Commands = (function(Wreqr){
    "use strict";
  
    return Wreqr.Handlers.extend({
      // default storage type
      storageType: Wreqr.CommandStorage,
  
      constructor: function(options){
        this.options = options || {};
  
        this._initializeStorage(this.options);
        this.on("handler:add", this._executeCommands, this);
  
        var args = Array.prototype.slice.call(arguments);
        Wreqr.Handlers.prototype.constructor.apply(this, args);
      },
  
      // Execute a named command with the supplied args
      execute: function(name, args){
        name = arguments[0];
        args = Array.prototype.slice.call(arguments, 1);
  
        if (this.hasHandler(name)){
          this.getHandler(name).apply(this, args);
        } else {
          this.storage.addCommand(name, args);
        }
  
      },
  
      // Internal method to handle bulk execution of stored commands
      _executeCommands: function(name, handler, context){
        var command = this.storage.getCommands(name);
  
        // loop through and execute all the stored command instances
        _.each(command.instances, function(args){
          handler.apply(context, args);
        });
  
        this.storage.clearCommands(name);
      },
  
      // Internal method to initialize storage either from the type's
      // `storageType` or the instance `options.storageType`.
      _initializeStorage: function(options){
        var storage;
  
        var StorageType = options.storageType || this.storageType;
        if (_.isFunction(StorageType)){
          storage = new StorageType();
        } else {
          storage = StorageType;
        }
  
        this.storage = storage;
      }
    });
  
  })(Wreqr);
  
  // Wreqr.RequestResponse
  // ---------------------
  //
  // A simple request/response implementation. Register a
  // request handler, and return a response from it
  Wreqr.RequestResponse = (function(Wreqr){
    "use strict";
  
    return Wreqr.Handlers.extend({
      request: function(){
        var name = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);
        if (this.hasHandler(name)) {
          return this.getHandler(name).apply(this, args);
        }
      }
    });
  
  })(Wreqr);
  
  // Event Aggregator
  // ----------------
  // A pub-sub object that can be used to decouple various parts
  // of an application through event-driven architecture.
  
  Wreqr.EventAggregator = (function(Backbone, _){
    "use strict";
    var EA = function(){};
  
    // Copy the `extend` function used by Backbone's classes
    EA.extend = Backbone.Model.extend;
  
    // Copy the basic Backbone.Events on to the event aggregator
    _.extend(EA.prototype, Backbone.Events);
  
    return EA;
  })(Backbone, _);
  
  // Wreqr.Channel
  // --------------
  //
  // An object that wraps the three messaging systems:
  // EventAggregator, RequestResponse, Commands
  Wreqr.Channel = (function(Wreqr){
    "use strict";
  
    var Channel = function(channelName) {
      this.vent        = new Backbone.Wreqr.EventAggregator();
      this.reqres      = new Backbone.Wreqr.RequestResponse();
      this.commands    = new Backbone.Wreqr.Commands();
      this.channelName = channelName;
    };
  
    _.extend(Channel.prototype, {
  
      // Remove all handlers from the messaging systems of this channel
      reset: function() {
        this.vent.off();
        this.vent.stopListening();
        this.reqres.removeAllHandlers();
        this.commands.removeAllHandlers();
        return this;
      },
  
      // Connect a hash of events; one for each messaging system
      connectEvents: function(hash, context) {
        this._connect('vent', hash, context);
        return this;
      },
  
      connectCommands: function(hash, context) {
        this._connect('commands', hash, context);
        return this;
      },
  
      connectRequests: function(hash, context) {
        this._connect('reqres', hash, context);
        return this;
      },
  
      // Attach the handlers to a given message system `type`
      _connect: function(type, hash, context) {
        if (!hash) {
          return;
        }
  
        context = context || this;
        var method = (type === 'vent') ? 'on' : 'setHandler';
  
        _.each(hash, function(fn, eventName) {
          this[type][method](eventName, _.bind(fn, context));
        }, this);
      }
    });
  
  
    return Channel;
  })(Wreqr);
  
  // Wreqr.Radio
  // --------------
  //
  // An object that lets you communicate with many channels.
  Wreqr.radio = (function(Wreqr){
    "use strict";
  
    var Radio = function() {
      this._channels = {};
      this.vent = {};
      this.commands = {};
      this.reqres = {};
      this._proxyMethods();
    };
  
    _.extend(Radio.prototype, {
  
      channel: function(channelName) {
        if (!channelName) {
          throw new Error('Channel must receive a name');
        }
  
        return this._getChannel( channelName );
      },
  
      _getChannel: function(channelName) {
        var channel = this._channels[channelName];
  
        if(!channel) {
          channel = new Wreqr.Channel(channelName);
          this._channels[channelName] = channel;
        }
  
        return channel;
      },
  
      _proxyMethods: function() {
        _.each(['vent', 'commands', 'reqres'], function(system) {
          _.each( messageSystems[system], function(method) {
            this[system][method] = proxyMethod(this, system, method);
          }, this);
        }, this);
      }
    });
  
  
    var messageSystems = {
      vent: [
        'on',
        'off',
        'trigger',
        'once',
        'stopListening',
        'listenTo',
        'listenToOnce'
      ],
  
      commands: [
        'execute',
        'setHandler',
        'setHandlers',
        'removeHandler',
        'removeAllHandlers'
      ],
  
      reqres: [
        'request',
        'setHandler',
        'setHandlers',
        'removeHandler',
        'removeAllHandlers'
      ]
    };
  
    var proxyMethod = function(radio, system, method) {
      return function(channelName) {
        var messageSystem = radio._getChannel(channelName)[system];
        var args = Array.prototype.slice.call(arguments, 1);
  
        return messageSystem[method].apply(messageSystem, args);
      };
    };
  
    return new Radio();
  
  })(Wreqr);
  

  return Backbone.Wreqr;

}));

// Backbone.BabySitter
// -------------------
// v0.1.4
//
// Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://github.com/marionettejs/backbone.babysitter

(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore'], function(Backbone, _) {
      return factory(Backbone, _);
    });
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    module.exports = factory(Backbone, _);
  } else {
    factory(root.Backbone, root._);
  }

}(this, function(Backbone, _) {
  'use strict';

  var previousChildViewContainer = Backbone.ChildViewContainer;

  // BabySitter.ChildViewContainer
  // -----------------------------
  //
  // Provide a container to store, retrieve and
  // shut down child views.
  
  Backbone.ChildViewContainer = (function (Backbone, _) {
  
    // Container Constructor
    // ---------------------
  
    var Container = function(views){
      this._views = {};
      this._indexByModel = {};
      this._indexByCustom = {};
      this._updateLength();
  
      _.each(views, this.add, this);
    };
  
    // Container Methods
    // -----------------
  
    _.extend(Container.prototype, {
  
      // Add a view to this container. Stores the view
      // by `cid` and makes it searchable by the model
      // cid (and model itself). Optionally specify
      // a custom key to store an retrieve the view.
      add: function(view, customIndex){
        var viewCid = view.cid;
  
        // store the view
        this._views[viewCid] = view;
  
        // index it by model
        if (view.model){
          this._indexByModel[view.model.cid] = viewCid;
        }
  
        // index by custom
        if (customIndex){
          this._indexByCustom[customIndex] = viewCid;
        }
  
        this._updateLength();
        return this;
      },
  
      // Find a view by the model that was attached to
      // it. Uses the model's `cid` to find it.
      findByModel: function(model){
        return this.findByModelCid(model.cid);
      },
  
      // Find a view by the `cid` of the model that was attached to
      // it. Uses the model's `cid` to find the view `cid` and
      // retrieve the view using it.
      findByModelCid: function(modelCid){
        var viewCid = this._indexByModel[modelCid];
        return this.findByCid(viewCid);
      },
  
      // Find a view by a custom indexer.
      findByCustom: function(index){
        var viewCid = this._indexByCustom[index];
        return this.findByCid(viewCid);
      },
  
      // Find by index. This is not guaranteed to be a
      // stable index.
      findByIndex: function(index){
        return _.values(this._views)[index];
      },
  
      // retrieve a view by its `cid` directly
      findByCid: function(cid){
        return this._views[cid];
      },
  
      // Remove a view
      remove: function(view){
        var viewCid = view.cid;
  
        // delete model index
        if (view.model){
          delete this._indexByModel[view.model.cid];
        }
  
        // delete custom index
        _.any(this._indexByCustom, function(cid, key) {
          if (cid === viewCid) {
            delete this._indexByCustom[key];
            return true;
          }
        }, this);
  
        // remove the view from the container
        delete this._views[viewCid];
  
        // update the length
        this._updateLength();
        return this;
      },
  
      // Call a method on every view in the container,
      // passing parameters to the call method one at a
      // time, like `function.call`.
      call: function(method){
        this.apply(method, _.tail(arguments));
      },
  
      // Apply a method on every view in the container,
      // passing parameters to the call method one at a
      // time, like `function.apply`.
      apply: function(method, args){
        _.each(this._views, function(view){
          if (_.isFunction(view[method])){
            view[method].apply(view, args || []);
          }
        });
      },
  
      // Update the `.length` attribute on this container
      _updateLength: function(){
        this.length = _.size(this._views);
      }
    });
  
    // Borrowing this code from Backbone.Collection:
    // http://backbonejs.org/docs/backbone.html#section-106
    //
    // Mix in methods from Underscore, for iteration, and other
    // collection related features.
    var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
      'select', 'reject', 'every', 'all', 'some', 'any', 'include',
      'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
      'last', 'without', 'isEmpty', 'pluck'];
  
    _.each(methods, function(method) {
      Container.prototype[method] = function() {
        var views = _.values(this._views);
        var args = [views].concat(_.toArray(arguments));
        return _[method].apply(_, args);
      };
    });
  
    // return the public API
    return Container;
  })(Backbone, _);
  

  Backbone.ChildViewContainer.VERSION = '0.1.4';

  Backbone.ChildViewContainer.noConflict = function () {
    Backbone.ChildViewContainer = previousChildViewContainer;
    return this;
  };

  return Backbone.ChildViewContainer;

}));

// MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v2.0.2
//
// Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://marionettejs.com


/*!
 * Includes BabySitter
 * https://github.com/marionettejs/backbone.babysitter/
 *
 * Includes Wreqr
 * https://github.com/marionettejs/backbone.wreqr/
 */


(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore'], function(Backbone, _) {
      return (root.Marionette = factory(root, Backbone, _));
    });
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    module.exports = factory(root, Backbone, _);
  } else {
    root.Marionette = factory(root, root.Backbone, root._);
  }

}(this, function(root, Backbone, _) {
  'use strict';

  // Backbone.BabySitter
  // -------------------
  // v0.1.4
  //
  // Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
  // Distributed under MIT license
  //
  // http://github.com/marionettejs/backbone.babysitter
  (function(Backbone, _) {
    "use strict";
    var previousChildViewContainer = Backbone.ChildViewContainer;
    // BabySitter.ChildViewContainer
    // -----------------------------
    //
    // Provide a container to store, retrieve and
    // shut down child views.
    Backbone.ChildViewContainer = function(Backbone, _) {
      // Container Constructor
      // ---------------------
      var Container = function(views) {
        this._views = {};
        this._indexByModel = {};
        this._indexByCustom = {};
        this._updateLength();
        _.each(views, this.add, this);
      };
      // Container Methods
      // -----------------
      _.extend(Container.prototype, {
        // Add a view to this container. Stores the view
        // by `cid` and makes it searchable by the model
        // cid (and model itself). Optionally specify
        // a custom key to store an retrieve the view.
        add: function(view, customIndex) {
          var viewCid = view.cid;
          // store the view
          this._views[viewCid] = view;
          // index it by model
          if (view.model) {
            this._indexByModel[view.model.cid] = viewCid;
          }
          // index by custom
          if (customIndex) {
            this._indexByCustom[customIndex] = viewCid;
          }
          this._updateLength();
          return this;
        },
        // Find a view by the model that was attached to
        // it. Uses the model's `cid` to find it.
        findByModel: function(model) {
          return this.findByModelCid(model.cid);
        },
        // Find a view by the `cid` of the model that was attached to
        // it. Uses the model's `cid` to find the view `cid` and
        // retrieve the view using it.
        findByModelCid: function(modelCid) {
          var viewCid = this._indexByModel[modelCid];
          return this.findByCid(viewCid);
        },
        // Find a view by a custom indexer.
        findByCustom: function(index) {
          var viewCid = this._indexByCustom[index];
          return this.findByCid(viewCid);
        },
        // Find by index. This is not guaranteed to be a
        // stable index.
        findByIndex: function(index) {
          return _.values(this._views)[index];
        },
        // retrieve a view by its `cid` directly
        findByCid: function(cid) {
          return this._views[cid];
        },
        // Remove a view
        remove: function(view) {
          var viewCid = view.cid;
          // delete model index
          if (view.model) {
            delete this._indexByModel[view.model.cid];
          }
          // delete custom index
          _.any(this._indexByCustom, function(cid, key) {
            if (cid === viewCid) {
              delete this._indexByCustom[key];
              return true;
            }
          }, this);
          // remove the view from the container
          delete this._views[viewCid];
          // update the length
          this._updateLength();
          return this;
        },
        // Call a method on every view in the container,
        // passing parameters to the call method one at a
        // time, like `function.call`.
        call: function(method) {
          this.apply(method, _.tail(arguments));
        },
        // Apply a method on every view in the container,
        // passing parameters to the call method one at a
        // time, like `function.apply`.
        apply: function(method, args) {
          _.each(this._views, function(view) {
            if (_.isFunction(view[method])) {
              view[method].apply(view, args || []);
            }
          });
        },
        // Update the `.length` attribute on this container
        _updateLength: function() {
          this.length = _.size(this._views);
        }
      });
      // Borrowing this code from Backbone.Collection:
      // http://backbonejs.org/docs/backbone.html#section-106
      //
      // Mix in methods from Underscore, for iteration, and other
      // collection related features.
      var methods = [ "forEach", "each", "map", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "toArray", "first", "initial", "rest", "last", "without", "isEmpty", "pluck" ];
      _.each(methods, function(method) {
        Container.prototype[method] = function() {
          var views = _.values(this._views);
          var args = [ views ].concat(_.toArray(arguments));
          return _[method].apply(_, args);
        };
      });
      // return the public API
      return Container;
    }(Backbone, _);
    Backbone.ChildViewContainer.VERSION = "0.1.4";
    Backbone.ChildViewContainer.noConflict = function() {
      Backbone.ChildViewContainer = previousChildViewContainer;
      return this;
    };
    return Backbone.ChildViewContainer;
  })(Backbone, _);
  // Backbone.Wreqr (Backbone.Marionette)
  // ----------------------------------
  // v1.3.1
  //
  // Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
  // Distributed under MIT license
  //
  // http://github.com/marionettejs/backbone.wreqr
  (function(Backbone, _) {
    "use strict";
    var previousWreqr = Backbone.Wreqr;
    var Wreqr = Backbone.Wreqr = {};
    Backbone.Wreqr.VERSION = "1.3.1";
    Backbone.Wreqr.noConflict = function() {
      Backbone.Wreqr = previousWreqr;
      return this;
    };
    // Handlers
    // --------
    // A registry of functions to call, given a name
    Wreqr.Handlers = function(Backbone, _) {
      "use strict";
      // Constructor
      // -----------
      var Handlers = function(options) {
        this.options = options;
        this._wreqrHandlers = {};
        if (_.isFunction(this.initialize)) {
          this.initialize(options);
        }
      };
      Handlers.extend = Backbone.Model.extend;
      // Instance Members
      // ----------------
      _.extend(Handlers.prototype, Backbone.Events, {
        // Add multiple handlers using an object literal configuration
        setHandlers: function(handlers) {
          _.each(handlers, function(handler, name) {
            var context = null;
            if (_.isObject(handler) && !_.isFunction(handler)) {
              context = handler.context;
              handler = handler.callback;
            }
            this.setHandler(name, handler, context);
          }, this);
        },
        // Add a handler for the given name, with an
        // optional context to run the handler within
        setHandler: function(name, handler, context) {
          var config = {
            callback: handler,
            context: context
          };
          this._wreqrHandlers[name] = config;
          this.trigger("handler:add", name, handler, context);
        },
        // Determine whether or not a handler is registered
        hasHandler: function(name) {
          return !!this._wreqrHandlers[name];
        },
        // Get the currently registered handler for
        // the specified name. Throws an exception if
        // no handler is found.
        getHandler: function(name) {
          var config = this._wreqrHandlers[name];
          if (!config) {
            return;
          }
          return function() {
            var args = Array.prototype.slice.apply(arguments);
            return config.callback.apply(config.context, args);
          };
        },
        // Remove a handler for the specified name
        removeHandler: function(name) {
          delete this._wreqrHandlers[name];
        },
        // Remove all handlers from this registry
        removeAllHandlers: function() {
          this._wreqrHandlers = {};
        }
      });
      return Handlers;
    }(Backbone, _);
    // Wreqr.CommandStorage
    // --------------------
    //
    // Store and retrieve commands for execution.
    Wreqr.CommandStorage = function() {
      "use strict";
      // Constructor function
      var CommandStorage = function(options) {
        this.options = options;
        this._commands = {};
        if (_.isFunction(this.initialize)) {
          this.initialize(options);
        }
      };
      // Instance methods
      _.extend(CommandStorage.prototype, Backbone.Events, {
        // Get an object literal by command name, that contains
        // the `commandName` and the `instances` of all commands
        // represented as an array of arguments to process
        getCommands: function(commandName) {
          var commands = this._commands[commandName];
          // we don't have it, so add it
          if (!commands) {
            // build the configuration
            commands = {
              command: commandName,
              instances: []
            };
            // store it
            this._commands[commandName] = commands;
          }
          return commands;
        },
        // Add a command by name, to the storage and store the
        // args for the command
        addCommand: function(commandName, args) {
          var command = this.getCommands(commandName);
          command.instances.push(args);
        },
        // Clear all commands for the given `commandName`
        clearCommands: function(commandName) {
          var command = this.getCommands(commandName);
          command.instances = [];
        }
      });
      return CommandStorage;
    }();
    // Wreqr.Commands
    // --------------
    //
    // A simple command pattern implementation. Register a command
    // handler and execute it.
    Wreqr.Commands = function(Wreqr) {
      "use strict";
      return Wreqr.Handlers.extend({
        // default storage type
        storageType: Wreqr.CommandStorage,
        constructor: function(options) {
          this.options = options || {};
          this._initializeStorage(this.options);
          this.on("handler:add", this._executeCommands, this);
          var args = Array.prototype.slice.call(arguments);
          Wreqr.Handlers.prototype.constructor.apply(this, args);
        },
        // Execute a named command with the supplied args
        execute: function(name, args) {
          name = arguments[0];
          args = Array.prototype.slice.call(arguments, 1);
          if (this.hasHandler(name)) {
            this.getHandler(name).apply(this, args);
          } else {
            this.storage.addCommand(name, args);
          }
        },
        // Internal method to handle bulk execution of stored commands
        _executeCommands: function(name, handler, context) {
          var command = this.storage.getCommands(name);
          // loop through and execute all the stored command instances
          _.each(command.instances, function(args) {
            handler.apply(context, args);
          });
          this.storage.clearCommands(name);
        },
        // Internal method to initialize storage either from the type's
        // `storageType` or the instance `options.storageType`.
        _initializeStorage: function(options) {
          var storage;
          var StorageType = options.storageType || this.storageType;
          if (_.isFunction(StorageType)) {
            storage = new StorageType();
          } else {
            storage = StorageType;
          }
          this.storage = storage;
        }
      });
    }(Wreqr);
    // Wreqr.RequestResponse
    // ---------------------
    //
    // A simple request/response implementation. Register a
    // request handler, and return a response from it
    Wreqr.RequestResponse = function(Wreqr) {
      "use strict";
      return Wreqr.Handlers.extend({
        request: function() {
          var name = arguments[0];
          var args = Array.prototype.slice.call(arguments, 1);
          if (this.hasHandler(name)) {
            return this.getHandler(name).apply(this, args);
          }
        }
      });
    }(Wreqr);
    // Event Aggregator
    // ----------------
    // A pub-sub object that can be used to decouple various parts
    // of an application through event-driven architecture.
    Wreqr.EventAggregator = function(Backbone, _) {
      "use strict";
      var EA = function() {};
      // Copy the `extend` function used by Backbone's classes
      EA.extend = Backbone.Model.extend;
      // Copy the basic Backbone.Events on to the event aggregator
      _.extend(EA.prototype, Backbone.Events);
      return EA;
    }(Backbone, _);
    // Wreqr.Channel
    // --------------
    //
    // An object that wraps the three messaging systems:
    // EventAggregator, RequestResponse, Commands
    Wreqr.Channel = function(Wreqr) {
      "use strict";
      var Channel = function(channelName) {
        this.vent = new Backbone.Wreqr.EventAggregator();
        this.reqres = new Backbone.Wreqr.RequestResponse();
        this.commands = new Backbone.Wreqr.Commands();
        this.channelName = channelName;
      };
      _.extend(Channel.prototype, {
        // Remove all handlers from the messaging systems of this channel
        reset: function() {
          this.vent.off();
          this.vent.stopListening();
          this.reqres.removeAllHandlers();
          this.commands.removeAllHandlers();
          return this;
        },
        // Connect a hash of events; one for each messaging system
        connectEvents: function(hash, context) {
          this._connect("vent", hash, context);
          return this;
        },
        connectCommands: function(hash, context) {
          this._connect("commands", hash, context);
          return this;
        },
        connectRequests: function(hash, context) {
          this._connect("reqres", hash, context);
          return this;
        },
        // Attach the handlers to a given message system `type`
        _connect: function(type, hash, context) {
          if (!hash) {
            return;
          }
          context = context || this;
          var method = type === "vent" ? "on" : "setHandler";
          _.each(hash, function(fn, eventName) {
            this[type][method](eventName, _.bind(fn, context));
          }, this);
        }
      });
      return Channel;
    }(Wreqr);
    // Wreqr.Radio
    // --------------
    //
    // An object that lets you communicate with many channels.
    Wreqr.radio = function(Wreqr) {
      "use strict";
      var Radio = function() {
        this._channels = {};
        this.vent = {};
        this.commands = {};
        this.reqres = {};
        this._proxyMethods();
      };
      _.extend(Radio.prototype, {
        channel: function(channelName) {
          if (!channelName) {
            throw new Error("Channel must receive a name");
          }
          return this._getChannel(channelName);
        },
        _getChannel: function(channelName) {
          var channel = this._channels[channelName];
          if (!channel) {
            channel = new Wreqr.Channel(channelName);
            this._channels[channelName] = channel;
          }
          return channel;
        },
        _proxyMethods: function() {
          _.each([ "vent", "commands", "reqres" ], function(system) {
            _.each(messageSystems[system], function(method) {
              this[system][method] = proxyMethod(this, system, method);
            }, this);
          }, this);
        }
      });
      var messageSystems = {
        vent: [ "on", "off", "trigger", "once", "stopListening", "listenTo", "listenToOnce" ],
        commands: [ "execute", "setHandler", "setHandlers", "removeHandler", "removeAllHandlers" ],
        reqres: [ "request", "setHandler", "setHandlers", "removeHandler", "removeAllHandlers" ]
      };
      var proxyMethod = function(radio, system, method) {
        return function(channelName) {
          var messageSystem = radio._getChannel(channelName)[system];
          var args = Array.prototype.slice.call(arguments, 1);
          return messageSystem[method].apply(messageSystem, args);
        };
      };
      return new Radio();
    }(Wreqr);
    return Backbone.Wreqr;
  })(Backbone, _);

  var previousMarionette = root.Marionette;

  var Marionette = Backbone.Marionette = {};

  Marionette.VERSION = '2.0.2';

  Marionette.noConflict = function() {
    root.Marionette = previousMarionette;
    return this;
  };

  Backbone.Marionette = Marionette;

  // Get the Deferred creator for later use
  Marionette.Deferred = Backbone.$.Deferred;

  /* jshint unused: false */
  
  // Helpers
  // -------
  
  // For slicing `arguments` in functions
  var slice = Array.prototype.slice;
  
  function throwError(message, name) {
    var error = new Error(message);
    error.name = name || 'Error';
    throw error;
  }
  
  // Marionette.extend
  // -----------------
  
  // Borrow the Backbone `extend` method so we can use it as needed
  Marionette.extend = Backbone.Model.extend;
  
  // Marionette.getOption
  // --------------------
  
  // Retrieve an object, function or other value from a target
  // object or its `options`, with `options` taking precedence.
  Marionette.getOption = function(target, optionName) {
    if (!target || !optionName) { return; }
    var value;
  
    if (target.options && (target.options[optionName] !== undefined)) {
      value = target.options[optionName];
    } else {
      value = target[optionName];
    }
  
    return value;
  };
  
  // Proxy `Marionette.getOption`
  Marionette.proxyGetOption = function(optionName) {
    return Marionette.getOption(this, optionName);
  };
  
  // Marionette.normalizeMethods
  // ----------------------
  
  // Pass in a mapping of events => functions or function names
  // and return a mapping of events => functions
  Marionette.normalizeMethods = function(hash) {
    var normalizedHash = {}, method;
    _.each(hash, function(fn, name) {
      method = fn;
      if (!_.isFunction(method)) {
        method = this[method];
      }
      if (!method) {
        return;
      }
      normalizedHash[name] = method;
    }, this);
    return normalizedHash;
  };
  
  
  // allows for the use of the @ui. syntax within
  // a given key for triggers and events
  // swaps the @ui with the associated selector
  Marionette.normalizeUIKeys = function(hash, ui) {
    if (typeof(hash) === 'undefined') {
      return;
    }
  
    _.each(_.keys(hash), function(v) {
      var pattern = /@ui.[a-zA-Z_$0-9]*/g;
      if (v.match(pattern)) {
        hash[v.replace(pattern, function(r) {
          return ui[r.slice(4)];
        })] = hash[v];
        delete hash[v];
      }
    });
  
    return hash;
  };
  
  // Mix in methods from Underscore, for iteration, and other
  // collection related features.
  // Borrowing this code from Backbone.Collection:
  // http://backbonejs.org/docs/backbone.html#section-121
  Marionette.actAsCollection = function(object, listProperty) {
    var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
      'select', 'reject', 'every', 'all', 'some', 'any', 'include',
      'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
      'last', 'without', 'isEmpty', 'pluck'];
  
    _.each(methods, function(method) {
      object[method] = function() {
        var list = _.values(_.result(this, listProperty));
        var args = [list].concat(_.toArray(arguments));
        return _[method].apply(_, args);
      };
    });
  };
  
  // Trigger an event and/or a corresponding method name. Examples:
  //
  // `this.triggerMethod("foo")` will trigger the "foo" event and
  // call the "onFoo" method.
  //
  // `this.triggerMethod("foo:bar")` will trigger the "foo:bar" event and
  // call the "onFooBar" method.
  Marionette.triggerMethod = (function() {
  
    // split the event name on the ":"
    var splitter = /(^|:)(\w)/gi;
  
    // take the event section ("section1:section2:section3")
    // and turn it in to uppercase name
    function getEventName(match, prefix, eventName) {
      return eventName.toUpperCase();
    }
  
    // actual triggerMethod implementation
    var triggerMethod = function(event) {
      // get the method name from the event name
      var methodName = 'on' + event.replace(splitter, getEventName);
      var method = this[methodName];
      var result;
  
      // call the onMethodName if it exists
      if (_.isFunction(method)) {
        // pass all arguments, except the event name
        result = method.apply(this, _.tail(arguments));
      }
  
      // trigger the event, if a trigger method exists
      if (_.isFunction(this.trigger)) {
        this.trigger.apply(this, arguments);
      }
  
      return result;
    };
  
    return triggerMethod;
  })();
  
  // DOMRefresh
  // ----------
  //
  // Monitor a view's state, and after it has been rendered and shown
  // in the DOM, trigger a "dom:refresh" event every time it is
  // re-rendered.
  
  Marionette.MonitorDOMRefresh = (function(documentElement) {
    // track when the view has been shown in the DOM,
    // using a Marionette.Region (or by other means of triggering "show")
    function handleShow(view) {
      view._isShown = true;
      triggerDOMRefresh(view);
    }
  
    // track when the view has been rendered
    function handleRender(view) {
      view._isRendered = true;
      triggerDOMRefresh(view);
    }
  
    // Trigger the "dom:refresh" event and corresponding "onDomRefresh" method
    function triggerDOMRefresh(view) {
      if (view._isShown && view._isRendered && isInDOM(view)) {
        if (_.isFunction(view.triggerMethod)) {
          view.triggerMethod('dom:refresh');
        }
      }
    }
  
    function isInDOM(view) {
      return documentElement.contains(view.el);
    }
  
    // Export public API
    return function(view) {
      view.listenTo(view, 'show', function() {
        handleShow(view);
      });
  
      view.listenTo(view, 'render', function() {
        handleRender(view);
      });
    };
  })(document.documentElement);
  

  /* jshint maxparams: 5 */
  
  // Marionette.bindEntityEvents & unbindEntityEvents
  // ---------------------------
  //
  // These methods are used to bind/unbind a backbone "entity" (collection/model)
  // to methods on a target object.
  //
  // The first parameter, `target`, must have a `listenTo` method from the
  // EventBinder object.
  //
  // The second parameter is the entity (Backbone.Model or Backbone.Collection)
  // to bind the events from.
  //
  // The third parameter is a hash of { "event:name": "eventHandler" }
  // configuration. Multiple handlers can be separated by a space. A
  // function can be supplied instead of a string handler name.
  
  (function(Marionette) {
    'use strict';
  
    // Bind the event to handlers specified as a string of
    // handler names on the target object
    function bindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      _.each(methodNames, function(methodName) {
  
        var method = target[methodName];
        if (!method) {
          throwError('Method "' + methodName +
            '" was configured as an event handler, but does not exist.');
        }
  
        target.listenTo(entity, evt, method);
      });
    }
  
    // Bind the event to a supplied callback function
    function bindToFunction(target, entity, evt, method) {
      target.listenTo(entity, evt, method);
    }
  
    // Bind the event to handlers specified as a string of
    // handler names on the target object
    function unbindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      _.each(methodNames, function(methodName) {
        var method = target[methodName];
        target.stopListening(entity, evt, method);
      });
    }
  
    // Bind the event to a supplied callback function
    function unbindToFunction(target, entity, evt, method) {
      target.stopListening(entity, evt, method);
    }
  
  
    // generic looping function
    function iterateEvents(target, entity, bindings, functionCallback, stringCallback) {
      if (!entity || !bindings) { return; }
  
      // allow the bindings to be a function
      if (_.isFunction(bindings)) {
        bindings = bindings.call(target);
      }
  
      // iterate the bindings and bind them
      _.each(bindings, function(methods, evt) {
  
        // allow for a function as the handler,
        // or a list of event names as a string
        if (_.isFunction(methods)) {
          functionCallback(target, entity, evt, methods);
        } else {
          stringCallback(target, entity, evt, methods);
        }
  
      });
    }
  
    // Export Public API
    Marionette.bindEntityEvents = function(target, entity, bindings) {
      iterateEvents(target, entity, bindings, bindToFunction, bindFromStrings);
    };
  
    Marionette.unbindEntityEvents = function(target, entity, bindings) {
      iterateEvents(target, entity, bindings, unbindToFunction, unbindFromStrings);
    };
  
    // Proxy `bindEntityEvents`
    Marionette.proxyBindEntityEvents = function(entity, bindings) {
      return Marionette.bindEntityEvents(this, entity, bindings);
    };
  
    // Proxy `unbindEntityEvents`
    Marionette.proxyUnbindEntityEvents = function(entity, bindings) {
      return Marionette.unbindEntityEvents(this, entity, bindings);
    };
  })(Marionette);
  

  // Callbacks
  // ---------
  
  // A simple way of managing a collection of callbacks
  // and executing them at a later point in time, using jQuery's
  // `Deferred` object.
  Marionette.Callbacks = function() {
    this._deferred = Marionette.Deferred();
    this._callbacks = [];
  };
  
  _.extend(Marionette.Callbacks.prototype, {
  
    // Add a callback to be executed. Callbacks added here are
    // guaranteed to execute, even if they are added after the
    // `run` method is called.
    add: function(callback, contextOverride) {
      var promise = _.result(this._deferred, 'promise');
  
      this._callbacks.push({cb: callback, ctx: contextOverride});
  
      promise.then(function(args) {
        if (contextOverride){ args.context = contextOverride; }
        callback.call(args.context, args.options);
      });
    },
  
    // Run all registered callbacks with the context specified.
    // Additional callbacks can be added after this has been run
    // and they will still be executed.
    run: function(options, context) {
      this._deferred.resolve({
        options: options,
        context: context
      });
    },
  
    // Resets the list of callbacks to be run, allowing the same list
    // to be run multiple times - whenever the `run` method is called.
    reset: function() {
      var callbacks = this._callbacks;
      this._deferred = Marionette.Deferred();
      this._callbacks = [];
  
      _.each(callbacks, function(cb) {
        this.add(cb.cb, cb.ctx);
      }, this);
    }
  });
  
  // Marionette Controller
  // ---------------------
  //
  // A multi-purpose object to use as a controller for
  // modules and routers, and as a mediator for workflow
  // and coordination of other objects, views, and more.
  Marionette.Controller = function(options) {
    this.options = options || {};
  
    if (_.isFunction(this.initialize)) {
      this.initialize(this.options);
    }
  };
  
  Marionette.Controller.extend = Marionette.extend;
  
  // Controller Methods
  // --------------
  
  // Ensure it can trigger events with Backbone.Events
  _.extend(Marionette.Controller.prototype, Backbone.Events, {
    destroy: function() {
      var args = Array.prototype.slice.call(arguments);
      this.triggerMethod.apply(this, ['before:destroy'].concat(args));
      this.triggerMethod.apply(this, ['destroy'].concat(args));
  
      this.stopListening();
      this.off();
    },
  
    // import the `triggerMethod` to trigger events with corresponding
    // methods if the method exists
    triggerMethod: Marionette.triggerMethod,
  
    // Proxy `getOption` to enable getting options from this or this.options by name.
    getOption: Marionette.proxyGetOption
  
  });
  
  /* jshint maxcomplexity: 10, maxstatements: 27 */
  
  // Region
  // ------
  //
  // Manage the visual regions of your composite application. See
  // http://lostechies.com/derickbailey/2011/12/12/composite-js-apps-regions-and-region-managers/
  
  Marionette.Region = function(options) {
    this.options = options || {};
    this.el = this.getOption('el');
  
    // Handle when this.el is passed in as a $ wrapped element.
    this.el = this.el instanceof Backbone.$ ? this.el[0] : this.el;
  
    if (!this.el) {
      throwError('An "el" must be specified for a region.', 'NoElError');
    }
  
    this.$el = this.getEl(this.el);
  
    if (this.initialize) {
      var args = Array.prototype.slice.apply(arguments);
      this.initialize.apply(this, args);
    }
  };
  
  
  // Region Class methods
  // -------------------
  
  _.extend(Marionette.Region, {
  
    // Build an instance of a region by passing in a configuration object
    // and a default region class to use if none is specified in the config.
    //
    // The config object should either be a string as a jQuery DOM selector,
    // a Region class directly, or an object literal that specifies both
    // a selector and regionClass:
    //
    // ```js
    // {
    //   selector: "#foo",
    //   regionClass: MyCustomRegion
    // }
    // ```
    //
    buildRegion: function(regionConfig, defaultRegionClass) {
      var regionIsString = _.isString(regionConfig);
      var regionSelectorIsString = _.isString(regionConfig.selector);
      var regionClassIsUndefined = _.isUndefined(regionConfig.regionClass);
      var regionIsClass = _.isFunction(regionConfig);
  
      if (!regionIsClass && !regionIsString && !regionSelectorIsString) {
        throwError('Region must be specified as a Region class,' +
          'a selector string or an object with selector property');
      }
  
      var selector, RegionClass;
  
      // get the selector for the region
  
      if (regionIsString) {
        selector = regionConfig;
      }
  
      if (regionConfig.selector) {
        selector = regionConfig.selector;
        delete regionConfig.selector;
      }
  
      // get the class for the region
  
      if (regionIsClass) {
        RegionClass = regionConfig;
      }
  
      if (!regionIsClass && regionClassIsUndefined) {
        RegionClass = defaultRegionClass;
      }
  
      if (regionConfig.regionClass) {
        RegionClass = regionConfig.regionClass;
        delete regionConfig.regionClass;
      }
  
      if (regionIsString || regionIsClass) {
        regionConfig = {};
      }
  
      regionConfig.el = selector;
  
      // build the region instance
      var region = new RegionClass(regionConfig);
  
      // override the `getEl` function if we have a parentEl
      // this must be overridden to ensure the selector is found
      // on the first use of the region. if we try to assign the
      // region's `el` to `parentEl.find(selector)` in the object
      // literal to build the region, the element will not be
      // guaranteed to be in the DOM already, and will cause problems
      if (regionConfig.parentEl) {
        region.getEl = function(el) {
          if (_.isObject(el)) {
            return Backbone.$(el);
          }
          var parentEl = regionConfig.parentEl;
          if (_.isFunction(parentEl)) {
            parentEl = parentEl();
          }
          return parentEl.find(el);
        };
      }
  
      return region;
    }
  
  });
  
  // Region Instance Methods
  // -----------------------
  
  _.extend(Marionette.Region.prototype, Backbone.Events, {
  
    // Displays a backbone view instance inside of the region.
    // Handles calling the `render` method for you. Reads content
    // directly from the `el` attribute. Also calls an optional
    // `onShow` and `onDestroy` method on your view, just after showing
    // or just before destroying the view, respectively.
    // The `preventDestroy` option can be used to prevent a view from
    // the old view being destroyed on show.
    // The `forceShow` option can be used to force a view to be
    // re-rendered if it's already shown in the region.
  
    show: function(view, options){
      this._ensureElement();
  
      var showOptions = options || {};
      var isDifferentView = view !== this.currentView;
      var preventDestroy =  !!showOptions.preventDestroy;
      var forceShow = !!showOptions.forceShow;
  
      // we are only changing the view if there is a view to change to begin with
      var isChangingView = !!this.currentView;
  
      // only destroy the view if we don't want to preventDestroy and the view is different
      var _shouldDestroyView = !preventDestroy && isDifferentView;
  
      if (_shouldDestroyView) {
        this.empty();
      }
  
      // show the view if the view is different or if you want to re-show the view
      var _shouldShowView = isDifferentView || forceShow;
  
      if (_shouldShowView) {
        view.render();
  
        if (isChangingView) {
          this.triggerMethod('before:swap', view);
        }
  
        this.triggerMethod('before:show', view);
        this.triggerMethod.call(view, 'before:show');
  
        this.attachHtml(view);
        this.currentView = view;
  
        if (isChangingView) {
          this.triggerMethod('swap', view);
        }
  
        this.triggerMethod('show', view);
  
        if (_.isFunction(view.triggerMethod)) {
          view.triggerMethod('show');
        } else {
          this.triggerMethod.call(view, 'show');
        }
  
        return this;
      }
  
      return this;
    },
  
    _ensureElement: function(){
      if (!_.isObject(this.el)) {
        this.$el = this.getEl(this.el);
        this.el = this.$el[0];
      }
  
      if (!this.$el || this.$el.length === 0) {
        throwError('An "el" ' + this.$el.selector + ' must exist in DOM');
      }
    },
  
    // Override this method to change how the region finds the
    // DOM element that it manages. Return a jQuery selector object.
    getEl: function(el) {
      return Backbone.$(el);
    },
  
    // Override this method to change how the new view is
    // appended to the `$el` that the region is managing
    attachHtml: function(view) {
      // empty the node and append new view
      this.el.innerHTML='';
      this.el.appendChild(view.el);
    },
  
    // Destroy the current view, if there is one. If there is no
    // current view, it does nothing and returns immediately.
    empty: function() {
      var view = this.currentView;
      if (!view || view.isDestroyed) { return; }
  
      this.triggerMethod('before:empty', view);
  
      // call 'destroy' or 'remove', depending on which is found
      if (view.destroy) { view.destroy(); }
      else if (view.remove) { view.remove(); }
  
      this.triggerMethod('empty', view);
  
      delete this.currentView;
    },
  
    // Attach an existing view to the region. This
    // will not call `render` or `onShow` for the new view,
    // and will not replace the current HTML for the `el`
    // of the region.
    attachView: function(view) {
      this.currentView = view;
    },
  
    // Reset the region by destroying any existing view and
    // clearing out the cached `$el`. The next time a view
    // is shown via this region, the region will re-query the
    // DOM for the region's `el`.
    reset: function() {
      this.empty();
  
      if (this.$el) {
        this.el = this.$el.selector;
      }
  
      delete this.$el;
    },
  
    // Proxy `getOption` to enable getting options from this or this.options by name.
    getOption: Marionette.proxyGetOption,
  
    // import the `triggerMethod` to trigger events with corresponding
    // methods if the method exists
    triggerMethod: Marionette.triggerMethod
  });
  
  // Copy the `extend` function used by Backbone's classes
  Marionette.Region.extend = Marionette.extend;
  
  // Marionette.RegionManager
  // ------------------------
  //
  // Manage one or more related `Marionette.Region` objects.
  Marionette.RegionManager = (function(Marionette) {
  
    var RegionManager = Marionette.Controller.extend({
      constructor: function(options) {
        this._regions = {};
        Marionette.Controller.call(this, options);
      },
  
      // Add multiple regions using an object literal, where
      // each key becomes the region name, and each value is
      // the region definition.
      addRegions: function(regionDefinitions, defaults) {
        var regions = {};
  
        _.each(regionDefinitions, function(definition, name) {
          if (_.isString(definition)) {
            definition = {selector: definition};
          }
  
          if (definition.selector) {
            definition = _.defaults({}, definition, defaults);
          }
  
          var region = this.addRegion(name, definition);
          regions[name] = region;
        }, this);
  
        return regions;
      },
  
      // Add an individual region to the region manager,
      // and return the region instance
      addRegion: function(name, definition) {
        var region;
  
        var isObject = _.isObject(definition);
        var isString = _.isString(definition);
        var hasSelector = !!definition.selector;
  
        if (isString || (isObject && hasSelector)) {
          region = Marionette.Region.buildRegion(definition, Marionette.Region);
        } else if (_.isFunction(definition)) {
          region = Marionette.Region.buildRegion(definition, Marionette.Region);
        } else {
          region = definition;
        }
  
        this.triggerMethod('before:add:region', name, region);
  
        this._store(name, region);
  
        this.triggerMethod('add:region', name, region);
        return region;
      },
  
      // Get a region by name
      get: function(name) {
        return this._regions[name];
      },
  
      // Gets all the regions contained within
      // the `regionManager` instance.
      getRegions: function(){
        return _.clone(this._regions);
      },
  
      // Remove a region by name
      removeRegion: function(name) {
        var region = this._regions[name];
        this._remove(name, region);
      },
  
      // Empty all regions in the region manager, and
      // remove them
      removeRegions: function() {
        _.each(this._regions, function(region, name) {
          this._remove(name, region);
        }, this);
      },
  
      // Empty all regions in the region manager, but
      // leave them attached
      emptyRegions: function() {
        _.each(this._regions, function(region) {
          region.empty();
        }, this);
      },
  
      // Destroy all regions and shut down the region
      // manager entirely
      destroy: function() {
        this.removeRegions();
        Marionette.Controller.prototype.destroy.apply(this, arguments);
      },
  
      // internal method to store regions
      _store: function(name, region) {
        this._regions[name] = region;
        this._setLength();
      },
  
      // internal method to remove a region
      _remove: function(name, region) {
        this.triggerMethod('before:remove:region', name, region);
        region.empty();
        region.stopListening();
        delete this._regions[name];
        this._setLength();
        this.triggerMethod('remove:region', name, region);
      },
  
      // set the number of regions current held
      _setLength: function() {
        this.length = _.size(this._regions);
      }
  
    });
  
    Marionette.actAsCollection(RegionManager.prototype, '_regions');
  
    return RegionManager;
  })(Marionette);
  

  // Template Cache
  // --------------
  
  // Manage templates stored in `<script>` blocks,
  // caching them for faster access.
  Marionette.TemplateCache = function(templateId) {
    this.templateId = templateId;
  };
  
  // TemplateCache object-level methods. Manage the template
  // caches from these method calls instead of creating
  // your own TemplateCache instances
  _.extend(Marionette.TemplateCache, {
    templateCaches: {},
  
    // Get the specified template by id. Either
    // retrieves the cached version, or loads it
    // from the DOM.
    get: function(templateId) {
      var cachedTemplate = this.templateCaches[templateId];
  
      if (!cachedTemplate) {
        cachedTemplate = new Marionette.TemplateCache(templateId);
        this.templateCaches[templateId] = cachedTemplate;
      }
  
      return cachedTemplate.load();
    },
  
    // Clear templates from the cache. If no arguments
    // are specified, clears all templates:
    // `clear()`
    //
    // If arguments are specified, clears each of the
    // specified templates from the cache:
    // `clear("#t1", "#t2", "...")`
    clear: function() {
      var i;
      var args = slice.call(arguments);
      var length = args.length;
  
      if (length > 0) {
        for (i = 0; i < length; i++) {
          delete this.templateCaches[args[i]];
        }
      } else {
        this.templateCaches = {};
      }
    }
  });
  
  // TemplateCache instance methods, allowing each
  // template cache object to manage its own state
  // and know whether or not it has been loaded
  _.extend(Marionette.TemplateCache.prototype, {
  
    // Internal method to load the template
    load: function() {
      // Guard clause to prevent loading this template more than once
      if (this.compiledTemplate) {
        return this.compiledTemplate;
      }
  
      // Load the template and compile it
      var template = this.loadTemplate(this.templateId);
      this.compiledTemplate = this.compileTemplate(template);
  
      return this.compiledTemplate;
    },
  
    // Load a template from the DOM, by default. Override
    // this method to provide your own template retrieval
    // For asynchronous loading with AMD/RequireJS, consider
    // using a template-loader plugin as described here:
    // https://github.com/marionettejs/backbone.marionette/wiki/Using-marionette-with-requirejs
    loadTemplate: function(templateId) {
      var template = Backbone.$(templateId).html();
  
      if (!template || template.length === 0) {
        throwError('Could not find template: "' + templateId + '"', 'NoTemplateError');
      }
  
      return template;
    },
  
    // Pre-compile the template before caching it. Override
    // this method if you do not need to pre-compile a template
    // (JST / RequireJS for example) or if you want to change
    // the template engine used (Handebars, etc).
    compileTemplate: function(rawTemplate) {
      return _.template(rawTemplate);
    }
  });
  
  // Renderer
  // --------
  
  // Render a template with data by passing in the template
  // selector and the data to render.
  Marionette.Renderer = {
  
    // Render a template with data. The `template` parameter is
    // passed to the `TemplateCache` object to retrieve the
    // template function. Override this method to provide your own
    // custom rendering and template handling for all of Marionette.
    render: function(template, data) {
      if (!template) {
        throwError('Cannot render the template since its false, null or undefined.',
          'TemplateNotFoundError');
      }
  
      var templateFunc;
      if (typeof template === 'function') {
        templateFunc = template;
      } else {
        templateFunc = Marionette.TemplateCache.get(template);
      }
  
      return templateFunc(data);
    }
  };
  

  /* jshint maxlen: 114, nonew: false */
  // Marionette.View
  // ---------------
  
  // The core view class that other Marionette views extend from.
  Marionette.View = Backbone.View.extend({
  
    constructor: function(options) {
      _.bindAll(this, 'render');
  
      // this exposes view options to the view initializer
      // this is a backfill since backbone removed the assignment
      // of this.options
      // at some point however this may be removed
      this.options = _.extend({}, _.result(this, 'options'), _.isFunction(options) ? options.call(this) : options);
      // parses out the @ui DSL for events
      this.events = this.normalizeUIKeys(_.result(this, 'events'));
  
      if (_.isObject(this.behaviors)) {
        new Marionette.Behaviors(this);
      }
  
      Backbone.View.apply(this, arguments);
  
      Marionette.MonitorDOMRefresh(this);
      this.listenTo(this, 'show', this.onShowCalled);
    },
  
    // Get the template for this view
    // instance. You can set a `template` attribute in the view
    // definition or pass a `template: "whatever"` parameter in
    // to the constructor options.
    getTemplate: function() {
      return this.getOption('template');
    },
  
    // Mix in template helper methods. Looks for a
    // `templateHelpers` attribute, which can either be an
    // object literal, or a function that returns an object
    // literal. All methods and attributes from this object
    // are copies to the object passed in.
    mixinTemplateHelpers: function(target) {
      target = target || {};
      var templateHelpers = this.getOption('templateHelpers');
      if (_.isFunction(templateHelpers)) {
        templateHelpers = templateHelpers.call(this);
      }
      return _.extend(target, templateHelpers);
    },
  
  
    normalizeUIKeys: function(hash) {
      var ui = _.result(this, 'ui');
      var uiBindings = _.result(this, '_uiBindings');
      return Marionette.normalizeUIKeys(hash, uiBindings || ui);
    },
  
    // Configure `triggers` to forward DOM events to view
    // events. `triggers: {"click .foo": "do:foo"}`
    configureTriggers: function() {
      if (!this.triggers) { return; }
  
      var triggerEvents = {};
  
      // Allow `triggers` to be configured as a function
      var triggers = this.normalizeUIKeys(_.result(this, 'triggers'));
  
      // Configure the triggers, prevent default
      // action and stop propagation of DOM events
      _.each(triggers, function(value, key) {
  
        var hasOptions = _.isObject(value);
        var eventName = hasOptions ? value.event : value;
  
        // build the event handler function for the DOM event
        triggerEvents[key] = function(e) {
  
          // stop the event in its tracks
          if (e) {
            var prevent = e.preventDefault;
            var stop = e.stopPropagation;
  
            var shouldPrevent = hasOptions ? value.preventDefault : prevent;
            var shouldStop = hasOptions ? value.stopPropagation : stop;
  
            if (shouldPrevent && prevent) { prevent.apply(e); }
            if (shouldStop && stop) { stop.apply(e); }
          }
  
          // build the args for the event
          var args = {
            view: this,
            model: this.model,
            collection: this.collection
          };
  
          // trigger the event
          this.triggerMethod(eventName, args);
        };
  
      }, this);
  
      return triggerEvents;
    },
  
    // Overriding Backbone.View's delegateEvents to handle
    // the `triggers`, `modelEvents`, and `collectionEvents` configuration
    delegateEvents: function(events) {
      this._delegateDOMEvents(events);
      this.bindEntityEvents(this.model, this.getOption('modelEvents'));
      this.bindEntityEvents(this.collection, this.getOption('collectionEvents'));
    },
  
    // internal method to delegate DOM events and triggers
    _delegateDOMEvents: function(events) {
      events = events || this.events;
      if (_.isFunction(events)) { events = events.call(this); }
  
      // normalize ui keys
      events = this.normalizeUIKeys(events);
  
      var combinedEvents = {};
  
      // look up if this view has behavior events
      var behaviorEvents = _.result(this, 'behaviorEvents') || {};
      var triggers = this.configureTriggers();
  
      // behavior events will be overriden by view events and or triggers
      _.extend(combinedEvents, behaviorEvents, events, triggers);
  
      Backbone.View.prototype.delegateEvents.call(this, combinedEvents);
    },
  
    // Overriding Backbone.View's undelegateEvents to handle unbinding
    // the `triggers`, `modelEvents`, and `collectionEvents` config
    undelegateEvents: function() {
      var args = Array.prototype.slice.call(arguments);
      Backbone.View.prototype.undelegateEvents.apply(this, args);
      this.unbindEntityEvents(this.model, this.getOption('modelEvents'));
      this.unbindEntityEvents(this.collection, this.getOption('collectionEvents'));
    },
  
    // Internal method, handles the `show` event.
    onShowCalled: function() {},
  
    // Internal helper method to verify whether the view hasn't been destroyed
    _ensureViewIsIntact: function() {
      if (this.isDestroyed) {
        console.log(this);
        var err = new Error('Cannot use a view thats already been destroyed.');
        err.name = 'ViewDestroyedError';
        throw err;
      }
    },
  
    // Default `destroy` implementation, for removing a view from the
    // DOM and unbinding it. Regions will call this method
    // for you. You can specify an `onDestroy` method in your view to
    // add custom code that is called after the view is destroyed.
    destroy: function() {
      if (this.isDestroyed) { return; }
  
      var args = Array.prototype.slice.call(arguments);
  
      this.triggerMethod.apply(this, ['before:destroy'].concat(args));
  
      // mark as destroyed before doing the actual destroy, to
      // prevent infinite loops within "destroy" event handlers
      // that are trying to destroy other views
      this.isDestroyed = true;
      this.triggerMethod.apply(this, ['destroy'].concat(args));
  
      // unbind UI elements
      this.unbindUIElements();
  
      // remove the view from the DOM
      this.remove();
    },
  
    // This method binds the elements specified in the "ui" hash inside the view's code with
    // the associated jQuery selectors.
    bindUIElements: function() {
      if (!this.ui) { return; }
  
      // store the ui hash in _uiBindings so they can be reset later
      // and so re-rendering the view will be able to find the bindings
      if (!this._uiBindings) {
        this._uiBindings = this.ui;
      }
  
      // get the bindings result, as a function or otherwise
      var bindings = _.result(this, '_uiBindings');
  
      // empty the ui so we don't have anything to start with
      this.ui = {};
  
      // bind each of the selectors
      _.each(_.keys(bindings), function(key) {
        var selector = bindings[key];
        this.ui[key] = this.$(selector);
      }, this);
    },
  
    // This method unbinds the elements specified in the "ui" hash
    unbindUIElements: function() {
      if (!this.ui || !this._uiBindings) { return; }
  
      // delete all of the existing ui bindings
      _.each(this.ui, function($el, name) {
        delete this.ui[name];
      }, this);
  
      // reset the ui element to the original bindings configuration
      this.ui = this._uiBindings;
      delete this._uiBindings;
    },
  
    // import the `triggerMethod` to trigger events with corresponding
    // methods if the method exists
    triggerMethod: Marionette.triggerMethod,
  
    // Imports the "normalizeMethods" to transform hashes of
    // events=>function references/names to a hash of events=>function references
    normalizeMethods: Marionette.normalizeMethods,
  
    // Proxy `getOption` to enable getting options from this or this.options by name.
    getOption: Marionette.proxyGetOption,
  
    // Proxy `unbindEntityEvents` to enable binding view's events from another entity.
    bindEntityEvents: Marionette.proxyBindEntityEvents,
  
    // Proxy `unbindEntityEvents` to enable unbinding view's events from another entity.
    unbindEntityEvents: Marionette.proxyUnbindEntityEvents
  });
  
  // Item View
  // ---------
  
  // A single item view implementation that contains code for rendering
  // with underscore.js templates, serializing the view's model or collection,
  // and calling several methods on extended views, such as `onRender`.
  Marionette.ItemView = Marionette.View.extend({
  
    // Setting up the inheritance chain which allows changes to
    // Marionette.View.prototype.constructor which allows overriding
    constructor: function() {
      Marionette.View.apply(this, arguments);
    },
  
    // Serialize the model or collection for the view. If a model is
    // found, `.toJSON()` is called. If a collection is found, `.toJSON()`
    // is also called, but is used to populate an `items` array in the
    // resulting data. If both are found, defaults to the model.
    // You can override the `serializeData` method in your own view
    // definition, to provide custom serialization for your view's data.
    serializeData: function() {
      var data = {};
  
      if (this.model) {
        data = this.model.toJSON();
      }
      else if (this.collection) {
        data = {items: this.collection.toJSON()};
      }
  
      return data;
    },
  
    // Render the view, defaulting to underscore.js templates.
    // You can override this in your view definition to provide
    // a very specific rendering for your view. In general, though,
    // you should override the `Marionette.Renderer` object to
    // change how Marionette renders views.
    render: function() {
      this._ensureViewIsIntact();
  
      this.triggerMethod('before:render', this);
  
      var data = this.serializeData();
      data = this.mixinTemplateHelpers(data);
  
      var template = this.getTemplate();
      var html = Marionette.Renderer.render(template, data);
      this.attachElContent(html);
      this.bindUIElements();
  
      this.triggerMethod('render', this);
  
      return this;
    },
  
    // Attaches the content of a given view.
    // This method can be overriden to optimize rendering,
    // or to render in a non standard way.
    //
    // For example, using `innerHTML` instead of `$el.html`
    //
    // ```js
    // attachElContent: function(html) {
    //   this.el.innerHTML = html;
    //   return this;
    // }
    // ```
    attachElContent: function(html) {
      this.$el.html(html);
  
      return this;
    },
  
    // Override the default destroy event to add a few
    // more events that are triggered.
    destroy: function() {
      if (this.isDestroyed) { return; }
  
      Marionette.View.prototype.destroy.apply(this, arguments);
    }
  });
  
  /* jshint maxstatements: 14 */
  
  // Collection View
  // ---------------
  
  // A view that iterates over a Backbone.Collection
  // and renders an individual child view for each model.
  Marionette.CollectionView = Marionette.View.extend({
  
    // used as the prefix for child view events
    // that are forwarded through the collectionview
    childViewEventPrefix: 'childview',
  
    // constructor
    // option to pass `{sort: false}` to prevent the `CollectionView` from
    // maintaining the sorted order of the collection.
    // This will fallback onto appending childView's to the end.
    constructor: function(options){
      var initOptions = options || {};
      this.sort = _.isUndefined(initOptions.sort) ? true : initOptions.sort;
  
      this._initChildViewStorage();
  
      Marionette.View.apply(this, arguments);
  
      this._initialEvents();
      this.initRenderBuffer();
    },
  
    // Instead of inserting elements one by one into the page,
    // it's much more performant to insert elements into a document
    // fragment and then insert that document fragment into the page
    initRenderBuffer: function() {
      this.elBuffer = document.createDocumentFragment();
      this._bufferedChildren = [];
    },
  
    startBuffering: function() {
      this.initRenderBuffer();
      this.isBuffering = true;
    },
  
    endBuffering: function() {
      this.isBuffering = false;
      this._triggerBeforeShowBufferedChildren();
      this.attachBuffer(this, this.elBuffer);
      this._triggerShowBufferedChildren();
      this.initRenderBuffer();
    },
  
    _triggerBeforeShowBufferedChildren: function() {
      if (this._isShown) {
        _.invoke(this._bufferedChildren, 'triggerMethod', 'before:show');
      }
    },
  
    _triggerShowBufferedChildren: function() {
      if (this._isShown) {
        _.each(this._bufferedChildren, function (child) {
          if (_.isFunction(child.triggerMethod)) {
            child.triggerMethod('show');
          } else {
            Marionette.triggerMethod.call(child, 'show');
          }
        });
        this._bufferedChildren = [];
      }
    },
  
    // Configured the initial events that the collection view
    // binds to.
    _initialEvents: function() {
      if (this.collection) {
        this.listenTo(this.collection, 'add', this._onCollectionAdd);
        this.listenTo(this.collection, 'remove', this._onCollectionRemove);
        this.listenTo(this.collection, 'reset', this.render);
  
        if (this.sort) {
          this.listenTo(this.collection, 'sort', this._sortViews);
        }
      }
    },
  
    // Handle a child added to the collection
    _onCollectionAdd: function(child, collection, options) {
      this.destroyEmptyView();
      var ChildView = this.getChildView(child);
      var index = this.collection.indexOf(child);
      this.addChild(child, ChildView, index);
    },
  
    // get the child view by model it holds, and remove it
    _onCollectionRemove: function(model) {
      var view = this.children.findByModel(model);
      this.removeChildView(view);
      this.checkEmpty();
    },
  
    // Override from `Marionette.View` to trigger show on child views
    onShowCalled: function(){
      this.children.each(function(child){
        if (_.isFunction(child.triggerMethod)) {
          child.triggerMethod('show');
        } else {
          Marionette.triggerMethod.call(child, 'show');
        }
      });
    },
  
    // Render children views. Override this method to
    // provide your own implementation of a render function for
    // the collection view.
    render: function() {
      this._ensureViewIsIntact();
      this.triggerMethod('before:render', this);
      this._renderChildren();
      this.triggerMethod('render', this);
      return this;
    },
  
    // Internal method. This checks for any changes in the order of the collection.
    // If the index of any view doesn't match, it will render.
    _sortViews: function(){
      // check for any changes in sort order of views
      var orderChanged = this.collection.find(function(item, index){
        var view = this.children.findByModel(item);
        return view && view._index !== index;
      }, this);
  
      if (orderChanged) {
        this.render();
      }
    },
  
    // Internal method. Separated so that CompositeView can have
    // more control over events being triggered, around the rendering
    // process
    _renderChildren: function() {
      this.destroyEmptyView();
      this.destroyChildren();
  
      if (this.isEmpty(this.collection)) {
        this.showEmptyView();
      } else {
        this.triggerMethod('before:render:collection', this);
        this.startBuffering();
        this.showCollection();
        this.endBuffering();
        this.triggerMethod('render:collection', this);
      }
    },
  
    // Internal method to loop through collection and show each child view.
    showCollection: function() {
      var ChildView;
      this.collection.each(function(child, index) {
        ChildView = this.getChildView(child);
        this.addChild(child, ChildView, index);
      }, this);
    },
  
    // Internal method to show an empty view in place of
    // a collection of child views, when the collection is empty
    showEmptyView: function() {
      var EmptyView = this.getEmptyView();
  
      if (EmptyView && !this._showingEmptyView) {
        this.triggerMethod('before:render:empty');
  
        this._showingEmptyView = true;
        var model = new Backbone.Model();
        this.addEmptyView(model, EmptyView);
  
        this.triggerMethod('render:empty');
      }
    },
  
    // Internal method to destroy an existing emptyView instance
    // if one exists. Called when a collection view has been
    // rendered empty, and then a child is added to the collection.
    destroyEmptyView: function() {
      if (this._showingEmptyView) {
        this.destroyChildren();
        delete this._showingEmptyView;
      }
    },
  
    // Retrieve the empty view class
    getEmptyView: function() {
      return this.getOption('emptyView');
    },
  
    // Render and show the emptyView. Similar to addChild method
    // but "child:added" events are not fired, and the event from
    // emptyView are not forwarded
    addEmptyView: function(child, EmptyView){
  
      // get the emptyViewOptions, falling back to childViewOptions
      var emptyViewOptions = this.getOption('emptyViewOptions') ||
                            this.getOption('childViewOptions');
  
      if (_.isFunction(emptyViewOptions)){
        emptyViewOptions = emptyViewOptions.call(this);
      }
  
      // build the empty view
      var view = this.buildChildView(child, EmptyView, emptyViewOptions);
  
      // trigger the 'before:show' event on `view` if the collection view
      // has already been shown
      if (this._isShown){
        this.triggerMethod.call(view, 'before:show');
      }
  
      // Store the `emptyView` like a `childView` so we can properly
      // remove and/or close it later
      this.children.add(view);
  
      // Render it and show it
      this.renderChildView(view, -1);
  
      // call the 'show' method if the collection view
      // has already been shown
      if (this._isShown){
        this.triggerMethod.call(view, 'show');
      }
    },
  
    // Retrieve the childView class, either from `this.options.childView`
    // or from the `childView` in the object definition. The "options"
    // takes precedence.
    getChildView: function(child) {
      var childView = this.getOption('childView');
  
      if (!childView) {
        throwError('A "childView" must be specified', 'NoChildViewError');
      }
  
      return childView;
    },
  
    // Render the child's view and add it to the
    // HTML for the collection view at a given index.
    // This will also update the indices of later views in the collection
    // in order to keep the children in sync with the collection.
    addChild: function(child, ChildView, index) {
      var childViewOptions = this.getOption('childViewOptions');
      if (_.isFunction(childViewOptions)) {
        childViewOptions = childViewOptions.call(this, child, index);
      }
  
      var view = this.buildChildView(child, ChildView, childViewOptions);
  
      // increment indices of views after this one
      this._updateIndices(view, true, index);
  
      this._addChildView(view, index);
  
      return view;
    },
  
    // Internal method. This decrements or increments the indices of views after the
    // added/removed view to keep in sync with the collection.
    _updateIndices: function(view, increment, index) {
      if (!this.sort) {
        return;
      }
  
      if (increment) {
        // assign the index to the view
        view._index = index;
  
        // increment the index of views after this one
        this.children.each(function (laterView) {
          if (laterView._index >= view._index) {
            laterView._index++;
          }
        });
      }
      else {
        // decrement the index of views after this one
        this.children.each(function (laterView) {
          if (laterView._index >= view._index) {
            laterView._index--;
          }
        });
      }
    },
  
  
    // Internal Method. Add the view to children and render it at
    // the given index.
    _addChildView: function(view, index) {
      // set up the child view event forwarding
      this.proxyChildEvents(view);
  
      this.triggerMethod('before:add:child', view);
  
      // Store the child view itself so we can properly
      // remove and/or destroy it later
      this.children.add(view);
      this.renderChildView(view, index);
  
      if (this._isShown && !this.isBuffering){
        if (_.isFunction(view.triggerMethod)) {
          view.triggerMethod('show');
        } else {
          Marionette.triggerMethod.call(view, 'show');
        }
      }
  
      this.triggerMethod('add:child', view);
    },
  
    // render the child view
    renderChildView: function(view, index) {
      view.render();
      this.attachHtml(this, view, index);
    },
  
    // Build a `childView` for a model in the collection.
    buildChildView: function(child, ChildViewClass, childViewOptions) {
      var options = _.extend({model: child}, childViewOptions);
      return new ChildViewClass(options);
    },
  
    // Remove the child view and destroy it.
    // This function also updates the indices of
    // later views in the collection in order to keep
    // the children in sync with the collection.
    removeChildView: function(view) {
  
      if (view) {
        this.triggerMethod('before:remove:child', view);
        // call 'destroy' or 'remove', depending on which is found
        if (view.destroy) { view.destroy(); }
        else if (view.remove) { view.remove(); }
  
        this.stopListening(view);
        this.children.remove(view);
        this.triggerMethod('remove:child', view);
  
        // decrement the index of views after this one
        this._updateIndices(view, false);
      }
  
    },
  
    // check if the collection is empty
    isEmpty: function(collection) {
      return !this.collection || this.collection.length === 0;
    },
  
    // If empty, show the empty view
    checkEmpty: function() {
      if (this.isEmpty(this.collection)) {
        this.showEmptyView();
      }
    },
  
    // You might need to override this if you've overridden attachHtml
    attachBuffer: function(collectionView, buffer) {
      collectionView.$el.append(buffer);
    },
  
    // Append the HTML to the collection's `el`.
    // Override this method to do something other
    // than `.append`.
    attachHtml: function(collectionView, childView, index) {
      if (collectionView.isBuffering) {
        // buffering happens on reset events and initial renders
        // in order to reduce the number of inserts into the
        // document, which are expensive.
        collectionView.elBuffer.appendChild(childView.el);
        collectionView._bufferedChildren.push(childView);
      }
      else {
        // If we've already rendered the main collection, append
        // the new child into the correct order if we need to. Otherwise
        // append to the end.
        if (!collectionView._insertBefore(childView, index)){
          collectionView._insertAfter(childView);
        }
      }
    },
  
    // Internal method. Check whether we need to insert the view into
    // the correct position.
    _insertBefore: function(childView, index) {
      var currentView;
      var findPosition = this.sort && (index < this.children.length - 1);
      if (findPosition) {
        // Find the view after this one
        currentView = this.children.find(function (view) {
          return view._index === index + 1;
        });
      }
  
      if (currentView) {
        currentView.$el.before(childView.el);
        return true;
      }
  
      return false;
    },
  
    // Internal method. Append a view to the end of the $el
    _insertAfter: function(childView) {
      this.$el.append(childView.el);
    },
  
    // Internal method to set up the `children` object for
    // storing all of the child views
    _initChildViewStorage: function() {
      this.children = new Backbone.ChildViewContainer();
    },
  
    // Handle cleanup and other destroying needs for the collection of views
    destroy: function() {
      if (this.isDestroyed) { return; }
  
      this.triggerMethod('before:destroy:collection');
      this.destroyChildren();
      this.triggerMethod('destroy:collection');
  
      Marionette.View.prototype.destroy.apply(this, arguments);
    },
  
    // Destroy the child views that this collection view
    // is holding on to, if any
    destroyChildren: function() {
      this.children.each(this.removeChildView, this);
      this.checkEmpty();
    },
  
    // Set up the child view event forwarding. Uses a "childview:"
    // prefix in front of all forwarded events.
    proxyChildEvents: function(view) {
      var prefix = this.getOption('childViewEventPrefix');
  
      // Forward all child view events through the parent,
      // prepending "childview:" to the event name
      this.listenTo(view, 'all', function() {
        var args = Array.prototype.slice.call(arguments);
        var rootEvent = args[0];
        var childEvents = this.normalizeMethods(_.result(this, 'childEvents'));
  
        args[0] = prefix + ':' + rootEvent;
        args.splice(1, 0, view);
  
        // call collectionView childEvent if defined
        if (typeof childEvents !== 'undefined' && _.isFunction(childEvents[rootEvent])) {
          childEvents[rootEvent].apply(this, args.slice(1));
        }
  
        this.triggerMethod.apply(this, args);
      }, this);
    }
  });
  
  /* jshint maxstatements: 17, maxlen: 117 */
  
  // Composite View
  // --------------
  
  // Used for rendering a branch-leaf, hierarchical structure.
  // Extends directly from CollectionView and also renders an
  // a child view as `modelView`, for the top leaf
  Marionette.CompositeView = Marionette.CollectionView.extend({
  
    // Setting up the inheritance chain which allows changes to
    // Marionette.CollectionView.prototype.constructor which allows overriding
    // option to pass '{sort: false}' to prevent the CompositeView from
    // maintaining the sorted order of the collection.
    // This will fallback onto appending childView's to the end.
    constructor: function() {
      Marionette.CollectionView.apply(this, arguments);
    },
  
    // Configured the initial events that the composite view
    // binds to. Override this method to prevent the initial
    // events, or to add your own initial events.
    _initialEvents: function() {
  
      // Bind only after composite view is rendered to avoid adding child views
      // to nonexistent childViewContainer
      this.once('render', function() {
        if (this.collection) {
          this.listenTo(this.collection, 'add', this._onCollectionAdd);
          this.listenTo(this.collection, 'remove', this._onCollectionRemove);
          this.listenTo(this.collection, 'reset', this._renderChildren);
  
          if (this.sort) {
            this.listenTo(this.collection, 'sort', this._sortViews);
          }
        }
      });
  
    },
  
    // Retrieve the `childView` to be used when rendering each of
    // the items in the collection. The default is to return
    // `this.childView` or Marionette.CompositeView if no `childView`
    // has been defined
    getChildView: function(child) {
      var childView = this.getOption('childView') || this.constructor;
  
      if (!childView) {
        throwError('A "childView" must be specified', 'NoChildViewError');
      }
  
      return childView;
    },
  
    // Serialize the collection for the view.
    // You can override the `serializeData` method in your own view
    // definition, to provide custom serialization for your view's data.
    serializeData: function() {
      var data = {};
  
      if (this.model) {
        data = this.model.toJSON();
      }
  
      return data;
    },
  
    // Renders the model once, and the collection once. Calling
    // this again will tell the model's view to re-render itself
    // but the collection will not re-render.
    render: function() {
      this._ensureViewIsIntact();
      this.isRendered = true;
      this.resetChildViewContainer();
  
      this.triggerMethod('before:render', this);
  
      this._renderRoot();
      this._renderChildren();
  
      this.triggerMethod('render', this);
      return this;
    },
  
    _renderChildren: function() {
      if (this.isRendered) {
        Marionette.CollectionView.prototype._renderChildren.call(this);
      }
    },
  
    // Render the root template that the children
    // views are appended to
    _renderRoot: function() {
      var data = {};
      data = this.serializeData();
      data = this.mixinTemplateHelpers(data);
  
      this.triggerMethod('before:render:template');
  
      var template = this.getTemplate();
      var html = Marionette.Renderer.render(template, data);
      this.attachElContent(html);
  
      // the ui bindings is done here and not at the end of render since they
      // will not be available until after the model is rendered, but should be
      // available before the collection is rendered.
      this.bindUIElements();
      this.triggerMethod('render:template');
    },
  
    // Attaches the content of the root.
    // This method can be overriden to optimize rendering,
    // or to render in a non standard way.
    //
    // For example, using `innerHTML` instead of `$el.html`
    //
    // ```js
    // attachElContent: function(html) {
    //   this.el.innerHTML = html;
    //   return this;
    // }
    // ```
    attachElContent: function(html) {
      this.$el.html(html);
  
      return this;
    },
  
    // You might need to override this if you've overridden attachHtml
    attachBuffer: function(compositeView, buffer) {
      var $container = this.getChildViewContainer(compositeView);
      $container.append(buffer);
    },
  
    // Internal method. Append a view to the end of the $el.
    // Overidden from CollectionView to ensure view is appended to
    // childViewContainer
    _insertAfter: function (childView) {
      var $container = this.getChildViewContainer(this);
      $container.append(childView.el);
    },
  
    // Internal method to ensure an `$childViewContainer` exists, for the
    // `attachHtml` method to use.
    getChildViewContainer: function(containerView) {
      if ('$childViewContainer' in containerView) {
        return containerView.$childViewContainer;
      }
  
      var container;
      var childViewContainer = Marionette.getOption(containerView, 'childViewContainer');
      if (childViewContainer) {
  
        var selector = _.isFunction(childViewContainer) ? childViewContainer.call(containerView) : childViewContainer;
  
        if (selector.charAt(0) === '@' && containerView.ui) {
          container = containerView.ui[selector.substr(4)];
        } else {
          container = containerView.$(selector);
        }
  
        if (container.length <= 0) {
          throwError('The specified "childViewContainer" was not found: ' +
            containerView.childViewContainer, 'ChildViewContainerMissingError');
        }
  
      } else {
        container = containerView.$el;
      }
  
      containerView.$childViewContainer = container;
      return container;
    },
  
    // Internal method to reset the `$childViewContainer` on render
    resetChildViewContainer: function() {
      if (this.$childViewContainer) {
        delete this.$childViewContainer;
      }
    }
  });
  
  // LayoutView
  // ----------
  
  // Used for managing application layoutViews, nested layoutViews and
  // multiple regions within an application or sub-application.
  //
  // A specialized view class that renders an area of HTML and then
  // attaches `Region` instances to the specified `regions`.
  // Used for composite view management and sub-application areas.
  Marionette.LayoutView = Marionette.ItemView.extend({
    regionClass: Marionette.Region,
  
    // Ensure the regions are available when the `initialize` method
    // is called.
    constructor: function(options) {
      options = options || {};
  
      this._firstRender = true;
      this._initializeRegions(options);
  
      Marionette.ItemView.call(this, options);
    },
  
    // LayoutView's render will use the existing region objects the
    // first time it is called. Subsequent calls will destroy the
    // views that the regions are showing and then reset the `el`
    // for the regions to the newly rendered DOM elements.
    render: function() {
      this._ensureViewIsIntact();
  
      if (this._firstRender) {
        // if this is the first render, don't do anything to
        // reset the regions
        this._firstRender = false;
      } else {
        // If this is not the first render call, then we need to
        // re-initialize the `el` for each region
        this._reInitializeRegions();
      }
  
      return Marionette.ItemView.prototype.render.apply(this, arguments);
    },
  
    // Handle destroying regions, and then destroy the view itself.
    destroy: function() {
      if (this.isDestroyed) { return; }
  
      this.regionManager.destroy();
      Marionette.ItemView.prototype.destroy.apply(this, arguments);
    },
  
    // Add a single region, by name, to the layoutView
    addRegion: function(name, definition) {
      this.triggerMethod('before:region:add', name);
      var regions = {};
      regions[name] = definition;
      return this._buildRegions(regions)[name];
    },
  
    // Add multiple regions as a {name: definition, name2: def2} object literal
    addRegions: function(regions) {
      this.regions = _.extend({}, this.regions, regions);
      return this._buildRegions(regions);
    },
  
    // Remove a single region from the LayoutView, by name
    removeRegion: function(name) {
      this.triggerMethod('before:region:remove', name);
      delete this.regions[name];
      return this.regionManager.removeRegion(name);
    },
  
    // Provides alternative access to regions
    // Accepts the region name
    // getRegion('main')
    getRegion: function(region) {
      return this.regionManager.get(region);
    },
  
    // Get all regions
    getRegions: function(){
      return this.regionManager.getRegions();
    },
  
    // internal method to build regions
    _buildRegions: function(regions) {
      var that = this;
  
      var defaults = {
        regionClass: this.getOption('regionClass'),
        parentEl: function() { return that.$el; }
      };
  
      return this.regionManager.addRegions(regions, defaults);
    },
  
    // Internal method to initialize the regions that have been defined in a
    // `regions` attribute on this layoutView.
    _initializeRegions: function(options) {
      var regions;
      this._initRegionManager();
  
      if (_.isFunction(this.regions)) {
        regions = this.regions(options);
      } else {
        regions = this.regions || {};
      }
  
      // Enable users to define `regions` as instance options.
      var regionOptions = this.getOption.call(options, 'regions');
  
      // enable region options to be a function
      if (_.isFunction(regionOptions)) {
        regionOptions = regionOptions.call(this, options);
      }
  
      _.extend(regions, regionOptions);
  
      this.addRegions(regions);
    },
  
    // Internal method to re-initialize all of the regions by updating the `el` that
    // they point to
    _reInitializeRegions: function() {
      this.regionManager.emptyRegions();
      this.regionManager.each(function(region) {
        region.reset();
      });
    },
  
    // Enable easy overiding of the default `RegionManager`
    // for customized region interactions and buisness specific
    // view logic for better control over single regions.
    getRegionManager: function() {
      return new Marionette.RegionManager();
    },
  
    // Internal method to initialize the region manager
    // and all regions in it
    _initRegionManager: function() {
      this.regionManager = this.getRegionManager();
  
      this.listenTo(this.regionManager, 'before:add:region', function(name) {
        this.triggerMethod('before:add:region', name);
      });
  
      this.listenTo(this.regionManager, 'add:region', function(name, region) {
        this[name] = region;
        this.triggerMethod('add:region', name, region);
      });
  
      this.listenTo(this.regionManager, 'before:remove:region', function(name) {
        this.triggerMethod('before:remove:region', name);
      });
  
      this.listenTo(this.regionManager, 'remove:region', function(name, region) {
        delete this[name];
        this.triggerMethod('remove:region', name, region);
      });
    }
  });
  

  // Behavior
  // -----------
  
  // A Behavior is an isolated set of DOM /
  // user interactions that can be mixed into any View.
  // Behaviors allow you to blackbox View specific interactions
  // into portable logical chunks, keeping your views simple and your code DRY.
  
  Marionette.Behavior = (function(_, Backbone) {
    function Behavior(options, view) {
      // Setup reference to the view.
      // this comes in handle when a behavior
      // wants to directly talk up the chain
      // to the view.
      this.view = view;
      this.defaults = _.result(this, 'defaults') || {};
      this.options  = _.extend({}, this.defaults, options);
  
      // proxy behavior $ method to the view
      // this is useful for doing jquery DOM lookups
      // scoped to behaviors view.
      this.$ = function() {
        return this.view.$.apply(this.view, arguments);
      };
  
      // Call the initialize method passing
      // the arguments from the instance constructor
      this.initialize.apply(this, arguments);
    }
  
    _.extend(Behavior.prototype, Backbone.Events, {
      initialize: function() {},
  
      // stopListening to behavior `onListen` events.
      destroy: function() {
        this.stopListening();
      },
  
      // import the `triggerMethod` to trigger events with corresponding
      // methods if the method exists
      triggerMethod: Marionette.triggerMethod,
  
      // Proxy `getOption` to enable getting options from this or this.options by name.
      getOption: Marionette.proxyGetOption,
  
      // Proxy `unbindEntityEvents` to enable binding view's events from another entity.
      bindEntityEvents: Marionette.proxyBindEntityEvents,
  
      // Proxy `unbindEntityEvents` to enable unbinding view's events from another entity.
      unbindEntityEvents: Marionette.proxyUnbindEntityEvents
    });
  
    // Borrow Backbones extend implementation
    // this allows us to setup a proper
    // inheritence pattern that follow in suite
    // with the rest of Marionette views.
    Behavior.extend = Marionette.extend;
  
    return Behavior;
  })(_, Backbone);
  
  /* jshint maxlen: 143, nonew: false */
  // Marionette.Behaviors
  // --------
  
  // Behaviors is a utility class that takes care of
  // glueing your behavior instances to their given View.
  // The most important part of this class is that you
  // **MUST** override the class level behaviorsLookup
  // method for things to work properly.
  
  Marionette.Behaviors = (function(Marionette, _) {
  
    function Behaviors(view, behaviors) {
      // Behaviors defined on a view can be a flat object literal
      // or it can be a function that returns an object.
      behaviors = Behaviors.parseBehaviors(view, behaviors || _.result(view, 'behaviors'));
  
      // Wraps several of the view's methods
      // calling the methods first on each behavior
      // and then eventually calling the method on the view.
      Behaviors.wrap(view, behaviors, _.keys(methods));
    }
  
    var methods = {
      setElement: function(setElement, behaviors) {
        setElement.apply(this, _.tail(arguments, 2));
  
        // proxy behavior $el to the view's $el.
        // This is needed because a view's $el proxy
        // is not set until after setElement is called.
        _.each(behaviors, function(b) {
          b.$el = this.$el;
        }, this);
      },
  
      destroy: function(destroy, behaviors) {
        var args = _.tail(arguments, 2);
        destroy.apply(this, args);
  
        // Call destroy on each behavior after
        // destroying the view.
        // This unbinds event listeners
        // that behaviors have registerd for.
        _.invoke(behaviors, 'destroy', args);
      },
  
      bindUIElements: function(bindUIElements, behaviors) {
        bindUIElements.apply(this);
        _.invoke(behaviors, bindUIElements);
      },
  
      unbindUIElements: function(unbindUIElements, behaviors) {
        unbindUIElements.apply(this);
        _.invoke(behaviors, unbindUIElements);
      },
  
      triggerMethod: function(triggerMethod, behaviors) {
        var args = _.tail(arguments, 2);
        triggerMethod.apply(this, args);
  
        _.each(behaviors, function(b) {
          triggerMethod.apply(b, args);
        });
      },
  
      delegateEvents: function(delegateEvents, behaviors) {
        var args = _.tail(arguments, 2);
        delegateEvents.apply(this, args);
  
        _.each(behaviors, function(b) {
          Marionette.bindEntityEvents(b, this.model, Marionette.getOption(b, 'modelEvents'));
          Marionette.bindEntityEvents(b, this.collection, Marionette.getOption(b, 'collectionEvents'));
        }, this);
      },
  
      undelegateEvents: function(undelegateEvents, behaviors) {
        var args = _.tail(arguments, 2);
        undelegateEvents.apply(this, args);
  
        _.each(behaviors, function(b) {
          Marionette.unbindEntityEvents(b, this.model, Marionette.getOption(b, 'modelEvents'));
          Marionette.unbindEntityEvents(b, this.collection, Marionette.getOption(b, 'collectionEvents'));
        }, this);
      },
  
      behaviorEvents: function(behaviorEvents, behaviors) {
        var _behaviorsEvents = {};
        var viewUI = _.result(this, 'ui');
  
        _.each(behaviors, function(b, i) {
          var _events = {};
          var behaviorEvents = _.clone(_.result(b, 'events')) || {};
          var behaviorUI = _.result(b, 'ui');
  
          // Construct an internal UI hash first using
          // the views UI hash and then the behaviors UI hash.
          // This allows the user to use UI hash elements
          // defined in the parent view as well as those
          // defined in the given behavior.
          var ui = _.extend({}, viewUI, behaviorUI);
  
          // Normalize behavior events hash to allow
          // a user to use the @ui. syntax.
          behaviorEvents = Marionette.normalizeUIKeys(behaviorEvents, ui);
  
          _.each(_.keys(behaviorEvents), function(key) {
            // Append white-space at the end of each key to prevent behavior key collisions.
            // This is relying on the fact that backbone events considers "click .foo" the same as
            // "click .foo ".
  
            // +2 is used because new Array(1) or 0 is "" and not " "
            var whitespace = (new Array(i + 2)).join(' ');
            var eventKey   = key + whitespace;
            var handler    = _.isFunction(behaviorEvents[key]) ? behaviorEvents[key] : b[behaviorEvents[key]];
  
            _events[eventKey] = _.bind(handler, b);
          });
  
          _behaviorsEvents = _.extend(_behaviorsEvents, _events);
        });
  
        return _behaviorsEvents;
      }
    };
  
    _.extend(Behaviors, {
  
      // Placeholder method to be extended by the user.
      // The method should define the object that stores the behaviors.
      // i.e.
      //
      // ```js
      // Marionette.Behaviors.behaviorsLookup: function() {
      //   return App.Behaviors
      // }
      // ```
      behaviorsLookup: function() {
        throw new Error('You must define where your behaviors are stored.' +
          'See https://github.com/marionettejs/backbone.marionette' +
          '/blob/master/docs/marionette.behaviors.md#behaviorslookup');
      },
  
      // Takes care of getting the behavior class
      // given options and a key.
      // If a user passes in options.behaviorClass
      // default to using that. Otherwise delegate
      // the lookup to the users `behaviorsLookup` implementation.
      getBehaviorClass: function(options, key) {
        if (options.behaviorClass) {
          return options.behaviorClass;
        }
  
        // Get behavior class can be either a flat object or a method
        return _.isFunction(Behaviors.behaviorsLookup) ? Behaviors.behaviorsLookup.apply(this, arguments)[key] : Behaviors.behaviorsLookup[key];
      },
  
      // Iterate over the behaviors object, for each behavior
      // instantiate it and get its grouped behaviors.
      parseBehaviors: function(view, behaviors) {
        return _.chain(behaviors).map(function(options, key) {
          var BehaviorClass = Behaviors.getBehaviorClass(options, key);
  
          var behavior = new BehaviorClass(options, view);
          var nestedBehaviors = Behaviors.parseBehaviors(view, _.result(behavior, 'behaviors'));
  
          return [behavior].concat(nestedBehaviors);
        }).flatten().value();
      },
  
      // Wrap view internal methods so that they delegate to behaviors. For example,
      // `onDestroy` should trigger destroy on all of the behaviors and then destroy itself.
      // i.e.
      //
      // `view.delegateEvents = _.partial(methods.delegateEvents, view.delegateEvents, behaviors);`
      wrap: function(view, behaviors, methodNames) {
        _.each(methodNames, function(methodName) {
          view[methodName] = _.partial(methods[methodName], view[methodName], behaviors);
        });
      }
    });
  
    return Behaviors;
  
  })(Marionette, _);
  

  // AppRouter
  // ---------
  
  // Reduce the boilerplate code of handling route events
  // and then calling a single method on another object.
  // Have your routers configured to call the method on
  // your object, directly.
  //
  // Configure an AppRouter with `appRoutes`.
  //
  // App routers can only take one `controller` object.
  // It is recommended that you divide your controller
  // objects in to smaller pieces of related functionality
  // and have multiple routers / controllers, instead of
  // just one giant router and controller.
  //
  // You can also add standard routes to an AppRouter.
  
  Marionette.AppRouter = Backbone.Router.extend({
  
    constructor: function(options) {
      Backbone.Router.apply(this, arguments);
  
      this.options = options || {};
  
      var appRoutes = this.getOption('appRoutes');
      var controller = this._getController();
      this.processAppRoutes(controller, appRoutes);
      this.on('route', this._processOnRoute, this);
    },
  
    // Similar to route method on a Backbone Router but
    // method is called on the controller
    appRoute: function(route, methodName) {
      var controller = this._getController();
      this._addAppRoute(controller, route, methodName);
    },
  
    // process the route event and trigger the onRoute
    // method call, if it exists
    _processOnRoute: function(routeName, routeArgs) {
      // find the path that matched
      var routePath = _.invert(this.appRoutes)[routeName];
  
      // make sure an onRoute is there, and call it
      if (_.isFunction(this.onRoute)) {
        this.onRoute(routeName, routePath, routeArgs);
      }
    },
  
    // Internal method to process the `appRoutes` for the
    // router, and turn them in to routes that trigger the
    // specified method on the specified `controller`.
    processAppRoutes: function(controller, appRoutes) {
      if (!appRoutes) { return; }
  
      var routeNames = _.keys(appRoutes).reverse(); // Backbone requires reverted order of routes
  
      _.each(routeNames, function(route) {
        this._addAppRoute(controller, route, appRoutes[route]);
      }, this);
    },
  
    _getController: function() {
      return this.getOption('controller');
    },
  
    _addAppRoute: function(controller, route, methodName) {
      var method = controller[methodName];
  
      if (!method) {
        throwError('Method "' + methodName + '" was not found on the controller');
      }
  
      this.route(route, methodName, _.bind(method, controller));
    },
  
    // Proxy `getOption` to enable getting options from this or this.options by name.
    getOption: Marionette.proxyGetOption
  });
  
  // Application
  // -----------
  
  // Contain and manage the composite application as a whole.
  // Stores and starts up `Region` objects, includes an
  // event aggregator as `app.vent`
  Marionette.Application = function(options) {
    this._initRegionManager();
    this._initCallbacks = new Marionette.Callbacks();
    var globalCh = Backbone.Wreqr.radio.channel('global');
    this.vent = globalCh.vent;
    this.commands = globalCh.commands;
    this.reqres = globalCh.reqres;
    this.submodules = {};
  
    _.extend(this, options);
  };
  
  _.extend(Marionette.Application.prototype, Backbone.Events, {
    // Command execution, facilitated by Backbone.Wreqr.Commands
    execute: function() {
      this.commands.execute.apply(this.commands, arguments);
    },
  
    // Request/response, facilitated by Backbone.Wreqr.RequestResponse
    request: function() {
      return this.reqres.request.apply(this.reqres, arguments);
    },
  
    // Add an initializer that is either run at when the `start`
    // method is called, or run immediately if added after `start`
    // has already been called.
    addInitializer: function(initializer) {
      this._initCallbacks.add(initializer);
    },
  
    // kick off all of the application's processes.
    // initializes all of the regions that have been added
    // to the app, and runs all of the initializer functions
    start: function(options) {
      this.triggerMethod('before:start', options);
      this._initCallbacks.run(options, this);
      this.triggerMethod('start', options);
    },
  
    // Add regions to your app.
    // Accepts a hash of named strings or Region objects
    // addRegions({something: "#someRegion"})
    // addRegions({something: Region.extend({el: "#someRegion"}) });
    addRegions: function(regions) {
      return this._regionManager.addRegions(regions);
    },
  
    // Empty all regions in the app, without removing them
    emptyRegions: function() {
      this._regionManager.emptyRegions();
    },
  
    // Removes a region from your app, by name
    // Accepts the regions name
    // removeRegion('myRegion')
    removeRegion: function(region) {
      this._regionManager.removeRegion(region);
    },
  
    // Provides alternative access to regions
    // Accepts the region name
    // getRegion('main')
    getRegion: function(region) {
      return this._regionManager.get(region);
    },
  
    // Get all the regions from the region manager
    getRegions: function(){
      return this._regionManager.getRegions();
    },
  
    // Create a module, attached to the application
    module: function(moduleNames, moduleDefinition) {
  
      // Overwrite the module class if the user specifies one
      var ModuleClass = Marionette.Module.getClass(moduleDefinition);
  
      // slice the args, and add this application object as the
      // first argument of the array
      var args = slice.call(arguments);
      args.unshift(this);
  
      // see the Marionette.Module object for more information
      return ModuleClass.create.apply(ModuleClass, args);
    },
  
    // Internal method to set up the region manager
    _initRegionManager: function() {
      this._regionManager = new Marionette.RegionManager();
  
      this.listenTo(this._regionManager, 'before:add:region', function(name) {
        this.triggerMethod('before:add:region', name);
      });
  
      this.listenTo(this._regionManager, 'add:region', function(name, region) {
        this[name] = region;
        this.triggerMethod('add:region', name, region);
      });
  
      this.listenTo(this._regionManager, 'before:remove:region', function(name) {
        this.triggerMethod('before:remove:region', name);
      });
  
      this.listenTo(this._regionManager, 'remove:region', function(name, region) {
        delete this[name];
        this.triggerMethod('remove:region', name, region);
      });
    },
  
    // import the `triggerMethod` to trigger events with corresponding
    // methods if the method exists
    triggerMethod: Marionette.triggerMethod
  });
  
  // Copy the `extend` function used by Backbone's classes
  Marionette.Application.extend = Marionette.extend;
  
  /* jshint maxparams: 9 */
  
  // Module
  // ------
  
  // A simple module system, used to create privacy and encapsulation in
  // Marionette applications
  Marionette.Module = function(moduleName, app, options) {
    this.moduleName = moduleName;
    this.options = _.extend({}, this.options, options);
    // Allow for a user to overide the initialize
    // for a given module instance.
    this.initialize = options.initialize || this.initialize;
  
    // Set up an internal store for sub-modules.
    this.submodules = {};
  
    this._setupInitializersAndFinalizers();
  
    // Set an internal reference to the app
    // within a module.
    this.app = app;
  
    // By default modules start with their parents.
    this.startWithParent = true;
  
    if (_.isFunction(this.initialize)) {
      this.initialize(moduleName, app, this.options);
    }
  };
  
  Marionette.Module.extend = Marionette.extend;
  
  // Extend the Module prototype with events / listenTo, so that the module
  // can be used as an event aggregator or pub/sub.
  _.extend(Marionette.Module.prototype, Backbone.Events, {
  
    // Initialize is an empty function by default. Override it with your own
    // initialization logic when extending Marionette.Module.
    initialize: function() {},
  
    // Initializer for a specific module. Initializers are run when the
    // module's `start` method is called.
    addInitializer: function(callback) {
      this._initializerCallbacks.add(callback);
    },
  
    // Finalizers are run when a module is stopped. They are used to teardown
    // and finalize any variables, references, events and other code that the
    // module had set up.
    addFinalizer: function(callback) {
      this._finalizerCallbacks.add(callback);
    },
  
    // Start the module, and run all of its initializers
    start: function(options) {
      // Prevent re-starting a module that is already started
      if (this._isInitialized) { return; }
  
      // start the sub-modules (depth-first hierarchy)
      _.each(this.submodules, function(mod) {
        // check to see if we should start the sub-module with this parent
        if (mod.startWithParent) {
          mod.start(options);
        }
      });
  
      // run the callbacks to "start" the current module
      this.triggerMethod('before:start', options);
  
      this._initializerCallbacks.run(options, this);
      this._isInitialized = true;
  
      this.triggerMethod('start', options);
    },
  
    // Stop this module by running its finalizers and then stop all of
    // the sub-modules for this module
    stop: function() {
      // if we are not initialized, don't bother finalizing
      if (!this._isInitialized) { return; }
      this._isInitialized = false;
  
      this.triggerMethod('before:stop');
  
      // stop the sub-modules; depth-first, to make sure the
      // sub-modules are stopped / finalized before parents
      _.each(this.submodules, function(mod) { mod.stop(); });
  
      // run the finalizers
      this._finalizerCallbacks.run(undefined, this);
  
      // reset the initializers and finalizers
      this._initializerCallbacks.reset();
      this._finalizerCallbacks.reset();
  
      this.triggerMethod('stop');
    },
  
    // Configure the module with a definition function and any custom args
    // that are to be passed in to the definition function
    addDefinition: function(moduleDefinition, customArgs) {
      this._runModuleDefinition(moduleDefinition, customArgs);
    },
  
    // Internal method: run the module definition function with the correct
    // arguments
    _runModuleDefinition: function(definition, customArgs) {
      // If there is no definition short circut the method.
      if (!definition) { return; }
  
      // build the correct list of arguments for the module definition
      var args = _.flatten([
        this,
        this.app,
        Backbone,
        Marionette,
        Backbone.$, _,
        customArgs
      ]);
  
      definition.apply(this, args);
    },
  
    // Internal method: set up new copies of initializers and finalizers.
    // Calling this method will wipe out all existing initializers and
    // finalizers.
    _setupInitializersAndFinalizers: function() {
      this._initializerCallbacks = new Marionette.Callbacks();
      this._finalizerCallbacks = new Marionette.Callbacks();
    },
  
    // import the `triggerMethod` to trigger events with corresponding
    // methods if the method exists
    triggerMethod: Marionette.triggerMethod
  });
  
  // Class methods to create modules
  _.extend(Marionette.Module, {
  
    // Create a module, hanging off the app parameter as the parent object.
    create: function(app, moduleNames, moduleDefinition) {
      var module = app;
  
      // get the custom args passed in after the module definition and
      // get rid of the module name and definition function
      var customArgs = slice.call(arguments);
      customArgs.splice(0, 3);
  
      // Split the module names and get the number of submodules.
      // i.e. an example module name of `Doge.Wow.Amaze` would
      // then have the potential for 3 module definitions.
      moduleNames = moduleNames.split('.');
      var length = moduleNames.length;
  
      // store the module definition for the last module in the chain
      var moduleDefinitions = [];
      moduleDefinitions[length - 1] = moduleDefinition;
  
      // Loop through all the parts of the module definition
      _.each(moduleNames, function(moduleName, i) {
        var parentModule = module;
        module = this._getModule(parentModule, moduleName, app, moduleDefinition);
        this._addModuleDefinition(parentModule, module, moduleDefinitions[i], customArgs);
      }, this);
  
      // Return the last module in the definition chain
      return module;
    },
  
    _getModule: function(parentModule, moduleName, app, def, args) {
      var options = _.extend({}, def);
      var ModuleClass = this.getClass(def);
  
      // Get an existing module of this name if we have one
      var module = parentModule[moduleName];
  
      if (!module) {
        // Create a new module if we don't have one
        module = new ModuleClass(moduleName, app, options);
        parentModule[moduleName] = module;
        // store the module on the parent
        parentModule.submodules[moduleName] = module;
      }
  
      return module;
    },
  
    // ## Module Classes
    //
    // Module classes can be used as an alternative to the define pattern.
    // The extend function of a Module is identical to the extend functions
    // on other Backbone and Marionette classes.
    // This allows module lifecyle events like `onStart` and `onStop` to be called directly.
    getClass: function(moduleDefinition) {
      var ModuleClass = Marionette.Module;
  
      if (!moduleDefinition) {
        return ModuleClass;
      }
  
      // If all of the module's functionality is defined inside its class,
      // then the class can be passed in directly. `MyApp.module("Foo", FooModule)`.
      if (moduleDefinition.prototype instanceof ModuleClass) {
        return moduleDefinition;
      }
  
      return moduleDefinition.moduleClass || ModuleClass;
    },
  
    // Add the module definition and add a startWithParent initializer function.
    // This is complicated because module definitions are heavily overloaded
    // and support an anonymous function, module class, or options object
    _addModuleDefinition: function(parentModule, module, def, args) {
      var fn = this._getDefine(def);
      var startWithParent = this._getStartWithParent(def, module);
  
      if (fn) {
        module.addDefinition(fn, args);
      }
  
      this._addStartWithParent(parentModule, module, startWithParent);
    },
  
    _getStartWithParent: function(def, module) {
      var swp;
  
      if (_.isFunction(def) && (def.prototype instanceof Marionette.Module)) {
        swp = module.constructor.prototype.startWithParent;
        return _.isUndefined(swp) ? true : swp;
      }
  
      if (_.isObject(def)) {
        swp = def.startWithParent;
        return _.isUndefined(swp) ? true : swp;
      }
  
      return true;
    },
  
    _getDefine: function(def) {
      if (_.isFunction(def) && !(def.prototype instanceof Marionette.Module)) {
        return def;
      }
  
      if (_.isObject(def)) {
        return def.define;
      }
  
      return null;
    },
  
    _addStartWithParent: function(parentModule, module, startWithParent) {
      module.startWithParent = module.startWithParent && startWithParent;
  
      if (!module.startWithParent || !!module.startWithParentIsConfigured) {
        return;
      }
  
      module.startWithParentIsConfigured = true;
  
      parentModule.addInitializer(function(options) {
        if (module.startWithParent) {
          module.start(options);
        }
      });
    }
  });
  

  return Marionette;
}));

/*!

 handlebars v1.3.0

Copyright (C) 2011 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/
/* exported Handlebars */
var Handlebars = (function() {
// handlebars/safe-string.js
var __module4__ = (function() {
  "use strict";
  var __exports__;
  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = function() {
    return "" + this.string;
  };

  __exports__ = SafeString;
  return __exports__;
})();

// handlebars/utils.js
var __module3__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  /*jshint -W004 */
  var SafeString = __dependency1__;

  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr] || "&amp;";
  }

  function extend(obj, value) {
    for(var key in value) {
      if(Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = value[key];
      }
    }
  }

  __exports__.extend = extend;var toString = Object.prototype.toString;
  __exports__.toString = toString;
  // Sourced from lodash
  // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
  var isFunction = function(value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  __exports__.isFunction = isFunction;
  var isArray = Array.isArray || function(value) {
    return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
  };
  __exports__.isArray = isArray;

  function escapeExpression(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof SafeString) {
      return string.toString();
    } else if (!string && string !== 0) {
      return "";
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = "" + string;

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

  __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  __exports__.isEmpty = isEmpty;
  return __exports__;
})(__module4__);

// handlebars/exception.js
var __module5__ = (function() {
  "use strict";
  var __exports__;

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(message, node) {
    var line;
    if (node && node.firstLine) {
      line = node.firstLine;

      message += ' - ' + line + ':' + node.firstColumn;
    }

    var tmp = Error.prototype.constructor.call(this, message);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }

    if (line) {
      this.lineNumber = line;
      this.column = node.firstColumn;
    }
  }

  Exception.prototype = new Error();

  __exports__ = Exception;
  return __exports__;
})();

// handlebars/base.js
var __module2__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;

  var VERSION = "1.3.0";
  __exports__.VERSION = VERSION;var COMPILER_REVISION = 4;
  __exports__.COMPILER_REVISION = COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
    2: '== 1.0.0-rc.3',
    3: '== 1.0.0-rc.4',
    4: '>= 1.0.0'
  };
  __exports__.REVISION_CHANGES = REVISION_CHANGES;
  var isArray = Utils.isArray,
      isFunction = Utils.isFunction,
      toString = Utils.toString,
      objectType = '[object Object]';

  function HandlebarsEnvironment(helpers, partials) {
    this.helpers = helpers || {};
    this.partials = partials || {};

    registerDefaultHelpers(this);
  }

  __exports__.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,

    logger: logger,
    log: log,

    registerHelper: function(name, fn, inverse) {
      if (toString.call(name) === objectType) {
        if (inverse || fn) { throw new Exception('Arg not supported with multiple helpers'); }
        Utils.extend(this.helpers, name);
      } else {
        if (inverse) { fn.not = inverse; }
        this.helpers[name] = fn;
      }
    },

    registerPartial: function(name, str) {
      if (toString.call(name) === objectType) {
        Utils.extend(this.partials,  name);
      } else {
        this.partials[name] = str;
      }
    }
  };

  function registerDefaultHelpers(instance) {
    instance.registerHelper('helperMissing', function(arg) {
      if(arguments.length === 2) {
        return undefined;
      } else {
        throw new Exception("Missing helper: '" + arg + "'");
      }
    });

    instance.registerHelper('blockHelperMissing', function(context, options) {
      var inverse = options.inverse || function() {}, fn = options.fn;

      if (isFunction(context)) { context = context.call(this); }

      if(context === true) {
        return fn(this);
      } else if(context === false || context == null) {
        return inverse(this);
      } else if (isArray(context)) {
        if(context.length > 0) {
          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        return fn(context);
      }
    });

    instance.registerHelper('each', function(context, options) {
      var fn = options.fn, inverse = options.inverse;
      var i = 0, ret = "", data;

      if (isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = createFrame(options.data);
      }

      if(context && typeof context === 'object') {
        if (isArray(context)) {
          for(var j = context.length; i<j; i++) {
            if (data) {
              data.index = i;
              data.first = (i === 0);
              data.last  = (i === (context.length-1));
            }
            ret = ret + fn(context[i], { data: data });
          }
        } else {
          for(var key in context) {
            if(context.hasOwnProperty(key)) {
              if(data) { 
                data.key = key; 
                data.index = i;
                data.first = (i === 0);
              }
              ret = ret + fn(context[key], {data: data});
              i++;
            }
          }
        }
      }

      if(i === 0){
        ret = inverse(this);
      }

      return ret;
    });

    instance.registerHelper('if', function(conditional, options) {
      if (isFunction(conditional)) { conditional = conditional.call(this); }

      // Default behavior is to render the positive path if the value is truthy and not empty.
      // The `includeZero` option may be set to treat the condtional as purely not empty based on the
      // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
      if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    instance.registerHelper('unless', function(conditional, options) {
      return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
    });

    instance.registerHelper('with', function(context, options) {
      if (isFunction(context)) { context = context.call(this); }

      if (!Utils.isEmpty(context)) return options.fn(context);
    });

    instance.registerHelper('log', function(context, options) {
      var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
      instance.log(level, context);
    });
  }

  var logger = {
    methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

    // State enum
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    level: 3,

    // can be overridden in the host environment
    log: function(level, obj) {
      if (logger.level <= level) {
        var method = logger.methodMap[level];
        if (typeof console !== 'undefined' && console[method]) {
          console[method].call(console, obj);
        }
      }
    }
  };
  __exports__.logger = logger;
  function log(level, obj) { logger.log(level, obj); }

  __exports__.log = log;var createFrame = function(object) {
    var obj = {};
    Utils.extend(obj, object);
    return obj;
  };
  __exports__.createFrame = createFrame;
  return __exports__;
})(__module3__, __module5__);

// handlebars/runtime.js
var __module6__ = (function(__dependency1__, __dependency2__, __dependency3__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;
  var COMPILER_REVISION = __dependency3__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency3__.REVISION_CHANGES;

  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1,
        currentRevision = COMPILER_REVISION;

    if (compilerRevision !== currentRevision) {
      if (compilerRevision < currentRevision) {
        var runtimeVersions = REVISION_CHANGES[currentRevision],
            compilerVersions = REVISION_CHANGES[compilerRevision];
        throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
              "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
      } else {
        // Use the embedded version info since the runtime doesn't know about this revision yet
        throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
              "Please update your runtime to a newer version ("+compilerInfo[1]+").");
      }
    }
  }

  __exports__.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

  function template(templateSpec, env) {
    if (!env) {
      throw new Exception("No environment passed to template");
    }

    // Note: Using env.VM references rather than local var references throughout this section to allow
    // for external users to override these as psuedo-supported APIs.
    var invokePartialWrapper = function(partial, name, context, helpers, partials, data) {
      var result = env.VM.invokePartial.apply(this, arguments);
      if (result != null) { return result; }

      if (env.compile) {
        var options = { helpers: helpers, partials: partials, data: data };
        partials[name] = env.compile(partial, { data: data !== undefined }, env);
        return partials[name](context, options);
      } else {
        throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
      }
    };

    // Just add water
    var container = {
      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          programWrapper = program(i, fn, data);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = program(i, fn);
        }
        return programWrapper;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common && (param !== common)) {
          ret = {};
          Utils.extend(ret, common);
          Utils.extend(ret, param);
        }
        return ret;
      },
      programWithDepth: env.VM.programWithDepth,
      noop: env.VM.noop,
      compilerInfo: null
    };

    return function(context, options) {
      options = options || {};
      var namespace = options.partial ? options : env,
          helpers,
          partials;

      if (!options.partial) {
        helpers = options.helpers;
        partials = options.partials;
      }
      var result = templateSpec.call(
            container,
            namespace, context,
            helpers,
            partials,
            options.data);

      if (!options.partial) {
        env.VM.checkRevision(container.compilerInfo);
      }

      return result;
    };
  }

  __exports__.template = template;function programWithDepth(i, fn, data /*, $depth */) {
    var args = Array.prototype.slice.call(arguments, 3);

    var prog = function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
    prog.program = i;
    prog.depth = args.length;
    return prog;
  }

  __exports__.programWithDepth = programWithDepth;function program(i, fn, data) {
    var prog = function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
    prog.program = i;
    prog.depth = 0;
    return prog;
  }

  __exports__.program = program;function invokePartial(partial, name, context, helpers, partials, data) {
    var options = { partial: true, helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    }
  }

  __exports__.invokePartial = invokePartial;function noop() { return ""; }

  __exports__.noop = noop;
  return __exports__;
})(__module3__, __module5__, __module2__);

// handlebars.runtime.js
var __module1__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var base = __dependency1__;

  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  var SafeString = __dependency2__;
  var Exception = __dependency3__;
  var Utils = __dependency4__;
  var runtime = __dependency5__;

  // For compatibility and usage outside of module systems, make the Handlebars object a namespace
  var create = function() {
    var hb = new base.HandlebarsEnvironment();

    Utils.extend(hb, base);
    hb.SafeString = SafeString;
    hb.Exception = Exception;
    hb.Utils = Utils;

    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };

    return hb;
  };

  var Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module2__, __module4__, __module5__, __module3__, __module6__);

// handlebars/compiler/ast.js
var __module7__ = (function(__dependency1__) {
  "use strict";
  var __exports__;
  var Exception = __dependency1__;

  function LocationInfo(locInfo){
    locInfo = locInfo || {};
    this.firstLine   = locInfo.first_line;
    this.firstColumn = locInfo.first_column;
    this.lastColumn  = locInfo.last_column;
    this.lastLine    = locInfo.last_line;
  }

  var AST = {
    ProgramNode: function(statements, inverseStrip, inverse, locInfo) {
      var inverseLocationInfo, firstInverseNode;
      if (arguments.length === 3) {
        locInfo = inverse;
        inverse = null;
      } else if (arguments.length === 2) {
        locInfo = inverseStrip;
        inverseStrip = null;
      }

      LocationInfo.call(this, locInfo);
      this.type = "program";
      this.statements = statements;
      this.strip = {};

      if(inverse) {
        firstInverseNode = inverse[0];
        if (firstInverseNode) {
          inverseLocationInfo = {
            first_line: firstInverseNode.firstLine,
            last_line: firstInverseNode.lastLine,
            last_column: firstInverseNode.lastColumn,
            first_column: firstInverseNode.firstColumn
          };
          this.inverse = new AST.ProgramNode(inverse, inverseStrip, inverseLocationInfo);
        } else {
          this.inverse = new AST.ProgramNode(inverse, inverseStrip);
        }
        this.strip.right = inverseStrip.left;
      } else if (inverseStrip) {
        this.strip.left = inverseStrip.right;
      }
    },

    MustacheNode: function(rawParams, hash, open, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "mustache";
      this.strip = strip;

      // Open may be a string parsed from the parser or a passed boolean flag
      if (open != null && open.charAt) {
        // Must use charAt to support IE pre-10
        var escapeFlag = open.charAt(3) || open.charAt(2);
        this.escaped = escapeFlag !== '{' && escapeFlag !== '&';
      } else {
        this.escaped = !!open;
      }

      if (rawParams instanceof AST.SexprNode) {
        this.sexpr = rawParams;
      } else {
        // Support old AST API
        this.sexpr = new AST.SexprNode(rawParams, hash);
      }

      this.sexpr.isRoot = true;

      // Support old AST API that stored this info in MustacheNode
      this.id = this.sexpr.id;
      this.params = this.sexpr.params;
      this.hash = this.sexpr.hash;
      this.eligibleHelper = this.sexpr.eligibleHelper;
      this.isHelper = this.sexpr.isHelper;
    },

    SexprNode: function(rawParams, hash, locInfo) {
      LocationInfo.call(this, locInfo);

      this.type = "sexpr";
      this.hash = hash;

      var id = this.id = rawParams[0];
      var params = this.params = rawParams.slice(1);

      // a mustache is an eligible helper if:
      // * its id is simple (a single part, not `this` or `..`)
      var eligibleHelper = this.eligibleHelper = id.isSimple;

      // a mustache is definitely a helper if:
      // * it is an eligible helper, and
      // * it has at least one parameter or hash segment
      this.isHelper = eligibleHelper && (params.length || hash);

      // if a mustache is an eligible helper but not a definite
      // helper, it is ambiguous, and will be resolved in a later
      // pass or at runtime.
    },

    PartialNode: function(partialName, context, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type         = "partial";
      this.partialName  = partialName;
      this.context      = context;
      this.strip = strip;
    },

    BlockNode: function(mustache, program, inverse, close, locInfo) {
      LocationInfo.call(this, locInfo);

      if(mustache.sexpr.id.original !== close.path.original) {
        throw new Exception(mustache.sexpr.id.original + " doesn't match " + close.path.original, this);
      }

      this.type = 'block';
      this.mustache = mustache;
      this.program  = program;
      this.inverse  = inverse;

      this.strip = {
        left: mustache.strip.left,
        right: close.strip.right
      };

      (program || inverse).strip.left = mustache.strip.right;
      (inverse || program).strip.right = close.strip.left;

      if (inverse && !program) {
        this.isInverse = true;
      }
    },

    ContentNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "content";
      this.string = string;
    },

    HashNode: function(pairs, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "hash";
      this.pairs = pairs;
    },

    IdNode: function(parts, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "ID";

      var original = "",
          dig = [],
          depth = 0;

      for(var i=0,l=parts.length; i<l; i++) {
        var part = parts[i].part;
        original += (parts[i].separator || '') + part;

        if (part === ".." || part === "." || part === "this") {
          if (dig.length > 0) {
            throw new Exception("Invalid path: " + original, this);
          } else if (part === "..") {
            depth++;
          } else {
            this.isScoped = true;
          }
        } else {
          dig.push(part);
        }
      }

      this.original = original;
      this.parts    = dig;
      this.string   = dig.join('.');
      this.depth    = depth;

      // an ID is simple if it only has one part, and that part is not
      // `..` or `this`.
      this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;

      this.stringModeValue = this.string;
    },

    PartialNameNode: function(name, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "PARTIAL_NAME";
      this.name = name.original;
    },

    DataNode: function(id, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "DATA";
      this.id = id;
    },

    StringNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "STRING";
      this.original =
        this.string =
        this.stringModeValue = string;
    },

    IntegerNode: function(integer, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "INTEGER";
      this.original =
        this.integer = integer;
      this.stringModeValue = Number(integer);
    },

    BooleanNode: function(bool, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "BOOLEAN";
      this.bool = bool;
      this.stringModeValue = bool === "true";
    },

    CommentNode: function(comment, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "comment";
      this.comment = comment;
    }
  };

  // Must be exported as an object rather than the root of the module as the jison lexer
  // most modify the object to operate properly.
  __exports__ = AST;
  return __exports__;
})(__module5__);

// handlebars/compiler/parser.js
var __module9__ = (function() {
  "use strict";
  var __exports__;
  /* jshint ignore:start */
  /* Jison generated parser */
  var handlebars = (function(){
  var parser = {trace: function trace() { },
  yy: {},
  symbols_: {"error":2,"root":3,"statements":4,"EOF":5,"program":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"sexpr":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"CLOSE_UNESCAPED":24,"OPEN_PARTIAL":25,"partialName":26,"partial_option0":27,"sexpr_repetition0":28,"sexpr_option0":29,"dataName":30,"param":31,"STRING":32,"INTEGER":33,"BOOLEAN":34,"OPEN_SEXPR":35,"CLOSE_SEXPR":36,"hash":37,"hash_repetition_plus0":38,"hashSegment":39,"ID":40,"EQUALS":41,"DATA":42,"pathSegments":43,"SEP":44,"$accept":0,"$end":1},
  terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"CLOSE_UNESCAPED",25:"OPEN_PARTIAL",32:"STRING",33:"INTEGER",34:"BOOLEAN",35:"OPEN_SEXPR",36:"CLOSE_SEXPR",40:"ID",41:"EQUALS",42:"DATA",44:"SEP"},
  productions_: [0,[3,2],[3,1],[6,2],[6,3],[6,2],[6,1],[6,1],[6,0],[4,1],[4,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,4],[7,2],[17,3],[17,1],[31,1],[31,1],[31,1],[31,1],[31,1],[31,3],[37,1],[39,3],[26,1],[26,1],[26,1],[30,2],[21,1],[43,3],[43,1],[27,0],[27,1],[28,0],[28,2],[29,0],[29,1],[38,1],[38,2]],
  performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

  var $0 = $$.length - 1;
  switch (yystate) {
  case 1: return new yy.ProgramNode($$[$0-1], this._$); 
  break;
  case 2: return new yy.ProgramNode([], this._$); 
  break;
  case 3:this.$ = new yy.ProgramNode([], $$[$0-1], $$[$0], this._$);
  break;
  case 4:this.$ = new yy.ProgramNode($$[$0-2], $$[$0-1], $$[$0], this._$);
  break;
  case 5:this.$ = new yy.ProgramNode($$[$0-1], $$[$0], [], this._$);
  break;
  case 6:this.$ = new yy.ProgramNode($$[$0], this._$);
  break;
  case 7:this.$ = new yy.ProgramNode([], this._$);
  break;
  case 8:this.$ = new yy.ProgramNode([], this._$);
  break;
  case 9:this.$ = [$$[$0]];
  break;
  case 10: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
  break;
  case 11:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1].inverse, $$[$0-1], $$[$0], this._$);
  break;
  case 12:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0-1].inverse, $$[$0], this._$);
  break;
  case 13:this.$ = $$[$0];
  break;
  case 14:this.$ = $$[$0];
  break;
  case 15:this.$ = new yy.ContentNode($$[$0], this._$);
  break;
  case 16:this.$ = new yy.CommentNode($$[$0], this._$);
  break;
  case 17:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 18:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 19:this.$ = {path: $$[$0-1], strip: stripFlags($$[$0-2], $$[$0])};
  break;
  case 20:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 21:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 22:this.$ = new yy.PartialNode($$[$0-2], $$[$0-1], stripFlags($$[$0-3], $$[$0]), this._$);
  break;
  case 23:this.$ = stripFlags($$[$0-1], $$[$0]);
  break;
  case 24:this.$ = new yy.SexprNode([$$[$0-2]].concat($$[$0-1]), $$[$0], this._$);
  break;
  case 25:this.$ = new yy.SexprNode([$$[$0]], null, this._$);
  break;
  case 26:this.$ = $$[$0];
  break;
  case 27:this.$ = new yy.StringNode($$[$0], this._$);
  break;
  case 28:this.$ = new yy.IntegerNode($$[$0], this._$);
  break;
  case 29:this.$ = new yy.BooleanNode($$[$0], this._$);
  break;
  case 30:this.$ = $$[$0];
  break;
  case 31:$$[$0-1].isHelper = true; this.$ = $$[$0-1];
  break;
  case 32:this.$ = new yy.HashNode($$[$0], this._$);
  break;
  case 33:this.$ = [$$[$0-2], $$[$0]];
  break;
  case 34:this.$ = new yy.PartialNameNode($$[$0], this._$);
  break;
  case 35:this.$ = new yy.PartialNameNode(new yy.StringNode($$[$0], this._$), this._$);
  break;
  case 36:this.$ = new yy.PartialNameNode(new yy.IntegerNode($$[$0], this._$));
  break;
  case 37:this.$ = new yy.DataNode($$[$0], this._$);
  break;
  case 38:this.$ = new yy.IdNode($$[$0], this._$);
  break;
  case 39: $$[$0-2].push({part: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
  break;
  case 40:this.$ = [{part: $$[$0]}];
  break;
  case 43:this.$ = [];
  break;
  case 44:$$[$0-1].push($$[$0]);
  break;
  case 47:this.$ = [$$[$0]];
  break;
  case 48:$$[$0-1].push($$[$0]);
  break;
  }
  },
  table: [{3:1,4:2,5:[1,3],8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[3]},{5:[1,16],8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[2,2]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],25:[2,9]},{4:20,6:18,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{4:20,6:22,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{5:[2,13],14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],25:[2,13]},{5:[2,14],14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],25:[2,14]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],25:[2,15]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],25:[2,16]},{17:23,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:29,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:30,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:31,21:24,30:25,40:[1,28],42:[1,27],43:26},{21:33,26:32,32:[1,34],33:[1,35],40:[1,28],43:26},{1:[2,1]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],25:[2,10]},{10:36,20:[1,37]},{4:38,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,7],22:[1,13],23:[1,14],25:[1,15]},{7:39,8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,6],22:[1,13],23:[1,14],25:[1,15]},{17:23,18:[1,40],21:24,30:25,40:[1,28],42:[1,27],43:26},{10:41,20:[1,37]},{18:[1,42]},{18:[2,43],24:[2,43],28:43,32:[2,43],33:[2,43],34:[2,43],35:[2,43],36:[2,43],40:[2,43],42:[2,43]},{18:[2,25],24:[2,25],36:[2,25]},{18:[2,38],24:[2,38],32:[2,38],33:[2,38],34:[2,38],35:[2,38],36:[2,38],40:[2,38],42:[2,38],44:[1,44]},{21:45,40:[1,28],43:26},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],42:[2,40],44:[2,40]},{18:[1,46]},{18:[1,47]},{24:[1,48]},{18:[2,41],21:50,27:49,40:[1,28],43:26},{18:[2,34],40:[2,34]},{18:[2,35],40:[2,35]},{18:[2,36],40:[2,36]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],25:[2,11]},{21:51,40:[1,28],43:26},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,3],22:[1,13],23:[1,14],25:[1,15]},{4:52,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,5],22:[1,13],23:[1,14],25:[1,15]},{14:[2,23],15:[2,23],16:[2,23],19:[2,23],20:[2,23],22:[2,23],23:[2,23],25:[2,23]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],25:[2,12]},{14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],25:[2,18]},{18:[2,45],21:56,24:[2,45],29:53,30:60,31:54,32:[1,57],33:[1,58],34:[1,59],35:[1,61],36:[2,45],37:55,38:62,39:63,40:[1,64],42:[1,27],43:26},{40:[1,65]},{18:[2,37],24:[2,37],32:[2,37],33:[2,37],34:[2,37],35:[2,37],36:[2,37],40:[2,37],42:[2,37]},{14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],25:[2,17]},{5:[2,20],14:[2,20],15:[2,20],16:[2,20],19:[2,20],20:[2,20],22:[2,20],23:[2,20],25:[2,20]},{5:[2,21],14:[2,21],15:[2,21],16:[2,21],19:[2,21],20:[2,21],22:[2,21],23:[2,21],25:[2,21]},{18:[1,66]},{18:[2,42]},{18:[1,67]},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],25:[1,15]},{18:[2,24],24:[2,24],36:[2,24]},{18:[2,44],24:[2,44],32:[2,44],33:[2,44],34:[2,44],35:[2,44],36:[2,44],40:[2,44],42:[2,44]},{18:[2,46],24:[2,46],36:[2,46]},{18:[2,26],24:[2,26],32:[2,26],33:[2,26],34:[2,26],35:[2,26],36:[2,26],40:[2,26],42:[2,26]},{18:[2,27],24:[2,27],32:[2,27],33:[2,27],34:[2,27],35:[2,27],36:[2,27],40:[2,27],42:[2,27]},{18:[2,28],24:[2,28],32:[2,28],33:[2,28],34:[2,28],35:[2,28],36:[2,28],40:[2,28],42:[2,28]},{18:[2,29],24:[2,29],32:[2,29],33:[2,29],34:[2,29],35:[2,29],36:[2,29],40:[2,29],42:[2,29]},{18:[2,30],24:[2,30],32:[2,30],33:[2,30],34:[2,30],35:[2,30],36:[2,30],40:[2,30],42:[2,30]},{17:68,21:24,30:25,40:[1,28],42:[1,27],43:26},{18:[2,32],24:[2,32],36:[2,32],39:69,40:[1,70]},{18:[2,47],24:[2,47],36:[2,47],40:[2,47]},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],41:[1,71],42:[2,40],44:[2,40]},{18:[2,39],24:[2,39],32:[2,39],33:[2,39],34:[2,39],35:[2,39],36:[2,39],40:[2,39],42:[2,39],44:[2,39]},{5:[2,22],14:[2,22],15:[2,22],16:[2,22],19:[2,22],20:[2,22],22:[2,22],23:[2,22],25:[2,22]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],25:[2,19]},{36:[1,72]},{18:[2,48],24:[2,48],36:[2,48],40:[2,48]},{41:[1,71]},{21:56,30:60,31:73,32:[1,57],33:[1,58],34:[1,59],35:[1,61],40:[1,28],42:[1,27],43:26},{18:[2,31],24:[2,31],32:[2,31],33:[2,31],34:[2,31],35:[2,31],36:[2,31],40:[2,31],42:[2,31]},{18:[2,33],24:[2,33],36:[2,33],40:[2,33]}],
  defaultActions: {3:[2,2],16:[2,1],50:[2,42]},
  parseError: function parseError(str, hash) {
      throw new Error(str);
  },
  parse: function parse(input) {
      var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      this.yy.parser = this;
      if (typeof this.lexer.yylloc == "undefined")
          this.lexer.yylloc = {};
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      var ranges = this.lexer.options && this.lexer.options.ranges;
      if (typeof this.yy.parseError === "function")
          this.parseError = this.yy.parseError;
      function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
      }
      function lex() {
          var token;
          token = self.lexer.lex() || 1;
          if (typeof token !== "number") {
              token = self.symbols_[token] || token;
          }
          return token;
      }
      var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
      while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
              action = this.defaultActions[state];
          } else {
              if (symbol === null || typeof symbol == "undefined") {
                  symbol = lex();
              }
              action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
              var errStr = "";
              if (!recovering) {
                  expected = [];
                  for (p in table[state])
                      if (this.terminals_[p] && p > 2) {
                          expected.push("'" + this.terminals_[p] + "'");
                      }
                  if (this.lexer.showPosition) {
                      errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                  } else {
                      errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                  }
                  this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
              }
          }
          if (action[0] instanceof Array && action.length > 1) {
              throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
          case 1:
              stack.push(symbol);
              vstack.push(this.lexer.yytext);
              lstack.push(this.lexer.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                  yyleng = this.lexer.yyleng;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  yyloc = this.lexer.yylloc;
                  if (recovering > 0)
                      recovering--;
              } else {
                  symbol = preErrorSymbol;
                  preErrorSymbol = null;
              }
              break;
          case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
              if (ranges) {
                  yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
              if (typeof r !== "undefined") {
                  return r;
              }
              if (len) {
                  stack = stack.slice(0, -1 * len * 2);
                  vstack = vstack.slice(0, -1 * len);
                  lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
          case 3:
              return true;
          }
      }
      return true;
  }
  };


  function stripFlags(open, close) {
    return {
      left: open.charAt(2) === '~',
      right: close.charAt(0) === '~' || close.charAt(1) === '~'
    };
  }

  /* Jison generated lexer */
  var lexer = (function(){
  var lexer = ({EOF:1,
  parseError:function parseError(str, hash) {
          if (this.yy.parser) {
              this.yy.parser.parseError(str, hash);
          } else {
              throw new Error(str);
          }
      },
  setInput:function (input) {
          this._input = input;
          this._more = this._less = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = '';
          this.conditionStack = ['INITIAL'];
          this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
          if (this.options.ranges) this.yylloc.range = [0,0];
          this.offset = 0;
          return this;
      },
  input:function () {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
              this.yylineno++;
              this.yylloc.last_line++;
          } else {
              this.yylloc.last_column++;
          }
          if (this.options.ranges) this.yylloc.range[1]++;

          this._input = this._input.slice(1);
          return ch;
      },
  unput:function (ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);

          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
          //this.yyleng -= len;
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length-1);
          this.matched = this.matched.substr(0, this.matched.length-1);

          if (lines.length-1) this.yylineno -= lines.length-1;
          var r = this.yylloc.range;

          this.yylloc = {first_line: this.yylloc.first_line,
            last_line: this.yylineno+1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
                this.yylloc.first_column - len
            };

          if (this.options.ranges) {
              this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          return this;
      },
  more:function () {
          this._more = true;
          return this;
      },
  less:function (n) {
          this.unput(this.match.slice(n));
      },
  pastInput:function () {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
      },
  upcomingInput:function () {
          var next = this.match;
          if (next.length < 20) {
              next += this._input.substr(0, 20-next.length);
          }
          return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
      },
  showPosition:function () {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + "\n" + c+"^";
      },
  next:function () {
          if (this.done) {
              return this.EOF;
          }
          if (!this._input) this.done = true;

          var token,
              match,
              tempMatch,
              index,
              col,
              lines;
          if (!this._more) {
              this.yytext = '';
              this.match = '';
          }
          var rules = this._currentRules();
          for (var i=0;i < rules.length; i++) {
              tempMatch = this._input.match(this.rules[rules[i]]);
              if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                  match = tempMatch;
                  index = i;
                  if (!this.options.flex) break;
              }
          }
          if (match) {
              lines = match[0].match(/(?:\r\n?|\n).*/g);
              if (lines) this.yylineno += lines.length;
              this.yylloc = {first_line: this.yylloc.last_line,
                             last_line: this.yylineno+1,
                             first_column: this.yylloc.last_column,
                             last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
              this.yytext += match[0];
              this.match += match[0];
              this.matches = match;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                  this.yylloc.range = [this.offset, this.offset += this.yyleng];
              }
              this._more = false;
              this._input = this._input.slice(match[0].length);
              this.matched += match[0];
              token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
              if (this.done && this._input) this.done = false;
              if (token) return token;
              else return;
          }
          if (this._input === "") {
              return this.EOF;
          } else {
              return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                      {text: "", token: null, line: this.yylineno});
          }
      },
  lex:function lex() {
          var r = this.next();
          if (typeof r !== 'undefined') {
              return r;
          } else {
              return this.lex();
          }
      },
  begin:function begin(condition) {
          this.conditionStack.push(condition);
      },
  popState:function popState() {
          return this.conditionStack.pop();
      },
  _currentRules:function _currentRules() {
          return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
      },
  topState:function () {
          return this.conditionStack[this.conditionStack.length-2];
      },
  pushState:function begin(condition) {
          this.begin(condition);
      }});
  lexer.options = {};
  lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {


  function strip(start, end) {
    return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
  }


  var YYSTATE=YY_START
  switch($avoiding_name_collisions) {
  case 0:
                                     if(yy_.yytext.slice(-2) === "\\\\") {
                                       strip(0,1);
                                       this.begin("mu");
                                     } else if(yy_.yytext.slice(-1) === "\\") {
                                       strip(0,1);
                                       this.begin("emu");
                                     } else {
                                       this.begin("mu");
                                     }
                                     if(yy_.yytext) return 14;
                                   
  break;
  case 1:return 14;
  break;
  case 2:
                                     this.popState();
                                     return 14;
                                   
  break;
  case 3:strip(0,4); this.popState(); return 15;
  break;
  case 4:return 35;
  break;
  case 5:return 36;
  break;
  case 6:return 25;
  break;
  case 7:return 16;
  break;
  case 8:return 20;
  break;
  case 9:return 19;
  break;
  case 10:return 19;
  break;
  case 11:return 23;
  break;
  case 12:return 22;
  break;
  case 13:this.popState(); this.begin('com');
  break;
  case 14:strip(3,5); this.popState(); return 15;
  break;
  case 15:return 22;
  break;
  case 16:return 41;
  break;
  case 17:return 40;
  break;
  case 18:return 40;
  break;
  case 19:return 44;
  break;
  case 20:// ignore whitespace
  break;
  case 21:this.popState(); return 24;
  break;
  case 22:this.popState(); return 18;
  break;
  case 23:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 32;
  break;
  case 24:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 32;
  break;
  case 25:return 42;
  break;
  case 26:return 34;
  break;
  case 27:return 34;
  break;
  case 28:return 33;
  break;
  case 29:return 40;
  break;
  case 30:yy_.yytext = strip(1,2); return 40;
  break;
  case 31:return 'INVALID';
  break;
  case 32:return 5;
  break;
  }
  };
  lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:[\s\S]*?--\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{!--)/,/^(?:\{\{![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:-?[0-9]+(?=([~}\s)])))/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];
  lexer.conditions = {"mu":{"rules":[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[3],"inclusive":false},"INITIAL":{"rules":[0,1,32],"inclusive":true}};
  return lexer;})()
  parser.lexer = lexer;
  function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
  return new Parser;
  })();__exports__ = handlebars;
  /* jshint ignore:end */
  return __exports__;
})();

// handlebars/compiler/base.js
var __module8__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var parser = __dependency1__;
  var AST = __dependency2__;

  __exports__.parser = parser;

  function parse(input) {
    // Just return if an already-compile AST was passed in.
    if(input.constructor === AST.ProgramNode) { return input; }

    parser.yy = AST;
    return parser.parse(input);
  }

  __exports__.parse = parse;
  return __exports__;
})(__module9__, __module7__);

// handlebars/compiler/compiler.js
var __module10__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;

  function Compiler() {}

  __exports__.Compiler = Compiler;// the foundHelper register will disambiguate helper lookup from finding a
  // function in a context. This is necessary for mustache compatibility, which
  // requires that context functions in blocks are evaluated by blockHelperMissing,
  // and then proceed as if the resulting value was provided to blockHelperMissing.

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, out = [], params, param;

      for (var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if (opcode.opcode === 'DECLARE') {
          out.push("DECLARE " + opcode.name + "=" + opcode.value);
        } else {
          params = [];
          for (var j=0; j<opcode.args.length; j++) {
            param = opcode.args[j];
            if (typeof param === "string") {
              param = "\"" + param.replace("\n", "\\n") + "\"";
            }
            params.push(param);
          }
          out.push(opcode.opcode + " " + params.join(" "));
        }
      }

      return out.join("\n");
    },

    equals: function(other) {
      var len = this.opcodes.length;
      if (other.opcodes.length !== len) {
        return false;
      }

      for (var i = 0; i < len; i++) {
        var opcode = this.opcodes[i],
            otherOpcode = other.opcodes[i];
        if (opcode.opcode !== otherOpcode.opcode || opcode.args.length !== otherOpcode.args.length) {
          return false;
        }
        for (var j = 0; j < opcode.args.length; j++) {
          if (opcode.args[j] !== otherOpcode.args[j]) {
            return false;
          }
        }
      }

      len = this.children.length;
      if (other.children.length !== len) {
        return false;
      }
      for (i = 0; i < len; i++) {
        if (!this.children[i].equals(other.children[i])) {
          return false;
        }
      }

      return true;
    },

    guid: 0,

    compile: function(program, options) {
      this.opcodes = [];
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.accept(program);
    },

    accept: function(node) {
      var strip = node.strip || {},
          ret;
      if (strip.left) {
        this.opcode('strip');
      }

      ret = this[node.type](node);

      if (strip.right) {
        this.opcode('strip');
      }

      return ret;
    },

    program: function(program) {
      var statements = program.statements;

      for(var i=0, l=statements.length; i<l; i++) {
        this.accept(statements[i]);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++, depth;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache,
          program = block.program,
          inverse = block.inverse;

      if (program) {
        program = this.compileProgram(program);
      }

      if (inverse) {
        inverse = this.compileProgram(inverse);
      }

      var sexpr = mustache.sexpr;
      var type = this.classifySexpr(sexpr);

      if (type === "helper") {
        this.helperSexpr(sexpr, program, inverse);
      } else if (type === "simple") {
        this.simpleSexpr(sexpr);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('blockValue');
      } else {
        this.ambiguousSexpr(sexpr, program, inverse);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('ambiguousBlockValue');
      }

      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('pushHash');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        if (this.options.stringParams) {
          if(val.depth) {
            this.addDepth(val.depth);
          }
          this.opcode('getContext', val.depth || 0);
          this.opcode('pushStringParam', val.stringModeValue, val.type);

          if (val.type === 'sexpr') {
            // Subexpressions get evaluated and passed in
            // in string params mode.
            this.sexpr(val);
          }
        } else {
          this.accept(val);
        }

        this.opcode('assignToHash', pair[0]);
      }
      this.opcode('popHash');
    },

    partial: function(partial) {
      var partialName = partial.partialName;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', partialName.name);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      this.sexpr(mustache.sexpr);

      if(mustache.escaped && !this.options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ambiguousSexpr: function(sexpr, program, inverse) {
      var id = sexpr.id,
          name = id.parts[0],
          isBlock = program != null || inverse != null;

      this.opcode('getContext', id.depth);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      this.opcode('invokeAmbiguous', name, isBlock);
    },

    simpleSexpr: function(sexpr) {
      var id = sexpr.id;

      if (id.type === 'DATA') {
        this.DATA(id);
      } else if (id.parts.length) {
        this.ID(id);
      } else {
        // Simplified ID for `this`
        this.addDepth(id.depth);
        this.opcode('getContext', id.depth);
        this.opcode('pushContext');
      }

      this.opcode('resolvePossibleLambda');
    },

    helperSexpr: function(sexpr, program, inverse) {
      var params = this.setupFullMustacheParams(sexpr, program, inverse),
          name = sexpr.id.parts[0];

      if (this.options.knownHelpers[name]) {
        this.opcode('invokeKnownHelper', params.length, name);
      } else if (this.options.knownHelpersOnly) {
        throw new Exception("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
      } else {
        this.opcode('invokeHelper', params.length, name, sexpr.isRoot);
      }
    },

    sexpr: function(sexpr) {
      var type = this.classifySexpr(sexpr);

      if (type === "simple") {
        this.simpleSexpr(sexpr);
      } else if (type === "helper") {
        this.helperSexpr(sexpr);
      } else {
        this.ambiguousSexpr(sexpr);
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);
      this.opcode('getContext', id.depth);

      var name = id.parts[0];
      if (!name) {
        this.opcode('pushContext');
      } else {
        this.opcode('lookupOnContext', id.parts[0]);
      }

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    DATA: function(data) {
      this.options.data = true;
      if (data.id.isScoped || data.id.depth) {
        throw new Exception('Scoped data references are not supported: ' + data.original, data);
      }

      this.opcode('lookupData');
      var parts = data.id.parts;
      for(var i=0, l=parts.length; i<l; i++) {
        this.opcode('lookup', parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('pushLiteral', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('pushLiteral', bool.bool);
    },

    comment: function() {},

    // HELPERS
    opcode: function(name) {
      this.opcodes.push({ opcode: name, args: [].slice.call(arguments, 1) });
    },

    declare: function(name, value) {
      this.opcodes.push({ opcode: 'DECLARE', name: name, value: value });
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    classifySexpr: function(sexpr) {
      var isHelper   = sexpr.isHelper;
      var isEligible = sexpr.eligibleHelper;
      var options    = this.options;

      // if ambiguous, we can possibly resolve the ambiguity now
      if (isEligible && !isHelper) {
        var name = sexpr.id.parts[0];

        if (options.knownHelpers[name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }

      if (isHelper) { return "helper"; }
      else if (isEligible) { return "ambiguous"; }
      else { return "simple"; }
    },

    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.stringModeValue, param.type);

          if (param.type === 'sexpr') {
            // Subexpressions get evaluated and passed in
            // in string params mode.
            this.sexpr(param);
          }
        } else {
          this[param.type](param);
        }
      }
    },

    setupFullMustacheParams: function(sexpr, program, inverse) {
      var params = sexpr.params;
      this.pushParams(params);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      if (sexpr.hash) {
        this.hash(sexpr.hash);
      } else {
        this.opcode('emptyHash');
      }

      return params;
    }
  };

  function precompile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
    }

    options = options || {};
    if (!('data' in options)) {
      options.data = true;
    }

    var ast = env.parse(input);
    var environment = new env.Compiler().compile(ast, options);
    return new env.JavaScriptCompiler().compile(environment, options);
  }

  __exports__.precompile = precompile;function compile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
    }

    options = options || {};

    if (!('data' in options)) {
      options.data = true;
    }

    var compiled;

    function compileInput() {
      var ast = env.parse(input);
      var environment = new env.Compiler().compile(ast, options);
      var templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
      return env.template(templateSpec);
    }

    // Template is only compiled on first use and cached after that point.
    return function(context, options) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled.call(this, context, options);
    };
  }

  __exports__.compile = compile;
  return __exports__;
})(__module5__);

// handlebars/compiler/javascript-compiler.js
var __module11__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__;
  var COMPILER_REVISION = __dependency1__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency1__.REVISION_CHANGES;
  var log = __dependency1__.log;
  var Exception = __dependency2__;

  function Literal(value) {
    this.value = value;
  }

  function JavaScriptCompiler() {}

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name /* , type*/) {
      var wrap,
          ret;
      if (parent.indexOf('depth') === 0) {
        wrap = true;
      }

      if (/^[0-9]+$/.test(name)) {
        ret = parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
        ret = parent + "." + name;
      }
      else {
        ret = parent + "['" + name + "']";
      }

      if (wrap) {
        return '(' + parent + ' && ' + ret + ')';
      } else {
        return ret;
      }
    },

    compilerInfo: function() {
      var revision = COMPILER_REVISION,
          versions = REVISION_CHANGES[revision];
      return "this.compilerInfo = ["+revision+",'"+versions+"'];\n";
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return {
          appendToBuffer: true,
          content: string,
          toString: function() { return "buffer += " + string + ";"; }
        };
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      log('debug', this.environment.disassemble() + "\n\n");

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        environments: [],
        aliases: { }
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.registers = { list: [] };
      this.hashes = [];
      this.compileStack = [];
      this.inlineStack = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(var l=opcodes.length; this.i<l; this.i++) {
        opcode = opcodes[this.i];

        if(opcode.opcode === 'DECLARE') {
          this[opcode.name] = opcode.value;
        } else {
          this[opcode.opcode].apply(this, opcode.args);
        }

        // Reset the stripNext flag if it was not set by this operation.
        if (opcode.opcode !== this.stripNext) {
          this.stripNext = false;
        }
      }

      // Flush any trailing content that might be pending.
      this.pushSource('');

      if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
        throw new Exception('Compile completed with content left on stack');
      }

      return this.createFunctionContext(asObject);
    },

    preamble: function() {
      var out = [];

      if (!this.isChild) {
        var namespace = this.namespace;

        var copies = "helpers = this.merge(helpers, " + namespace + ".helpers);";
        if (this.environment.usePartial) { copies = copies + " partials = this.merge(partials, " + namespace + ".partials);"; }
        if (this.options.data) { copies = copies + " data = data || {};"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars.concat(this.registers.list);

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        for (var alias in this.context.aliases) {
          if (this.context.aliases.hasOwnProperty(alias)) {
            this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
          }
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.pushSource("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      // Perform a second pass over the output to merge content when possible
      var source = this.mergeSource();

      if (!this.isChild) {
        source = this.compilerInfo()+source;
      }

      if (asObject) {
        params.push(source);

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + source + '}';
        log('debug', functionSource + "\n\n");
        return functionSource;
      }
    },
    mergeSource: function() {
      // WARN: We are not handling the case where buffer is still populated as the source should
      // not have buffer append operations as their final action.
      var source = '',
          buffer;
      for (var i = 0, len = this.source.length; i < len; i++) {
        var line = this.source[i];
        if (line.appendToBuffer) {
          if (buffer) {
            buffer = buffer + '\n    + ' + line.content;
          } else {
            buffer = line.content;
          }
        } else {
          if (buffer) {
            source += 'buffer += ' + buffer + ';\n  ';
            buffer = undefined;
          }
          source += line + '\n  ';
        }
      }
      return source;
    },

    // [blockValue]
    //
    // On stack, before: hash, inverse, program, value
    // On stack, after: return value of blockHelperMissing
    //
    // The purpose of this opcode is to take a block of the form
    // `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
    // replace it on the stack with the result of properly
    // invoking blockHelperMissing.
    blockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      this.replaceStack(function(current) {
        params.splice(1, 0, current);
        return "blockHelperMissing.call(" + params.join(", ") + ")";
      });
    },

    // [ambiguousBlockValue]
    //
    // On stack, before: hash, inverse, program, value
    // Compiler value, before: lastHelper=value of last found helper, if any
    // On stack, after, if no lastHelper: same as [blockValue]
    // On stack, after, if lastHelper: value
    ambiguousBlockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      var current = this.topStack();
      params.splice(1, 0, current);

      this.pushSource("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
    },

    // [appendContent]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Appends the string value of `content` to the current buffer
    appendContent: function(content) {
      if (this.pendingContent) {
        content = this.pendingContent + content;
      }
      if (this.stripNext) {
        content = content.replace(/^\s+/, '');
      }

      this.pendingContent = content;
    },

    // [strip]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Removes any trailing whitespace from the prior content node and flags
    // the next operation for stripping if it is a content node.
    strip: function() {
      if (this.pendingContent) {
        this.pendingContent = this.pendingContent.replace(/\s+$/, '');
      }
      this.stripNext = 'strip';
    },

    // [append]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Coerces `value` to a String and appends it to the current buffer.
    //
    // If `value` is truthy, or 0, it is coerced into a string and appended
    // Otherwise, the empty string is appended
    append: function() {
      // Force anything that is inlined onto the stack so we don't have duplication
      // when we examine local
      this.flushInline();
      var local = this.popStack();
      this.pushSource("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.pushSource("else { " + this.appendToBuffer("''") + " }");
      }
    },

    // [appendEscaped]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Escape `value` and append it to the buffer
    appendEscaped: function() {
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
    },

    // [getContext]
    //
    // On stack, before: ...
    // On stack, after: ...
    // Compiler value, after: lastContext=depth
    //
    // Set the value of the `lastContext` compiler value to the depth
    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    // [lookupOnContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext[name], ...
    //
    // Looks up the value of `name` on the current context and pushes
    // it onto the stack.
    lookupOnContext: function(name) {
      this.push(this.nameLookup('depth' + this.lastContext, name, 'context'));
    },

    // [pushContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext, ...
    //
    // Pushes the value of the current context onto the stack.
    pushContext: function() {
      this.pushStackLiteral('depth' + this.lastContext);
    },

    // [resolvePossibleLambda]
    //
    // On stack, before: value, ...
    // On stack, after: resolved value, ...
    //
    // If the `value` is a lambda, replace it on the stack by
    // the return value of the lambda
    resolvePossibleLambda: function() {
      this.context.aliases.functionType = '"function"';

      this.replaceStack(function(current) {
        return "typeof " + current + " === functionType ? " + current + ".apply(depth0) : " + current;
      });
    },

    // [lookup]
    //
    // On stack, before: value, ...
    // On stack, after: value[name], ...
    //
    // Replace the value on the stack with the result of looking
    // up `name` on `value`
    lookup: function(name) {
      this.replaceStack(function(current) {
        return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, 'context');
      });
    },

    // [lookupData]
    //
    // On stack, before: ...
    // On stack, after: data, ...
    //
    // Push the data lookup operator
    lookupData: function() {
      this.pushStackLiteral('data');
    },

    // [pushStringParam]
    //
    // On stack, before: ...
    // On stack, after: string, currentContext, ...
    //
    // This opcode is designed for use in string mode, which
    // provides the string value of a parameter along with its
    // depth rather than resolving it immediately.
    pushStringParam: function(string, type) {
      this.pushStackLiteral('depth' + this.lastContext);

      this.pushString(type);

      // If it's a subexpression, the string result
      // will be pushed after this opcode.
      if (type !== 'sexpr') {
        if (typeof string === 'string') {
          this.pushString(string);
        } else {
          this.pushStackLiteral(string);
        }
      }
    },

    emptyHash: function() {
      this.pushStackLiteral('{}');

      if (this.options.stringParams) {
        this.push('{}'); // hashContexts
        this.push('{}'); // hashTypes
      }
    },
    pushHash: function() {
      if (this.hash) {
        this.hashes.push(this.hash);
      }
      this.hash = {values: [], types: [], contexts: []};
    },
    popHash: function() {
      var hash = this.hash;
      this.hash = this.hashes.pop();

      if (this.options.stringParams) {
        this.push('{' + hash.contexts.join(',') + '}');
        this.push('{' + hash.types.join(',') + '}');
      }

      this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
    },

    // [pushString]
    //
    // On stack, before: ...
    // On stack, after: quotedString(string), ...
    //
    // Push a quoted version of `string` onto the stack
    pushString: function(string) {
      this.pushStackLiteral(this.quotedString(string));
    },

    // [push]
    //
    // On stack, before: ...
    // On stack, after: expr, ...
    //
    // Push an expression onto the stack
    push: function(expr) {
      this.inlineStack.push(expr);
      return expr;
    },

    // [pushLiteral]
    //
    // On stack, before: ...
    // On stack, after: value, ...
    //
    // Pushes a value onto the stack. This operation prevents
    // the compiler from creating a temporary variable to hold
    // it.
    pushLiteral: function(value) {
      this.pushStackLiteral(value);
    },

    // [pushProgram]
    //
    // On stack, before: ...
    // On stack, after: program(guid), ...
    //
    // Push a program expression onto the stack. This takes
    // a compile-time guid and converts it into a runtime-accessible
    // expression.
    pushProgram: function(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },

    // [invokeHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // Pops off the helper's parameters, invokes the helper,
    // and pushes the helper's return value onto the stack.
    //
    // If the helper is not found, `helperMissing` is called.
    invokeHelper: function(paramSize, name, isRoot) {
      this.context.aliases.helperMissing = 'helpers.helperMissing';
      this.useRegister('helper');

      var helper = this.lastHelper = this.setupHelper(paramSize, name, true);
      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');

      var lookup = 'helper = ' + helper.name + ' || ' + nonHelper;
      if (helper.paramsInit) {
        lookup += ',' + helper.paramsInit;
      }

      this.push(
        '('
          + lookup
          + ',helper '
            + '? helper.call(' + helper.callParams + ') '
            + ': helperMissing.call(' + helper.helperMissingParams + '))');

      // Always flush subexpressions. This is both to prevent the compounding size issue that
      // occurs when the code has to be duplicated for inlining and also to prevent errors
      // due to the incorrect options object being passed due to the shared register.
      if (!isRoot) {
        this.flushInline();
      }
    },

    // [invokeKnownHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // This operation is used when the helper is known to exist,
    // so a `helperMissing` fallback is not required.
    invokeKnownHelper: function(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.push(helper.name + ".call(" + helper.callParams + ")");
    },

    // [invokeAmbiguous]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of disambiguation
    //
    // This operation is used when an expression like `{{foo}}`
    // is provided, but we don't know at compile-time whether it
    // is a helper or a path.
    //
    // This operation emits more code than the other options,
    // and can be avoided by passing the `knownHelpers` and
    // `knownHelpersOnly` flags at compile-time.
    invokeAmbiguous: function(name, helperCall) {
      this.context.aliases.functionType = '"function"';
      this.useRegister('helper');

      this.emptyHash();
      var helper = this.setupHelper(0, name, helperCall);

      var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');
      var nextStack = this.nextStack();

      if (helper.paramsInit) {
        this.pushSource(helper.paramsInit);
      }
      this.pushSource('if (helper = ' + helperName + ') { ' + nextStack + ' = helper.call(' + helper.callParams + '); }');
      this.pushSource('else { helper = ' + nonHelper + '; ' + nextStack + ' = typeof helper === functionType ? helper.call(' + helper.callParams + ') : helper; }');
    },

    // [invokePartial]
    //
    // On stack, before: context, ...
    // On stack after: result of partial invocation
    //
    // This operation pops off a context, invokes a partial with that context,
    // and pushes the result of the invocation back.
    invokePartial: function(name) {
      var params = [this.nameLookup('partials', name, 'partial'), "'" + name + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.context.aliases.self = "this";
      this.push("self.invokePartial(" + params.join(", ") + ")");
    },

    // [assignToHash]
    //
    // On stack, before: value, hash, ...
    // On stack, after: hash, ...
    //
    // Pops a value and hash off the stack, assigns `hash[key] = value`
    // and pushes the hash back onto the stack.
    assignToHash: function(key) {
      var value = this.popStack(),
          context,
          type;

      if (this.options.stringParams) {
        type = this.popStack();
        context = this.popStack();
      }

      var hash = this.hash;
      if (context) {
        hash.contexts.push("'" + key + "': " + context);
      }
      if (type) {
        hash.types.push("'" + key + "': " + type);
      }
      hash.values.push("'" + key + "': (" + value + ")");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        var index = this.matchExistingProgram(child);

        if (index == null) {
          this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
          index = this.context.programs.length;
          child.index = index;
          child.name = 'program' + index;
          this.context.programs[index] = compiler.compile(child, options, this.context);
          this.context.environments[index] = child;
        } else {
          child.index = index;
          child.name = 'program' + index;
        }
      }
    },
    matchExistingProgram: function(child) {
      for (var i = 0, len = this.context.environments.length; i < len; i++) {
        var environment = this.context.environments[i];
        if (environment && environment.equals(child)) {
          return i;
        }
      }
    },

    programExpression: function(guid) {
      this.context.aliases.self = "this";

      if(guid == null) {
        return "self.noop";
      }

      var child = this.environment.children[guid],
          depths = child.depths.list, depth;

      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      return (depths.length === 0 ? "self.program(" : "self.programWithDepth(") + programParams.join(", ") + ")";
    },

    register: function(name, val) {
      this.useRegister(name);
      this.pushSource(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStackLiteral: function(item) {
      return this.push(new Literal(item));
    },

    pushSource: function(source) {
      if (this.pendingContent) {
        this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
        this.pendingContent = undefined;
      }

      if (source) {
        this.source.push(source);
      }
    },

    pushStack: function(item) {
      this.flushInline();

      var stack = this.incrStack();
      if (item) {
        this.pushSource(stack + " = " + item + ";");
      }
      this.compileStack.push(stack);
      return stack;
    },

    replaceStack: function(callback) {
      var prefix = '',
          inline = this.isInline(),
          stack,
          createdStack,
          usedLiteral;

      // If we are currently inline then we want to merge the inline statement into the
      // replacement statement via ','
      if (inline) {
        var top = this.popStack(true);

        if (top instanceof Literal) {
          // Literals do not need to be inlined
          stack = top.value;
          usedLiteral = true;
        } else {
          // Get or create the current stack name for use by the inline
          createdStack = !this.stackSlot;
          var name = !createdStack ? this.topStackName() : this.incrStack();

          prefix = '(' + this.push(name) + ' = ' + top + '),';
          stack = this.topStack();
        }
      } else {
        stack = this.topStack();
      }

      var item = callback.call(this, stack);

      if (inline) {
        if (!usedLiteral) {
          this.popStack();
        }
        if (createdStack) {
          this.stackSlot--;
        }
        this.push('(' + prefix + item + ')');
      } else {
        // Prevent modification of the context depth variable. Through replaceStack
        if (!/^stack/.test(stack)) {
          stack = this.nextStack();
        }

        this.pushSource(stack + " = (" + prefix + item + ");");
      }
      return stack;
    },

    nextStack: function() {
      return this.pushStack();
    },

    incrStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return this.topStackName();
    },
    topStackName: function() {
      return "stack" + this.stackSlot;
    },
    flushInline: function() {
      var inlineStack = this.inlineStack;
      if (inlineStack.length) {
        this.inlineStack = [];
        for (var i = 0, len = inlineStack.length; i < len; i++) {
          var entry = inlineStack[i];
          if (entry instanceof Literal) {
            this.compileStack.push(entry);
          } else {
            this.pushStack(entry);
          }
        }
      }
    },
    isInline: function() {
      return this.inlineStack.length;
    },

    popStack: function(wrapped) {
      var inline = this.isInline(),
          item = (inline ? this.inlineStack : this.compileStack).pop();

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        if (!inline) {
          if (!this.stackSlot) {
            throw new Exception('Invalid stack pop');
          }
          this.stackSlot--;
        }
        return item;
      }
    },

    topStack: function(wrapped) {
      var stack = (this.isInline() ? this.inlineStack : this.compileStack),
          item = stack[stack.length - 1];

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        return item;
      }
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\u2028/g, '\\u2028')   // Per Ecma-262 7.3 + 7.8.4
        .replace(/\u2029/g, '\\u2029') + '"';
    },

    setupHelper: function(paramSize, name, missingParams) {
      var params = [],
          paramsInit = this.setupParams(paramSize, params, missingParams);
      var foundHelper = this.nameLookup('helpers', name, 'helper');

      return {
        params: params,
        paramsInit: paramsInit,
        name: foundHelper,
        callParams: ["depth0"].concat(params).join(", "),
        helperMissingParams: missingParams && ["depth0", this.quotedString(name)].concat(params).join(", ")
      };
    },

    setupOptions: function(paramSize, params) {
      var options = [], contexts = [], types = [], param, inverse, program;

      options.push("hash:" + this.popStack());

      if (this.options.stringParams) {
        options.push("hashTypes:" + this.popStack());
        options.push("hashContexts:" + this.popStack());
      }

      inverse = this.popStack();
      program = this.popStack();

      // Avoid setting fn and inverse if neither are set. This allows
      // helpers to do a check for `if (options.fn)`
      if (program || inverse) {
        if (!program) {
          this.context.aliases.self = "this";
          program = "self.noop";
        }

        if (!inverse) {
          this.context.aliases.self = "this";
          inverse = "self.noop";
        }

        options.push("inverse:" + inverse);
        options.push("fn:" + program);
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          types.push(this.popStack());
          contexts.push(this.popStack());
        }
      }

      if (this.options.stringParams) {
        options.push("contexts:[" + contexts.join(",") + "]");
        options.push("types:[" + types.join(",") + "]");
      }

      if(this.options.data) {
        options.push("data:data");
      }

      return options;
    },

    // the params and contexts arguments are passed in arrays
    // to fill in
    setupParams: function(paramSize, params, useRegister) {
      var options = '{' + this.setupOptions(paramSize, params).join(',') + '}';

      if (useRegister) {
        this.useRegister('options');
        params.push('options');
        return 'options=' + options;
      } else {
        params.push(options);
        return '';
      }
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)) {
      return true;
    }
    return false;
  };

  __exports__ = JavaScriptCompiler;
  return __exports__;
})(__module2__, __module5__);

// handlebars.js
var __module0__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var Handlebars = __dependency1__;

  // Compiler imports
  var AST = __dependency2__;
  var Parser = __dependency3__.parser;
  var parse = __dependency3__.parse;
  var Compiler = __dependency4__.Compiler;
  var compile = __dependency4__.compile;
  var precompile = __dependency4__.precompile;
  var JavaScriptCompiler = __dependency5__;

  var _create = Handlebars.create;
  var create = function() {
    var hb = _create();

    hb.compile = function(input, options) {
      return compile(input, options, hb);
    };
    hb.precompile = function (input, options) {
      return precompile(input, options, hb);
    };

    hb.AST = AST;
    hb.Compiler = Compiler;
    hb.JavaScriptCompiler = JavaScriptCompiler;
    hb.Parser = Parser;
    hb.parse = parse;

    return hb;
  };

  Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module1__, __module7__, __module8__, __module10__, __module11__);

  return __module0__;
})();


$.fn.simpleColorPicker = function(options) {
	var defaults = {
		colorsPerLine: 8,
		colors: ['#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff'
				, '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff'
				, '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
				, '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'
				, '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0'
				, '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'
				, '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'
				, '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4C1130'],
		showEffect: '',
		hideEffect: '',
		onChangeColor: false
	};

	var opts = $.extend(defaults, options);

	return this.each(function() {
		var txt = $(this), $color = $('<div class="color" />');

		txt.wrap('<div class="relative color-picker-wrapper"></div>');
		txt.parent().append($color);

		var colorsMarkup = '';

		var prefix = txt.attr('id').replace(/-/g, '') + '_';

		for(var i = 0; i < opts.colors.length; i++){
			var item = opts.colors[i];

			var breakLine = '';
			if (i % opts.colorsPerLine == 0)
				breakLine = 'clear: both; ';

			if (i > 0 && breakLine && $.browser && $.browser.msie && $.browser.version <= 7) {
				breakLine = '';
				colorsMarkup += '<li style="float: none; clear: both; overflow: hidden; background-color: #fff; display: block; height: 1px; line-height: 1px; font-size: 1px; margin-bottom: -2px;"></li>';
			}

			colorsMarkup += '<li id="' + prefix + 'color-' + i + '" class="color-box" style="' + breakLine + 'background-color: ' + item + '" title="' + item + '"></li>';
		}

		var box = $('<div id="' + prefix + 'color-picker" class="color-picker"><ul>' + colorsMarkup + '</ul><div style="clear: both;"></div></div>');
		var isDown = false;

		box.insertAfter(txt);

		box.hide();

		box.find('li.color-box').on('mouseup', function() {
			isDown = false;
			$(this).click();
		});

		box.find('li.color-box').on('mousedown', function() {
			isDown = true;
		});

		box.find('li.color-box').click(function() {
			if (txt.is('input')) {
				txt.val(opts.colors[this.id.substr(this.id.indexOf('-') + 1)]);
				txt.blur();
			}
			if ($.isFunction(defaults.onChangeColor)) {
				defaults.onChangeColor.call(txt, opts.colors[this.id.substr(this.id.indexOf('-') + 1)]);
			}
			hideBox(box);
		});

		$('body').on('click', function() {
			hideBox(box);
		});

		$color.click(function() {
			setTimeout(function() {
				showBox(box);
			}, 10);
		});

		txt.on('blur', function() {
			setTimeout(function() {
				if(!isDown) {
					hideBox(box);
				}
			}, 100);
		});

		box.click(function(event) {
			event.stopPropagation();
		});

		var positionAndShowBox = function(box) {
			/*
			var pos = txt.offset();
			var left = pos.left + txt.outerWidth() - box.outerWidth();
			if (left < pos.left) left = pos.left
			box.css({ left: left, top: (pos.top + txt.outerHeight()) });
		*/
			showBox(box);
		}

		txt.click(function(event) {
			event.stopPropagation();
			if (!txt.is('input')) {
				// element is not an input so probably a link or div which requires the color box to be shown
				positionAndShowBox(box);
			}
		});

		txt.focus(function() {
			positionAndShowBox(box);
		});

		function hideBox(box) {
			if (opts.hideEffect == 'fade')
				box.fadeOut();
			else if (opts.hideEffect == 'slide')
				box.slideUp();
			else
				box.hide();

			updateColor();
		}

		function updateColor() {
			$color.css('background-color', txt.val());
		}

		function showBox(box) {
			if (opts.showEffect == 'fade')
				box.fadeIn();
			else if (opts.showEffect == 'slide')
				box.slideDown();
			else
				box.show();
		}

		updateColor();
	});
};
/*

$.Link (part of noUiSlider) - WTFPL */
(function(c){function m(a,c,d){if((a[c]||a[d])&&a[c]===a[d])throw Error("(Link) '"+c+"' can't match '"+d+"'.'");}function r(a){void 0===a&&(a={});if("object"!==typeof a)throw Error("(Format) 'format' option must be an object.");var h={};c(u).each(function(c,n){if(void 0===a[n])h[n]=A[c];else if(typeof a[n]===typeof A[c]){if("decimals"===n&&(0>a[n]||7<a[n]))throw Error("(Format) 'format.decimals' option must be between 0 and 7.");h[n]=a[n]}else throw Error("(Format) 'format."+n+"' must be a "+typeof A[c]+
".");});m(h,"mark","thousand");m(h,"prefix","negative");m(h,"prefix","negativeBefore");this.r=h}function k(a,h){"object"!==typeof a&&c.error("(Link) Initialize with an object.");return new k.prototype.p(a.target||function(){},a.method,a.format||{},h)}var u="decimals mark thousand prefix postfix encoder decoder negative negativeBefore to from".split(" "),A=[2,".","","","",function(a){return a},function(a){return a},"-","",function(a){return a},function(a){return a}];r.prototype.a=function(a){return this.r[a]};
r.prototype.L=function(a){function c(a){return a.split("").reverse().join("")}a=this.a("encoder")(a);var d=this.a("decimals"),n="",k="",m="",r="";0===parseFloat(a.toFixed(d))&&(a="0");0>a&&(n=this.a("negative"),k=this.a("negativeBefore"));a=Math.abs(a).toFixed(d).toString();a=a.split(".");this.a("thousand")?(m=c(a[0]).match(/.{1,3}/g),m=c(m.join(c(this.a("thousand"))))):m=a[0];this.a("mark")&&1<a.length&&(r=this.a("mark")+a[1]);return this.a("to")(k+this.a("prefix")+n+m+r+this.a("postfix"))};r.prototype.w=
function(a){function c(a){return a.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g,"\\$&")}var d;if(null===a||void 0===a)return!1;a=this.a("from")(a);a=a.toString();d=a.replace(RegExp("^"+c(this.a("negativeBefore"))),"");a!==d?(a=d,d="-"):d="";a=a.replace(RegExp("^"+c(this.a("prefix"))),"");this.a("negative")&&(d="",a=a.replace(RegExp("^"+c(this.a("negative"))),"-"));a=a.replace(RegExp(c(this.a("postfix"))+"$"),"").replace(RegExp(c(this.a("thousand")),"g"),"").replace(this.a("mark"),".");a=this.a("decoder")(parseFloat(d+
a));return isNaN(a)?!1:a};k.prototype.K=function(a,h){this.method=h||"html";this.j=c(a.replace("-tooltip-","")||"<div/>")[0]};k.prototype.H=function(a){this.method="val";this.j=document.createElement("input");this.j.name=a;this.j.type="hidden"};k.prototype.G=function(a){function h(a,c){return[c?null:a,c?a:null]}var d=this;this.method="val";this.target=a.on("change",function(a){d.B.val(h(c(a.target).val(),d.t),{link:d,set:!0})})};k.prototype.p=function(a,h,d,k){this.g=d;this.update=!k;if("string"===
typeof a&&0===a.indexOf("-tooltip-"))this.K(a,h);else if("string"===typeof a&&0!==a.indexOf("-"))this.H(a);else if("function"===typeof a)this.target=!1,this.method=a;else{if(a instanceof c||c.zepto&&c.zepto.isZ(a)){if(!h){if(a.is("input, select, textarea")){this.G(a);return}h="html"}if("function"===typeof h||"string"===typeof h&&a[h]){this.method=h;this.target=a;return}}throw new RangeError("(Link) Invalid Link.");}};k.prototype.write=function(a,c,d,k){if(!this.update||!1!==k)if(this.u=a,this.F=a=
this.format(a),"function"===typeof this.method)this.method.call(this.target[0]||d[0],a,c,d);else this.target[this.method](a,c,d)};k.prototype.q=function(a){this.g=new r(c.extend({},a,this.g instanceof r?this.g.r:this.g))};k.prototype.J=function(a){this.B=a};k.prototype.I=function(a){this.t=a};k.prototype.format=function(a){return this.g.L(a)};k.prototype.A=function(a){return this.g.w(a)};k.prototype.p.prototype=k.prototype;c.Link=k})(window.jQuery||window.Zepto);/*

$.fn.noUiSlider - WTFPL - refreshless.com/nouislider/ */
(function(c){function m(e){return"number"===typeof e&&!isNaN(e)&&isFinite(e)}function r(e){return c.isArray(e)?e:[e]}function k(e,b){e.addClass(b);setTimeout(function(){e.removeClass(b)},300)}function u(e,b){return 100*b/(e[1]-e[0])}function A(e,b){if(b>=e.d.slice(-1)[0])return 100;for(var a=1,c,f,d;b>=e.d[a];)a++;c=e.d[a-1];f=e.d[a];d=e.c[a-1];c=[c,f];return d+u(c,0>c[0]?b+Math.abs(c[0]):b-c[0])/(100/(e.c[a]-d))}function a(e,b){if(100<=b)return e.d.slice(-1)[0];for(var a=1,c,f,d;b>=e.c[a];)a++;c=
e.d[a-1];f=e.d[a];d=e.c[a-1];c=[c,f];return 100/(e.c[a]-d)*(b-d)*(c[1]-c[0])/100+c[0]}function h(a,b){for(var c=1,g;(a.dir?100-b:b)>=a.c[c];)c++;if(a.m)return g=a.c[c-1],c=a.c[c],b-g>(c-g)/2?c:g;a.h[c-1]?(g=a.h[c-1],c=a.c[c-1]+Math.round((b-a.c[c-1])/g)*g):c=b;return c}function d(a,b){if(!m(b))throw Error("noUiSlider: 'step' is not numeric.");a.h[0]=b}function n(a,b){if("object"!==typeof b||c.isArray(b))throw Error("noUiSlider: 'range' is not an object.");if(void 0===b.min||void 0===b.max)throw Error("noUiSlider: Missing 'min' or 'max' in 'range'.");
c.each(b,function(b,g){var d;"number"===typeof g&&(g=[g]);if(!c.isArray(g))throw Error("noUiSlider: 'range' contains invalid value.");d="min"===b?0:"max"===b?100:parseFloat(b);if(!m(d)||!m(g[0]))throw Error("noUiSlider: 'range' value isn't numeric.");a.c.push(d);a.d.push(g[0]);d?a.h.push(isNaN(g[1])?!1:g[1]):isNaN(g[1])||(a.h[0]=g[1])});c.each(a.h,function(b,c){if(!c)return!0;a.h[b]=u([a.d[b],a.d[b+1]],c)/(100/(a.c[b+1]-a.c[b]))})}function E(a,b){"number"===typeof b&&(b=[b]);if(!c.isArray(b)||!b.length||
2<b.length)throw Error("noUiSlider: 'start' option is incorrect.");a.b=b.length;a.start=b}function I(a,b){a.m=b;if("boolean"!==typeof b)throw Error("noUiSlider: 'snap' option must be a boolean.");}function J(a,b){if("lower"===b&&1===a.b)a.i=1;else if("upper"===b&&1===a.b)a.i=2;else if(!0===b&&2===a.b)a.i=3;else if(!1===b)a.i=0;else throw Error("noUiSlider: 'connect' option doesn't match handle count.");}function D(a,b){switch(b){case "horizontal":a.k=0;break;case "vertical":a.k=1;break;default:throw Error("noUiSlider: 'orientation' option is invalid.");
}}function K(a,b){if(2<a.c.length)throw Error("noUiSlider: 'margin' option is only supported on linear sliders.");a.margin=u(a.d,b);if(!m(b))throw Error("noUiSlider: 'margin' option must be numeric.");}function L(a,b){switch(b){case "ltr":a.dir=0;break;case "rtl":a.dir=1;a.i=[0,2,1,3][a.i];break;default:throw Error("noUiSlider: 'direction' option was not recognized.");}}function M(a,b){if("string"!==typeof b)throw Error("noUiSlider: 'behaviour' must be a string containing options.");var c=0<=b.indexOf("snap");
a.n={s:0<=b.indexOf("tap")||c,extend:0<=b.indexOf("extend"),v:0<=b.indexOf("drag"),fixed:0<=b.indexOf("fixed"),m:c}}function N(a,b,d){a.o=[b.lower,b.upper];a.g=b.format;c.each(a.o,function(a,e){if(!c.isArray(e))throw Error("noUiSlider: 'serialization."+(a?"upper":"lower")+"' must be an array.");c.each(e,function(){if(!(this instanceof c.Link))throw Error("noUiSlider: 'serialization."+(a?"upper":"lower")+"' can only contain Link instances.");this.I(a);this.J(d);this.q(b.format)})});a.dir&&1<a.b&&a.o.reverse()}
function O(a,b){var f={c:[],d:[],h:[!1],margin:0},g;g={step:{e:!1,f:d},start:{e:!0,f:E},connect:{e:!0,f:J},direction:{e:!0,f:L},range:{e:!0,f:n},snap:{e:!1,f:I},orientation:{e:!1,f:D},margin:{e:!1,f:K},behaviour:{e:!0,f:M},serialization:{e:!0,f:N}};a=c.extend({connect:!1,direction:"ltr",behaviour:"tap",orientation:"horizontal"},a);a.serialization=c.extend({lower:[],upper:[],format:{}},a.serialization);c.each(g,function(c,d){if(void 0===a[c]){if(d.e)throw Error("noUiSlider: '"+c+"' is required.");
return!0}d.f(f,a[c],b)});f.style=f.k?"top":"left";return f}function P(a,b){var d=c("<div><div/></div>").addClass(f[2]),g=["-lower","-upper"];a.dir&&g.reverse();d.children().addClass(f[3]+" "+f[3]+g[b]);return d}function Q(a,b){b.j&&(b=new c.Link({target:c(b.j).clone().appendTo(a),method:b.method,format:b.g},!0));return b}function R(a,b){var d,f=[];for(d=0;d<a.b;d++){var k=f,h=d,m=a.o[d],n=b[d].children(),r=a.g,s=void 0,v=[],s=new c.Link({},!0);s.q(r);v.push(s);for(s=0;s<m.length;s++)v.push(Q(n,m[s]));
k[h]=v}return f}function S(a,b,c){switch(a){case 1:b.addClass(f[7]);c[0].addClass(f[6]);break;case 3:c[1].addClass(f[6]);case 2:c[0].addClass(f[7]);case 0:b.addClass(f[6])}}function T(a,b){var c,d=[];for(c=0;c<a.b;c++)d.push(P(a,c).appendTo(b));return d}function U(a,b){b.addClass([f[0],f[8+a.dir],f[4+a.k]].join(" "));return c("<div/>").appendTo(b).addClass(f[1])}function V(d,b,m){function g(){return t[["width","height"][b.k]]()}function n(a){var b,c=[q.val()];for(b=0;b<a.length;b++)q.trigger(a[b],
c)}function u(d,p,e){var g=d[0]!==l[0][0]?1:0,H=x[0]+b.margin,k=x[1]-b.margin;e&&1<l.length&&(p=g?Math.max(p,H):Math.min(p,k));100>p&&(p=h(b,p));p=Math.max(Math.min(parseFloat(p.toFixed(7)),100),0);if(p===x[g])return 1===l.length?!1:p===H||p===k?0:!1;d.css(b.style,p+"%");d.is(":first-child")&&d.toggleClass(f[17],50<p);x[g]=p;b.dir&&(p=100-p);c(y[g]).each(function(){this.write(a(b,p),d.children(),q)});return!0}function B(a,b,c){c||k(q,f[14]);u(a,b,!1);n(["slide","set","change"])}function w(a,c,d,e){a=
a.replace(/\s/g,".nui ")+".nui";c.on(a,function(a){var c=q.attr("disabled");if(q.hasClass(f[14])||void 0!==c&&null!==c)return!1;a.preventDefault();var c=0===a.type.indexOf("touch"),p=0===a.type.indexOf("mouse"),F=0===a.type.indexOf("pointer"),g,k,l=a;0===a.type.indexOf("MSPointer")&&(F=!0);a.originalEvent&&(a=a.originalEvent);c&&(g=a.changedTouches[0].pageX,k=a.changedTouches[0].pageY);if(p||F)F||void 0!==window.pageXOffset||(window.pageXOffset=document.documentElement.scrollLeft,window.pageYOffset=
document.documentElement.scrollTop),g=a.clientX+window.pageXOffset,k=a.clientY+window.pageYOffset;l.C=[g,k];l.cursor=p;a=l;a.l=a.C[b.k];d(a,e)})}function C(a,c){var b=c.b||l,d,e=!1,e=100*(a.l-c.start)/g(),f=b[0][0]!==l[0][0]?1:0;var k=c.D;d=e+k[0];e+=k[1];1<b.length?(0>d&&(e+=Math.abs(d)),100<e&&(d-=e-100),d=[Math.max(Math.min(d,100),0),Math.max(Math.min(e,100),0)]):d=[d,e];e=u(b[0],d[f],1===b.length);1<b.length&&(e=u(b[1],d[f?0:1],!1)||e);e&&n(["slide"])}function s(a){c("."+f[15]).removeClass(f[15]);
a.cursor&&c("body").css("cursor","").off(".nui");G.off(".nui");q.removeClass(f[12]);n(["set","change"])}function v(a,b){1===b.b.length&&b.b[0].children().addClass(f[15]);a.stopPropagation();w(z.move,G,C,{start:a.l,b:b.b,D:[x[0],x[l.length-1]]});w(z.end,G,s,null);a.cursor&&(c("body").css("cursor",c(a.target).css("cursor")),1<l.length&&q.addClass(f[12]),c("body").on("selectstart.nui",!1))}function D(a){var d=a.l,e=0;a.stopPropagation();c.each(l,function(){e+=this.offset()[b.style]});e=d<e/2||1===l.length?
0:1;d-=t.offset()[b.style];d=100*d/g();B(l[e],d,b.n.m);b.n.m&&v(a,{b:[l[e]]})}function E(a){var c=(a=a.l<t.offset()[b.style])?0:100;a=a?0:l.length-1;B(l[a],c,!1)}var q=c(d),x=[-1,-1],t,y,l;if(q.hasClass(f[0]))throw Error("Slider was already initialized.");t=U(b,q);l=T(b,t);y=R(b,l);S(b.i,q,l);(function(a){var b;if(!a.fixed)for(b=0;b<l.length;b++)w(z.start,l[b].children(),v,{b:[l[b]]});a.s&&w(z.start,t,D,{b:l});a.extend&&(q.addClass(f[16]),a.s&&w(z.start,q,E,{b:l}));a.v&&(b=t.find("."+f[7]).addClass(f[10]),
a.fixed&&(b=b.add(t.children().not(b).children())),w(z.start,b,v,{b:l}))})(b.n);d.vSet=function(){var a=Array.prototype.slice.call(arguments,0),d,e,g,h,m,s,t=r(a[0]);"object"===typeof a[1]?(d=a[1].set,e=a[1].link,g=a[1].update,h=a[1].animate):!0===a[1]&&(d=!0);b.dir&&1<b.b&&t.reverse();h&&k(q,f[14]);a=1<l.length?3:1;1===t.length&&(a=1);for(m=0;m<a;m++)h=e||y[m%2][0],h=h.A(t[m%2]),!1!==h&&(h=A(b,h),b.dir&&(h=100-h),!0!==u(l[m%2],h,!0)&&c(y[m%2]).each(function(a){if(!a)return s=this.u,!0;this.write(s,
l[m%2].children(),q,g)}));!0===d&&n(["set"]);return this};d.vGet=function(){var a,c=[];for(a=0;a<b.b;a++)c[a]=y[a][0].F;return 1===c.length?c[0]:b.dir?c.reverse():c};d.destroy=function(){c.each(y,function(){c.each(this,function(){this.target&&this.target.off(".nui")})});c(this).off(".nui").removeClass(f.join(" ")).empty();return m};q.val(b.start)}function W(a){if(!this.length)throw Error("noUiSlider: Can't initialize slider on empty selection.");var b=O(a,this);return this.each(function(){V(this,
b,a)})}function X(a){return this.each(function(){var b=c(this).val(),d=this.destroy(),f=c.extend({},d,a);c(this).noUiSlider(f);d.start===f.start&&c(this).val(b)})}function B(){return this[0][arguments.length?"vSet":"vGet"].apply(this[0],arguments)}var G=c(document),C=c.fn.val,z=window.navigator.pointerEnabled?{start:"pointerdown",move:"pointermove",end:"pointerup"}:window.navigator.msPointerEnabled?{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:{start:"mousedown touchstart",move:"mousemove touchmove",
end:"mouseup touchend"},f="noUi-target noUi-base noUi-origin noUi-handle noUi-horizontal noUi-vertical noUi-background noUi-connect noUi-ltr noUi-rtl noUi-dragable  noUi-state-drag  noUi-state-tap noUi-active noUi-extended noUi-stacking".split(" ");c.fn.val=function(){var a=arguments,b=c(this[0]);return arguments.length?this.each(function(){(c(this).hasClass(f[0])?B:C).apply(c(this),a)}):(b.hasClass(f[0])?B:C).call(b)};c.noUiSlider={Link:c.Link};c.fn.noUiSlider=function(a,b){return(b?X:W).call(this,
a)}})(window.jQuery||window.Zepto);

(function() {
var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['address-fields'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"oh-google-map-window\"></div>\n\n<div class=\"oh-google-map-address-field\">\n	\n	<a href=\"#\" class=\"oh-google-map-right hidden view-all\">View All Locations</a>\n\n	<div class=\"field\" id=\"fields-addressline1-field\">\n		<div class=\"input\">\n			<input class=\"text nicetext fullwidth line1\" type=\"text\" id=\"fields-addressline1\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][line1]\" value=\"";
  if (helper = helpers.line1) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.line1); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Address Line 1\">\n		</div>\n	</div>\n\n	<div class=\"field\" id=\"fields-addressline2-field\">\n		<div class=\"input\">\n			<input class=\"text nicetext fullwidth line2\" type=\"text\" id=\"fields-addressline2\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][line2]\" value=\"";
  if (helper = helpers.line2) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.line2); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Address Line 2\">\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-city-state-zip oh-google-map-clearfix\">\n\n		<div class=\"oh-google-map-city\">\n			<div class=\"field\" id=\"fields-addresscity-field\">\n				<div class=\"input\">\n					<input class=\"text nicetext fullwidth city\" type=\"text\" id=\"fields-addresscity\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][city]\" value=\"";
  if (helper = helpers.city) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.city); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"City\">\n				</div>\n			</div>\n		</div>\n\n		<div class=\"oh-google-map-state\">\n			<div class=\"field\" id=\"fields-addressstate-field\">\n				<div class=\"input\">\n					<input class=\"text nicetext fullwidth state\" type=\"text\" id=\"fields-addressstate\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][state]\" value=\"";
  if (helper = helpers.state) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.state); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"State\">\n				</div>\n			</div>\n		</div>\n\n		<div class=\"oh-google-map-zipcode\">\n			<div class=\"field\" id=\"fields-addresszipcode-field\">\n				<div class=\"input\">\n					<input class=\"text nicetext fullwidth zipcode\" type=\"text\" id=\"fields-addresszipcode\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][zipcode]\" value=\"";
  if (helper = helpers.zipcode) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.zipcode); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Zip Code\">\n				</div>\n			</div>\n		</div>\n\n	</div>\n\n	<div class=\"field\" id=\"fields-addresscountry-field\">\n		<div class=\"input\">\n			<input class=\"text nicetext fullwidth country\" type=\"text\" id=\"fields-addresscountry\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][country]\" value=\"";
  if (helper = helpers.country) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.country); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Country\">\n		</div>\n	</div>\n\n\n	<div class=\"oh-google-map-coordinates oh-google-map-clearfix\">\n\n		<div class=\"oh-google-map-latitude\">\n			<div class=\"field\" id=\"fields-addresslatitude-field\">\n				<div class=\"input\">\n					<input class=\"text nicetext fullwidth latitude\" type=\"text\" id=\"fields-addresslatitude\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][latitude]\" value=\"";
  if (helper = helpers.latitude) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.latitude); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Latitude\">\n				</div>\n			</div>\n		</div>\n\n		<div class=\"oh-google-map-longitude\">\n			<div class=\"field\" id=\"fields-addresslongitude-field\">\n				<div class=\"input\">\n					<input class=\"text nicetext fullwidth longitude\" type=\"text\" id=\"fields-addresslongitude\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][longitude]\" value=\"";
  if (helper = helpers.longitude) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.longitude); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Longitude\">\n				</div>\n			</div>\n		</div>\n\n	</div>\n\n	<textarea class=\"response\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][response]\" style=\"display:none\">";
  if (helper = helpers.response) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.response); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n	<input type=\"hidden\" name=\"fields[";
  if (helper = helpers.fieldname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fieldname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "][locationId]\" value=\"";
  if (helper = helpers.locationId) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.locationId); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n\n</div>";
  return buffer;
  });

templates['button-bar'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<li><a ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.url), {hash:{},inverse:self.noop,fn:self.programWithDepth(2, program2, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " class=\"oh-google-map-control-button small\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.icon), {hash:{},inverse:self.noop,fn:self.programWithDepth(4, program4, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.programWithDepth(6, program6, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a></li>\n";
  return buffer;
  }
function program2(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "href=\""
    + escapeExpression(((stack1 = (depth1 && depth1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"";
  return buffer;
  }

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "<span data-icon=\""
    + escapeExpression(((stack1 = (depth1 && depth1.icon)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></span>";
  return buffer;
  }

function program6(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += " "
    + escapeExpression(((stack1 = (depth1 && depth1.label)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

  buffer += "<ul>\n";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.buttons) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.buttons); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.buttons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

templates['circle-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Circle</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Circle</h2>\n";
  }

function program5(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n	<div class=\"oh-google-map-row oh-google-map-margin-bottom\">\n		<div class=\"oh-google-map-small-12 oh-google-map-columns\">\n			<p>\n				<b>Address</b><br> "
    + escapeExpression(((stack1 = (depth1 && depth1.address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " <a href=\"#\" class=\"set-location oh-google-map-margin-left\">Change Location</a>\n			</p>\n			<p>\n				<b>Latitude</b><br> "
    + escapeExpression(((stack1 = (depth1 && depth1.lat)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n			<p class=\"oh-google-map-margin-bottom\">\n				<b>Longitude</b><br> "
    + escapeExpression(((stack1 = (depth1 && depth1.lng)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n			</p>\n		</div>\n		<div class=\"oh-google-map-small-4 oh-google-map-columns\">\n			<label for=\"radius\">Radius</label>\n			<input type=\"text\" name=\"radius\" id=\"radius\" value=\""
    + escapeExpression(((stack1 = (depth1 && depth1.radius)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"text fullwidth\" />\n		</div>\n		<div class=\"oh-google-map-small-8 oh-google-map-columns\">\n			<label for=\"metric\">Metric</label><br>\n\n			<div class=\"select\">\n			<select name=\"metric\" id=\"metric\">\n				<option value=\"feet\">Feet</option>\n				<option value=\"miles\">Miles</option>\n				<option value=\"meters\">Metres</option>\n				<option value=\"kilometers\">Kilometres</option>\n			</select>\n			</div>\n		</div>\n	</div>\n	";
  return buffer;
  }

function program7(depth0,data) {
  
  
  return "\n		<a class=\"btn set-location\" style=\"margin:5px 10px\">+ Set Location</a>\n	";
  }

function program9(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Circle</button>\n	";
  }

function program11(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	";
  }

  buffer += "<div class=\"oh-google-map-row\">\n	<div class=\"oh-google-map-small-12 oh-google-map-columns\">\n\n";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-radius-tab\">Radius</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-radius-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.lat), {hash:{},inverse:self.noop,fn:self.programWithDepth(5, program5, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.lat), options) : helperMissing.call(depth0, "not", (depth0 && depth0.lat), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-color\">Stroke Color</label>\n				<input type=\"text\" name=\"strokeColor\" id=\"stroke-color\" value=\"";
  if (helper = helpers.strokeColor) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeColor); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"simple-color-picker text fullwidth\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-color\">Fill Color</label>\n				<input type=\"text\" name=\"fillColor\" id=\"fill-color\" value=\"";
  if (helper = helpers.fillColor) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillColor); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"simple-color-picker text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\".6\" data-step=\".1\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"strokeOpacity\" id=\"stroke-opacity\" value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"fill-opacity\" class=\"oh-google-map-small-margin-bottom\">Fill Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.fillOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\".6\" data-step=\".1\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"fillOpacity\" id=\"fill-opacity\" value=\"";
  if (helper = helpers.fillOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Weight</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\"3\" data-step=\"1\" data-min=\"0\" data-max=\"10\"></div>\n				<input type=\"hidden\" name=\"strokeWeight\" id=\"stroke-weight\" value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n		</div>\n	</div>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>\n\n</div>\n\n</div>";
  return buffer;
  });

templates['delete-circle-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Circle?</h2>\n\n<p>Are you sure you want to delete this circle?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Circle</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['delete-ground-overlay-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Image?</h2>\n\n<p>Are you sure you want to delete this image?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Image</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['delete-marker-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Marker?</h2>\n\n<p>Are you sure you want to delete this marker?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Marker</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['delete-polygon-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Polygon?</h2>\n\n<p>Are you sure you want to delete this polygon?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Polygon</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['delete-polyline-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Polyline?</h2>\n\n<p>Are you sure you want to delete this polyline?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Polyline</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['delete-route-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h2>Delete Route?</h2>\n\n<p>Are you sure you want to delete this route?</p>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Delete Route</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  });

templates['edit-marker-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h2>Edit Marker</h2>\n\n<h3><label for=\"title\">Title</label></h3>\n<input type=\"text\" name=\"title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" id=\"content\" class=\"text fullwidth\" />\n\n<h3><label for=\"content\">Content</label></h3>\n<textarea name=\"content\" id=\"content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['geocoder-list'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n							<tr>\n								<td>"
    + escapeExpression(((stack1 = (depth0 && depth0.formatted_address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n							</tr>\n						";
  return buffer;
  }

  buffer += "<div class=\"body\">\n	<div class=\"content\">\n		<div class=\"main\">\n			<h3>Locations Found</h3>\n\n			<div class=\"elements\">\n				<div class=\"tableview\">\n					<table class=\"fullwidth data\">\n						<thead>\n							<tr>\n								<th>Address</th>\n							</tr>\n						</thead>\n						<tbody>\n						";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.locations) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.locations); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.locations) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n						</tbody>\n					</table>\n				</div>\n			</div>\n		</div>\n	</div>\n</div>\n<footer class=\"footer\">\n	<div class=\"buttons right\">\n		<button class=\"btn modal-cancel\">Cancel</button>\n	</div>\n</footer>";
  return buffer;
  });

templates['geocoder'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n<h3>Locations Found</h3>\n\n<ul class=\"oh-google-map-highlight-list\">\n";
  stack1 = helpers.each.call(depth0, (depth1 && depth1.locations), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<li><a href=\"#\">"
    + escapeExpression(((stack1 = (depth0 && depth0.formatted_address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></li>\n";
  return buffer;
  }

  buffer += "<h2>Find a Location</h2>\n\n<input type=\"text\" name=\"location\" value=\"";
  if (helper = helpers.location) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.location); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Enter an address, postal code, or city\" class=\"text fullwidth\" />\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.locations), {hash:{},inverse:self.noop,fn:self.programWithDepth(1, program1, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Search</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['ground-overlay-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Image</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Image</h2>\n";
  }

function program5(depth0,data) {
  
  
  return "N/A";
  }

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += escapeExpression(((stack1 = ((stack1 = (depth1 && depth1.sw)),stack1 == null || stack1 === false ? stack1 : stack1.address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br><a href=\"#\" class=\"set-location\" data-prop=\"sw\">Change Location</a>";
  return buffer;
  }

function program9(depth0,data) {
  
  
  return "\n			<p><a href=\"#\" class=\"btn small set-location\" data-prop=\"sw\">+ Set Location</a></p>\n			";
  }

function program11(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += escapeExpression(((stack1 = ((stack1 = (depth1 && depth1.ne)),stack1 == null || stack1 === false ? stack1 : stack1.address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br><a href=\"#\" class=\"set-location\" data-prop=\"ne\">Change Location</a>";
  return buffer;
  }

function program13(depth0,data) {
  
  
  return "\n			<p><a href=\"#\" class=\"btn small set-location\" data-prop=\"ne\">+ Set Location</a></p>\n			";
  }

function program15(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "<img src=\""
    + escapeExpression(((stack1 = (depth1 && depth1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" />";
  return buffer;
  }

function program17(depth0,data) {
  
  
  return "<i data-icon=\"assets\"></i>";
  }

function program19(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Image</button>\n	";
  }

  buffer += "<div class=\"oh-google-map-row\">\n	<div class=\"oh-google-map-small-12 oh-google-map-columns\">\n\n";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-location-tab\">Location</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-location-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-medium-6 oh-google-map-columns\">\n			<p><b>Southwest Location</b><br>";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.sw), options) : helperMissing.call(depth0, "not", (depth0 && depth0.sw), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.sw), {hash:{},inverse:self.noop,fn:self.programWithDepth(7, program7, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n\n			";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.sw), options) : helperMissing.call(depth0, "not", (depth0 && depth0.sw), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n			<p><b>Northeast Location</b><br>";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.ne), options) : helperMissing.call(depth0, "not", (depth0 && depth0.ne), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.ne), {hash:{},inverse:self.noop,fn:self.programWithDepth(11, program11, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n\n			";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.ne), options) : helperMissing.call(depth0, "not", (depth0 && depth0.ne), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</div>\n		<div class=\"oh-google-map-medium-6 oh-google-map-columns\">\n			<div class=\"oh-google-map-map-icon\">\n				<label>Image</label>\n				<span>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.url), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.url), options) : helperMissing.call(depth0, "not", (depth0 && depth0.url), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n				<a href=\"#\" class=\"set-image\">Set Image</a>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"opacity\" class=\"oh-google-map-small-margin-bottom\">Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.opacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.opacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\"0\" data-step=\".01\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"opacity\" id=\"opacity\" value=\"";
  if (helper = helpers.opacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.opacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n		</div>\n	</div>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(19, program19, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(19, program19, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>\n\n</div>\n\n</div>";
  return buffer;
  });

templates['map-list'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n	\n	<h2>Markers</h2>\n\n	<a href=\"#\" class=\"cancel oh-google-map-close\">&times; close</a>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.markers)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.markers)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = helpers.each.call(depth0, (depth1 && depth1.markers), {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return "\n	<p>There are no markers on the map.</p>\n	";
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"marker-center\">"
    + escapeExpression(((stack1 = (depth0 && depth0.address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program5(depth0,data) {
  
  
  return "<span class=\"oh-google-map-strike-out\">";
  }

function program7(depth0,data) {
  
  
  return "</span> <a href=\"#\" class=\"marker-undo oh-google-map-small-text\">Undo Delete</a>";
  }

function program9(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"markers\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"markers\"><span data-icon=\"trash\"></span></a></span>";
  }

function program11(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n\n	<h2>Routes</h2>\n\n	<a href=\"#\" class=\"cancel oh-google-map-close\">&times; close</a>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.routes)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.routes)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = (helper = helpers.forEach || (depth1 && depth1.forEach),options={hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data},helper ? helper.call(depth0, (depth1 && depth1.routes), options) : helperMissing.call(depth0, "forEach", (depth1 && depth1.routes), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program12(depth0,data) {
  
  
  return "\n	<p>There are no routes on the map.</p>\n	";
  }

function program14(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"route-center\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.programWithDepth(17, program17, data, depth0),data:data},helper ? helper.call(depth0, (depth0 && depth0.title), options) : helperMissing.call(depth0, "not", (depth0 && depth0.title), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(19, program19, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(21, program21, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program15(depth0,data,depth1) {
  
  var stack1;
  return escapeExpression(((stack1 = (depth1 && depth1.title)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  }

function program17(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "Route "
    + escapeExpression(((stack1 = (depth1 && depth1.count)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program19(depth0,data) {
  
  
  return "</span> <a href=\"#\" class=\"route-undo oh-google-map-small-text\">Undo Delete</a>";
  }

function program21(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"routes\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"routes\"><span data-icon=\"trash\"></span></a></span>";
  }

function program23(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n\n	<h2>Polygons</h2>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(24, program24, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.polygons)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.polygons)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = (helper = helpers.forEach || (depth1 && depth1.forEach),options={hash:{},inverse:self.noop,fn:self.program(26, program26, data),data:data},helper ? helper.call(depth0, (depth1 && depth1.polygons), options) : helperMissing.call(depth0, "forEach", (depth1 && depth1.polygons), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program24(depth0,data) {
  
  
  return "\n	<p>There are no polygons on the map.</p>\n	";
  }

function program26(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"polygon-center\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.programWithDepth(27, program27, data, depth0),data:data},helper ? helper.call(depth0, (depth0 && depth0.title), options) : helperMissing.call(depth0, "not", (depth0 && depth0.title), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(29, program29, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(31, program31, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program27(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "Polygon "
    + escapeExpression(((stack1 = (depth1 && depth1.count)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program29(depth0,data) {
  
  
  return "</span> <a href=\"#\" class=\"polygon-undo oh-google-map-small-text\">Undo Delete</a>";
  }

function program31(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"polygons\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"polygons\"><span data-icon=\"trash\"></span></a></span>";
  }

function program33(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n\n	<h2>Polylines</h2>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(34, program34, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.polylines)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.polylines)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = (helper = helpers.forEach || (depth1 && depth1.forEach),options={hash:{},inverse:self.noop,fn:self.program(36, program36, data),data:data},helper ? helper.call(depth0, (depth1 && depth1.polylines), options) : helperMissing.call(depth0, "forEach", (depth1 && depth1.polylines), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program34(depth0,data) {
  
  
  return "\n		<p>There are no polylines on the map.</p>\n	";
  }

function program36(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"polyline-center\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.programWithDepth(37, program37, data, depth0),data:data},helper ? helper.call(depth0, (depth0 && depth0.title), options) : helperMissing.call(depth0, "not", (depth0 && depth0.title), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(39, program39, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(41, program41, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program37(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "Polyline "
    + escapeExpression(((stack1 = (depth1 && depth1.count)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program39(depth0,data) {
  
  
  return "</span> <a href=\"#\" class=\"polyline-undo oh-google-map-small-text\">Undo Delete</a>";
  }

function program41(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"polylines\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"polylines\"><span data-icon=\"trash\"></span></a></span>";
  }

function program43(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n\n	<h2>Circles</h2>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(44, program44, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.circles)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.circles)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = (helper = helpers.forEach || (depth0 && depth0.forEach),options={hash:{},inverse:self.noop,fn:self.program(46, program46, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.circles), options) : helperMissing.call(depth0, "forEach", (depth0 && depth0.circles), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program44(depth0,data) {
  
  
  return "\n		<p>There are no circles on the map.</p>\n	";
  }

function program46(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"circle-center\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.programWithDepth(47, program47, data, depth0),data:data},helper ? helper.call(depth0, (depth0 && depth0.title), options) : helperMissing.call(depth0, "not", (depth0 && depth0.title), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(49, program49, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(51, program51, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program47(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "Circle "
    + escapeExpression(((stack1 = (depth1 && depth1.count)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program49(depth0,data) {
  
  
  return "</span> <a href=\"#\" class=\"circle-undo oh-google-map-small-text\">Undo Delete</a>";
  }

function program51(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"circles\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"circles\"><span data-icon=\"trash\"></span></a></span>";
  }

function program53(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n\n	<h2>Images</h2>\n\n	";
  stack1 = (helper = helpers.not || (depth1 && depth1.not),options={hash:{},inverse:self.noop,fn:self.program(54, program54, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth1 && depth1.overlays)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth1 && depth1.overlays)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<ol class=\"oh-google-map-ordered-list\">\n	";
  stack1 = (helper = helpers.forEach || (depth1 && depth1.forEach),options={hash:{},inverse:self.noop,fn:self.program(56, program56, data),data:data},helper ? helper.call(depth0, (depth1 && depth1.overlays), options) : helperMissing.call(depth0, "forEach", (depth1 && depth1.overlays), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ol>\n\n";
  return buffer;
  }
function program54(depth0,data) {
  
  
  return "\n		<p>There are no images on the map.</p>\n	";
  }

function program56(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n		<li>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"#\" class=\"overlay-center\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.programWithDepth(15, program15, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.programWithDepth(57, program57, data, depth0),data:data},helper ? helper.call(depth0, (depth0 && depth0.title), options) : helperMissing.call(depth0, "not", (depth0 && depth0.title), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.deleted), {hash:{},inverse:self.noop,fn:self.program(49, program49, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(59, program59, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.deleted), options) : helperMissing.call(depth0, "not", (depth0 && depth0.deleted), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n	";
  return buffer;
  }
function program57(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "Image "
    + escapeExpression(((stack1 = (depth1 && depth1.count)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program59(depth0,data) {
  
  
  return "<span class=\"actions\"><a href=\"#\" class=\"edit\" data-property=\"groundOverlays\"><span data-icon=\"edit\"></span></a> <a href=\"#\" class=\"delete\" data-property=\"groundOverlays\"><span data-icon=\"trash\"></span></a></span>";
  }

  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showMarkers), {hash:{},inverse:self.noop,fn:self.programWithDepth(1, program1, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showRoutes), {hash:{},inverse:self.noop,fn:self.programWithDepth(11, program11, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showPolygons), {hash:{},inverse:self.noop,fn:self.programWithDepth(23, program23, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showPolylines), {hash:{},inverse:self.noop,fn:self.programWithDepth(33, program33, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showCircles), {hash:{},inverse:self.noop,fn:self.programWithDepth(43, program43, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showImages), {hash:{},inverse:self.noop,fn:self.programWithDepth(53, program53, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });

templates['map'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"oh-google-map-window\"></div>\n\n<div class=\"oh-google-map-controls\"></div>\n\n<div class=\"oh-google-map-side-controls\">\n	<a href=\"#\" class=\"oh-google-map-control-button oh-google-map-zoom-in\">&plus;</a>\n	<a href=\"#\" class=\"oh-google-map-control-button oh-google-map-zoom-out\">&minus;</a>\n	<a href=\"#\" class=\"oh-google-map-control-button oh-google-map-map-type\"><i data-icon=\"settings\"></i></a>\n</div>\n\n<div class=\"oh-google-map\" style=\"width:";
  if (helper = helpers.width) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.width); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "; height:";
  if (helper = helpers.height) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.height); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"></div>\n\n<div id=\"oh-google-map-map-type-menu\" class=\"menu\" data-align=\"right\">\n	<h6>Map Type</h6>\n\n	<ul class=\"padded\">\n		<li><a href=\"#\" data-type=\"roadmap\">Roadmap</a></li>\n		<li><a href=\"#\" data-type=\"satellite\">Satellite</a></li>\n		<li><a href=\"#\" data-type=\"terrain\">Terrain</a></li>\n		<li><a href=\"#\" data-type=\"hybrid\">Hybrid</a></li>\n	</ul>\n</div>";
  return buffer;
  });

templates['marker-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Marker</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Marker</h2>\n";
  }

function program5(depth0,data,depth1) {
  
  var stack1;
  return escapeExpression(((stack1 = (depth1 && depth1.icon)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  }

function program7(depth0,data) {
  
  
  return "http://mt.googleapis.com/vt/icon/name=icons/spotlight/spotlight-poi.png&scale=2";
  }

function program9(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Marker</button>\n	";
  }

function program11(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	";
  }

  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-location-tab\">Location</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-location-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-8\">\n			<p><b>Address:</b> <span class=\"address\">";
  if (helper = helpers.address) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.address); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span></p>\n			<p><b>Latitude:</b> <span class=\"lat\">";
  if (helper = helpers.lat) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lat); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span></p>\n			<p><b>Longitude:</b> <span class=\"lng\">";
  if (helper = helpers.lng) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lng); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span></p>\n\n			<a href=\"#\" class=\"edit-location\">Change Location</a>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-4\">\n			<div class=\"oh-google-map-map-icon\">\n				<label>Map Icon</label>\n				<span><img src=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.icon), {hash:{},inverse:self.noop,fn:self.programWithDepth(5, program5, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.icon), options) : helperMissing.call(depth0, "not", (depth0 && depth0.icon), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" /></span>\n				<a href=\"#\" class=\"change-icon\">Change Icon</a>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-margin-bottom\">\n\n		<b>Scaled Icon Size</b>\n		<p>Enter the scaled width and height of the icon to alter the size as it appears on the map.</p>\n\n		<div class=\"oh-google-map-row\">\n			<div class=\"oh-google-map-column oh-google-map-large-6\">\n				<label for=\"icon-width\">Width</label>\n				<input type=\"text\" name=\"scaledWidth\" id=\"icon-width\" value=\"";
  if (helper = helpers.scaledWidth) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.scaledWidth); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n			<div class=\"oh-google-map-column oh-google-map-large-6\">\n				<label for=\"icon-height\">Height</label>\n				<input type=\"text\" name=\"scaledHeight\" id=\"icon-height\" value=\"";
  if (helper = helpers.scaledHeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.scaledHeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['polygon-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Polygon</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Polygon</h2>\n";
  }

function program5(depth0,data) {
  
  
  return "Show Details";
  }

function program7(depth0,data) {
  
  
  return "Hide Details";
  }

function program9(depth0,data) {
  
  
  return "style=\"display:none\"";
  }

function program11(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n			<div class=\"oh-google-map-tag\" title=\"";
  if (helper = helpers.lat) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lat); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + ",";
  if (helper = helpers.lng) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lng); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n				<span>Point ";
  if (helper = helpers.count) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.count); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n				<a href=\"#\" class=\"remove\"><span>&times;</span></a>\n			</div>\n			";
  return buffer;
  }

function program13(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Polygon</button>\n	";
  }

function program15(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	";
  }

  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-points-tab\">Points</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-points-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	<p><span class=\"oh-google-map-small-text\"><a href=\"#\" class=\"toggle-details\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.hideDetails), options) : helperMissing.call(depth0, "not", (depth0 && depth0.hideDetails), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a></span></p>\n\n	<div class=\"details\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n		<p class=\"oh-google-map-small-text\">To add points to the polygon, you can either double click the map or add enter coordinates or addresses manually.</p>\n\n		<div class=\"points oh-google-map-tags\">\n			";
  stack1 = (helper = helpers.forEach || (depth0 && depth0.forEach),options={hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.points), options) : helperMissing.call(depth0, "forEach", (depth0 && depth0.points), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</div>\n	</div>\n\n	<div class=\"point-field\">\n		<input type=\"text\" name=\"point\" value=\"\" class=\"text\" placeholder=\"Enter a coordinate or address\" style=\"width:45%;\" /> <a class=\"btn add-point\" style=\"margin-left:10px;\">+ Add Point</a>\n	</div>\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-color\">Stroke Color</label>\n				<input type=\"text\" name=\"strokeColor\" id=\"stroke-color\" value=\"";
  if (helper = helpers.strokeColor) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeColor); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"simple-color-picker text fullwidth\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-color\">Fill Color</label>\n				<input type=\"text\" name=\"fillColor\" id=\"fill-color\" value=\"";
  if (helper = helpers.fillColor) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillColor); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"simple-color-picker text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\".6\" data-step=\".1\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"strokeOpacity\" id=\"stroke-opacity\" value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"fill-opacity\" class=\"oh-google-map-small-margin-bottom\">Fill Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.fillOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\".6\" data-step=\".1\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"fillOpacity\" id=\"fill-opacity\" value=\"";
  if (helper = helpers.fillOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.fillOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Weight</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\"3\" data-step=\"1\" data-min=\"0\" data-max=\"10\"></div>\n				<input type=\"hidden\" name=\"strokeWeight\" id=\"stroke-weight\" value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n		</div>\n	</div>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['polyline-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Polyline</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Polyline</h2>\n";
  }

function program5(depth0,data) {
  
  
  return "Show Details";
  }

function program7(depth0,data) {
  
  
  return "Hide Details";
  }

function program9(depth0,data) {
  
  
  return "style=\"display:none\"";
  }

function program11(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n			<div class=\"oh-google-map-tag\" title=\"";
  if (helper = helpers.lat) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lat); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + ",";
  if (helper = helpers.lng) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.lng); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n				<span>Point ";
  if (helper = helpers.count) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.count); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n				<a href=\"#\" class=\"remove\"><span>&times;</span></a>\n			</div>\n			";
  return buffer;
  }

function program13(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Polyline</button>\n	";
  }

function program15(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	";
  }

  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-points-tab\">Points</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-points-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	<p><span class=\"oh-google-map-small-text\"><a href=\"#\" class=\"toggle-details\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.hideDetails), options) : helperMissing.call(depth0, "not", (depth0 && depth0.hideDetails), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a></span></p>\n\n	<div class=\"details\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n		<p class=\"oh-google-map-small-text\">To add points to the polygon, you can either double click the map or add enter coordinates or addresses manually.</p>\n\n		<div class=\"points oh-google-map-tags\">\n			";
  stack1 = (helper = helpers.forEach || (depth0 && depth0.forEach),options={hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.points), options) : helperMissing.call(depth0, "forEach", (depth0 && depth0.points), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</div>\n	</div>\n\n	<div class=\"point-field\">\n		<input type=\"text\" name=\"point\" value=\"\" class=\"text\" placeholder=\"Enter a coordinate or address\" style=\"width:45%;\" /> <a class=\"btn add-point\" style=\"margin-left:10px;\">+ Add Point</a>\n	</div>\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-color\">Stroke Color</label>\n				<input type=\"text\" name=\"strokeColor\" id=\"stroke-color\" value=\"";
  if (helper = helpers.strokeColor) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeColor); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"simple-color-picker text fullwidth\" />\n			</div>\n		</div>\n		<div class=\"oh-google-map-column oh-google-map-large-6\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Opacity</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\".6\" data-step=\".1\" data-min=\"0\" data-max=\"1\"></div>\n				<input type=\"hidden\" name=\"strokeOpacity\" id=\"stroke-opacity\" value=\"";
  if (helper = helpers.strokeOpacity) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeOpacity); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"stroke-opacity\" class=\"oh-google-map-small-margin-bottom\">Stroke Weight</label>\n				<div class=\"slider\" data-value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-start=\"3\" data-step=\"1\" data-min=\"0\" data-max=\"10\"></div>\n				<input type=\"hidden\" name=\"strokeWeight\" id=\"stroke-weight\" value=\"";
  if (helper = helpers.strokeWeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.strokeWeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['route-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "\n	<h2>Add Route</h2>\n";
  }

function program3(depth0,data) {
  
  
  return "\n	<h2>Edit Route</h2>\n";
  }

function program5(depth0,data) {
  
  
  return "Show Details";
  }

function program7(depth0,data) {
  
  
  return "Hide Details";
  }

function program9(depth0,data,depth1) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n	<ul class=\"oh-google-map-icon-list oh-google-map-clearfix\">\n		";
  stack1 = (helper = helpers.forEach || (depth1 && depth1.forEach),options={hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data},helper ? helper.call(depth0, (depth1 && depth1.locations), options) : helperMissing.call(depth0, "forEach", (depth1 && depth1.locations), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ul>\n	";
  return buffer;
  }
function program10(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n		<li>\n			<img src=\"";
  if (helper = helpers.icon) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.icon); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"Marker Icon\" class=\"oh-google-map-icon-list-icon\" /> \n			<span class=\"oh-google-map-icon-list-label\">\n				";
  if (helper = helpers.address) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.address); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + " \n				<a href=\"#\" class=\"remove-location oh-google-map-icon-list-action\"><span data-icon=\"trash\"></span></a>\n				<a href=\"#\" class=\"edit-location oh-google-map-icon-list-action\" ><span data-icon=\"field\"></span></a> \n			</span>\n		</li>\n		";
  return buffer;
  }

function program12(depth0,data) {
  
  
  return "\n		<!-- <p class=\"oh-google-map-margin-bottom\"><em>There are no locations added to this route yet.</em></p> -->\n	";
  }

function program14(depth0,data) {
  
  
  return "style=\"display:none\"";
  }

function program16(depth0,data) {
  
  
  return "checked=\"checked\"";
  }

function program18(depth0,data) {
  
  
  return "on";
  }

function program20(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Route</button>\n	";
  }

function program22(depth0,data) {
  
  
  return "\n		<button type=\"submit\" class=\"btn submit\">Save Changes</button>\n	";
  }

  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<nav class=\"oh-google-map-tabs oh-google-map-clearfix oh-google-map-three-up\">\n	<ul>\n		<li><a class=\"oh-google-map-tab-trigger active\" href=\"#oh-locations-tab\">Locations</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-content-tab\">Content</a></li>\n		<li><a class=\"oh-google-map-tab-trigger\" href=\"#oh-options-tab\">Options</a></li>\n	</ul>\n</nav>\n\n<div id=\"oh-locations-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<!--\n	<p><span class=\"oh-google-map-small-text\"><a href=\"#\" class=\"toggle-details\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.hideDetails), options) : helperMissing.call(depth0, "not", (depth0 && depth0.hideDetails), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a></span></p>\n	-->\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.locations), {hash:{},inverse:self.noop,fn:self.programWithDepth(9, program9, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.locations)),stack1 == null || stack1 === false ? stack1 : stack1.length), options) : helperMissing.call(depth0, "not", ((stack1 = (depth0 && depth0.locations)),stack1 == null || stack1 === false ? stack1 : stack1.length), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	<!--\n	<div class=\"details\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.hideDetails), {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n		<p class=\"oh-google-map-small-text\">You can add up to 8 locations to a single route. You can either double click the map or add enter coordinates or addresses manually.</p>\n	</div>\n	-->\n\n	<a class=\"btn add-location\" style=\"margin:5px 10px\">+ Add Location</a>\n\n</div>\n\n<div id=\"oh-content-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n	\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Title</label>\n				<input type=\"text\" name=\"title\" id=\"poly-title\" value=\"";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text fullwidth\" />\n			</div>\n		</div>\n	</div>\n\n	<div class=\"oh-google-map-row\">\n		<div class=\"oh-google-map-column oh-google-map-large-12\">\n			<div class=\"oh-google-map-margin-bottom\">\n				<label for=\"poly-title\">Content</label>\n				<textarea name=\"content\" id=\"poly-content\" class=\"text fullwidth\">";
  if (helper = helpers.content) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.content); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n			</div>\n		</div>\n	</div>\n\n</div>\n\n<div id=\"oh-options-tab\" class=\"oh-google-map-clearfix oh-google-map-tab\">\n\n	<div class=\"btngroup\" style=\"margin:5px auto 25px auto;width:260px;display:block;\">\n		<label class=\"btn\"><input type=\"radio\" name=\"travelMode\" value=\"DRIVING\" ";
  stack1 = (helper = helpers.is || (depth0 && depth0.is),options={hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.travelMode), "DRIVING", options) : helperMissing.call(depth0, "is", (depth0 && depth0.travelMode), "DRIVING", options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.travelMode), options) : helperMissing.call(depth0, "not", (depth0 && depth0.travelMode), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " /> Driving</label>\n		<label class=\"btn\"><input type=\"radio\" name=\"travelMode\" value=\"WALKING\" ";
  stack1 = (helper = helpers.is || (depth0 && depth0.is),options={hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.travelMode), "WALKING", options) : helperMissing.call(depth0, "is", (depth0 && depth0.travelMode), "WALKING", options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " /> Walking</label>\n		<label class=\"btn\"><input type=\"radio\" name=\"travelMode\" value=\"BICYCLING\" ";
  stack1 = (helper = helpers.is || (depth0 && depth0.is),options={hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.travelMode), "BICYCLING", options) : helperMissing.call(depth0, "is", (depth0 && depth0.travelMode), "BICYCLING", options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " /> Bicycling</label>\n	</div>\n\n	<ul class=\"oh-google-map-small-block-grid-3\">\n		<li>\n			<p>Avoid Ferries</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidFerries), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"avoidFerries\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidFerries), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n		<li>\n			<p>Avoid Highways</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidHighways), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"avoidHighways\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidHighways), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n		<li>\n			<p>Avoid Tolls</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidTolls), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"avoidTolls\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.avoidTolls), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n		<li>\n			<p>Calculate Duration with Traffic</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.durationInTraffic), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"durationInTraffic\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.durationInTraffic), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n		<li>\n			<p>Optimize Waypoints</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.optimizeWaypoints), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"optimizeWaypoints\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.optimizeWaypoints), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n		<li>\n			<p>Provide Route Alternatives</p>\n\n			<div class=\"lightswitch ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.provideRouteAlternatives), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabindex=\"0\">\n				<div class=\"lightswitch-container\">\n					<div class=\"label on\"></div>\n					<div class=\"handle\"></div>\n					<div class=\"label off\"></div>\n				</div>\n				<input type=\"hidden\" name=\"provideRouteAlternatives\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.provideRouteAlternatives), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" />\n			</div>\n		</li>\n	</ul>\n\n</div>\n\n<footer>\n	";
  stack1 = (helper = helpers.not || (depth0 && depth0.not),options={hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data},helper ? helper.call(depth0, (depth0 && depth0.isSavedToMap), options) : helperMissing.call(depth0, "not", (depth0 && depth0.isSavedToMap), options));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n	";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSavedToMap), {hash:{},inverse:self.noop,fn:self.program(22, program22, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });

templates['route-location-form'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n<h3>Locations Found</h3>\n\n<ul class=\"oh-google-map-highlight-list\">\n";
  stack1 = helpers.each.call(depth0, (depth1 && depth1.locations), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<li><a href=\"#\">"
    + escapeExpression(((stack1 = (depth0 && depth0.formatted_address)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></li>\n";
  return buffer;
  }

  buffer += "<h2>Add Location</h2>\n\n<input type=\"text\" name=\"location\" value=\"";
  if (helper = helpers.location) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.location); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Enter an address, postal code, or city\" class=\"text fullwidth\" />\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.locations), {hash:{},inverse:self.noop,fn:self.programWithDepth(1, program1, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<footer>\n	<button type=\"submit\" class=\"btn submit\">Search</button>\n	<a href=\"#\" class=\"cancel\">Cancel</a>\n</footer>";
  return buffer;
  });
}());
var GoogleMaps = {
	Views: {},
	Models: {},
	addressFieldData: [],
	mapFieldData: [],
	instances: [],
	init: function() {
		var t = this;

		_.each(this.addressFieldData, function(data) {
			t.initAddressField(data);
		});

		_.each(this.mapFieldData, function(data) {
			t.initMapField(data);
		});
	},
	initAddressField: function(data) {
		var t = this;

		if(data) {
			new GoogleMaps.AddressFieldType(data[0], data[1]);
		}
		else {
			_.each(this.addressFieldData, function(data) {
				t.instances.push(new GoogleMaps.AddressFieldType(data[0], data[1]));
			});

			this.addressFieldData = [];
		}
	},
	initMapField: function(data) {
		var t = this;

		if(data) {
			new GoogleMaps.MapFieldType(data[0], data[1]);
		}
		else {
			_.each(this.mapFieldData, function(data) {
				t.instances.push(new GoogleMaps.MapFieldType(data[0], data[1]));
			});

			this.mapFieldData = [];
		}
	}
};

(function() {
	
	"use strict";

	Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
        return Handlebars.compile(rawTemplate);
    };

	GoogleMaps.Template = function(name) {
		var template;

		if(Handlebars.templates[name]) {
			return Handlebars.templates[name];
		}
		else {
			return false;
		}
	};

	GoogleMaps.addScript = function(url, callback) {
		if(typeof google === "undefined") {
		    var script = document.createElement('script');
		    if(callback) script.onload = callback;
		    script.type = 'text/javascript';
		    script.src = url;
		    document.body.appendChild(script);
		}
		else {
			GoogleMaps.googleApiCallback();
		}
	};

	GoogleMaps.MapFieldType = Garnish.Base.extend({

		init: function($el, options) {
			var t = this;

			this.$container = $($el);

			var App = new Backbone.Marionette.Application();

			this.App = App;

			App.options = options;

			App.addRegions({
				content: $el
			});
		
			var coord = options.center.split(',');

			var map = new GoogleMaps.Views.Map({
				fieldname: options.fieldname,
				savedData: options.savedData,
				width: options.width,
				height: options.height,
				mapOptions: {
					center: new google.maps.LatLng(parseFloat(coord[0]), parseFloat(coord[1])),
					zoom: options.zoom
				},
				showButtons: options.showButtons,
				availableButtons: options.availableButtons,
				addressFields: options.addressFields
			});

			this.map = map;

			App.addInitializer(function() {

				setTimeout(function() {
					map.redraw();
					map.updateHiddenField();
				}, 100);

				App.content.show(map);

			});

			t.addListener(window, 'resize', function(ev) {
				if(map.$el.parents('.field').parent().css('display') == 'block') {
                	map.redraw();
                	map.center();

                	t.removeListener(window, 'resize');
                }
            });

			App.start();
		}

	});

	GoogleMaps.AddressFieldType = Garnish.Base.extend({

		init: function($el, options) {
			var t = this;

			this.$container = $($el);

			var App = new Backbone.Marionette.Application();

			this.App = App;

			App.options = options;

			App.addRegions({
				content: $el
			});

			var address = new GoogleMaps.Views.Address({
				savedData: options.savedData,
				fieldname: options.fieldname
			});

			App.content.show(address);
		}

	});


}());
(function() {

	"use strict";

	GoogleMaps.Models.Base = Backbone.Model.extend({

		initialize: function(options) {
			var t = this;

			_.each(options, function(option, i) {
				if(_.isFunction(option)) {
					t[i] = option;
				}
			});

			this.set(options);			
		},

		toJSON: function() {
			var json = Backbone.Model.prototype.toJSON.call(this);

			delete json.api;
			delete json.map;
			delete json.infowindow;

			return json;
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Address = GoogleMaps.Models.Base.extend({

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.BaseMapObject = GoogleMaps.Models.Base.extend({

		initializeApi: function() {},

		edit: function(showMapList) {},

		delete: function(showMapList) {},

		bindEvents: function() {},

		// Reset map object to original settings when an object form is cancelled
		reset: function() {},

		getInfoWindowPosition: function() {
			return this.getPosition();
		},

		buildInfoWindowContent: function() {
			var content = this.get('content');
			var _return = ['<div>', (_.isArray(content) ? content.join('') : content)];

			var t = this, latLng = this.getInfoWindowPosition();

			_return.push([
					'<div class="oh-google-map-infowindow-actions">',
						'<a href="#" class="edit">Edit</a> | ',
						'<a href="#" class="delete">Delete</a>',
					'</div>',
				'</div>'
			].join(''));

			var $content = $(_return.join(''));

			$content.find('.edit').click(function(e) {
				t.edit();

				e.preventDefault();
			});

			$content.find('.delete').click(function(e) {
				t.delete();

				e.preventDefault();
			});

			return $content.get(0);
		},

		remove: function() {
			this.get('infowindow').close();
			this.set('deleted', true);
			this.setMap(null);
		},

		onDragend: function(e, callback) {
			var t = this;

			t.set({
				lat: e.latLng.lat(),
				lng: e.latLng.lng()
			});

			this.get('map').geocoder.geocode({location: e.latLng}, function(results, status) {
				if(status == 'OK') {
					t.set('address', results[0].formatted_address);
					t.set('addressComponents', results[0].address_components);
				}
				else {
					t.set('address', null);
					t.set('addressComponents', null);
				}

				if(!t.get('customContent')) {
					if(!t.isCoordinate(t.get('address'))) {
						t.set('content', t.get('address').split(',').join('<br>'));
					}
					else {
						t.set('content', t.get('address'));
					}

					t.get('infowindow').setContent(t.buildInfoWindowContent());
				}

				t.get('map').updateHiddenField();
				
				if(_.isFunction(callback)) {
					callback(e);
				}
			});
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Circle = GoogleMaps.Models.BaseMapObject.extend({

		strokeColor: '#000000',

		strokeWeight: 3,

		strokeOpacity: 0.6,

		fillColor: '#666666',

		fillOpacity: 0.6,

		initialize: function(options) {
			
			if(!options.strokeColor) {
				options.strokeColor = this.strokeColor;
			}

			if(!options.strokeOpacity) {
				options.strokeOpacity = this.strokeOpacity;
			}

			if(!options.strokeWeight) {
				options.strokeWeight = this.strokeWeight;
			}

			if(!options.fillColor) {
				options.fillColor = this.fillColor;
			}

			if(!options.fillOpacity) {
				options.fillOpacity = this.fillOpacity;
			}

			GoogleMaps.Models.Base.prototype.initialize.call(this, options);

			if(!this.get('radius')) {
				this.set('radius', 100);
			}

			if(!this.get('api')) {
				this.initializeApi(options);
			}
			else {
				this.get('api').setMap(this.get('map').api);
			}

			if(!this.get('infowindow')) {
				this.set('infowindow', new google.maps.InfoWindow({
					maxWidth: 300,
					content: this.buildInfoWindowContent()
				}));
			}

			this.bindEvents();
		},

		convertRadiusToMeters: function(radius, metric) {
			if(!radius) {
				radius = this.get('radius');
			}

			if(!metric) {
				metric = this.get('metric');
			}

			radius = parseFloat(radius);

			if(metric == 'miles') {
				radius *= 1609.34;
			}
			else if(metric == 'feet') {
				radius *= 0.3048;
			}
			else if(metric == 'kilometers') {
				radius *= 1000;
			}

			return radius;
		},

		convertRadiusFromMeters: function(radius, metric) {
			if(!radius) {
				radius = this.get('radius');
			}

			if(!metric) {
				metric = this.get('metric');
			}

			radius = parseFloat(radius);

			if(metric == 'miles') {
				radius *= 0.000621371;
			}
			else if(metric == 'feet') {
				radius *= 3.28084;
			}
			else if(metric == 'kilometers') {
				radius *= 0.001;
			}

			return radius;
		},

		hasLocation: function() {
			return !_.isUndefined(this.get('lat')) && !_.isUndefined(this.get('lng'));
		},
		
		initializeApi: function(options) {
			if(!_.isObject(options)) {
				options = {};
			}

			this.set('api', new google.maps.Circle(_.extend({}, options, {
				map: this.hasLocation() ? this.get('map').api : null,
				center: this.hasLocation() ? new google.maps.LatLng(this.get('lat'), this.get('lng')) : new google.maps.LatLng(0, 0),
				radius: this.convertRadiusToMeters(),
				draggable: this.get('draggable') ? true : false
			})));
		},

		edit: function(showMapList) {				
			var t = this, view = new GoogleMaps.Views.CircleForm({
				model: this,
				map: this.get('map'),
				cancel: function() {
					GoogleMaps.Views.CircleForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.BaseForm({
				template: GoogleMaps.Template('delete-circle-form'),
				submit: function() {
					t.get('api').setMap(null);
					t.set('deleted', true);
					t.get('map').updateHiddenField();
					
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}

					t.get('map').closeInfoWindows();
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			this.get('map').showModal(view);
		},

		getBounds: function() {
			return this.get('api').getBounds();
		},

		getCenter: function() {
			return this.get('api').getCenter();
		},

		getPosition: function() {
			return this.get('api').getCenter();
		},

		getDraggable: function() {
			return this.get('api').getDraggable();
		},

		getEditable: function() {
			return this.get('api').getEditable();
		},

		getMap: function() {
			return this.get('api').getMap();
		},

		getRadius: function() {
			return this.get('api').getRadius();
		},

		getVisible: function() {
			return this.get('api').getVisible();
		},

		setAnimation: function(value) {
			this.get('api').setAnimation(value);
		},

		setClickable: function(value) {
			this.get('api').setClickable(value);
		},
		
		setCenter: function(value) {
			this.get('api').setCenter(value);
		},
		
		setDraggable: function(value) {
			this.get('api').setDraggable(value);
		},
				
		setEditable: function(value) {
			this.get('api').setEditable(value);
		},

		setMap: function(value) {
			this.get('api').setMap(value);
		},
		
		setOptions: function(value) {
			this.get('api').setOptions(value);
		},
		
		setRadius: function(value) {
			this.get('api').setRadius(this.convertRadiusToMeters(value));
		},
		
		setVisible: function(value) {
			this.get('api').setVisible(value);
		},
		
		bindEvents: function() {
			var t = this;

			google.maps.event.addListener(this.get('api'), 'center_changed', function() {
				t.onCenterChanged.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'click', function() {
				t.onClick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'dblclick', function() {
				t.onDblclick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'drag', function() {
				t.onDrag.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'dragend', function() {
				t.onDragend.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'dragstart', function() {
				t.onDragstart.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mousedown', function() {
				t.onMousedown.apply(t, arguments);
			});
						
			google.maps.event.addListener(this.get('api'), 'mousemove', function() {
				t.onMousemove.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseout', function() {
				t.onMouseout.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseover', function() {
				t.onMouseover.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'mouseup', function() {
				t.onMouseup.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'radius_changed', function() {
				t.onRadiusChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'rightclick', function() {
				t.onRightclick.apply(t, arguments);
			});
		},

		onCenterChanged: function() {
			var center = this.get('api').getCenter();

			this.set({
				lat: center.lat(),
				lng: center.lng()
			});
		},

		onClick: function(e) {
			this.get('map').closeInfoWindows();
			this.get('infowindow').open(this.get('map').api);
			this.get('infowindow').setPosition(e.latLng);
		},

		onDblclick: function() {},

		onDrag: function() {},

		onDragend: function() {
			GoogleMaps.Models.BaseMapObject.prototype.onDragend.apply(this, arguments);
		},

		onDragstart: function() {},

		onMousedown: function() {},

		onMousemove: function() {},

		onMouseover: function() {},

		onMouseout: function() {},

		onMouseup: function() {},

		onRadiusChanged: function() {

			this.set('radius', Math.round(this.convertRadiusFromMeters(this.get('api').getRadius()) * 100) / 100);
			// this.set('radius', this.get('api').getRadius());
		},

		onRightclick: function() {}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.GroundOverlay = GoogleMaps.Models.BaseMapObject.extend({

		initialize: function(options) {
			
			GoogleMaps.Models.Base.prototype.initialize.call(this, options);

			if(!this.get('api')) {
				this.initializeApi(options);
			}
			else {
				this.get('api').setMap(this.get('map').api);
			}

			if(!this.get('infowindow')) {
				this.set('infowindow', new google.maps.InfoWindow({
					maxWidth: 300,
					content: this.buildInfoWindowContent()
				}));
			}

			this.bindEvents();
		},

		initializeApi: function(options) {
			if(!_.isObject(options)) {
				options = {};
			}

			options = _.extend({}, options, {
				map: this.get('map').api,
				opacity: 1
			});

			if(this.get('sw') && this.get('ne')) {
				options.bounds = new google.maps.LatLngBounds(
					new google.maps.LatLng(this.get('sw').lat, this.get('sw').lng),
					new google.maps.LatLng(this.get('ne').lat, this.get('ne').lng)
				);
			}

			if(this.get('url')) {
				options.url = this.get('url');
			}

			if(this.get('opacity')) {
				options.opacity = this.get('opacity');
			}

			var bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(0, 0),
				new google.maps.LatLng(0, 10)
			);

			this.set('api', new google.maps.GroundOverlay(this.get('url'), bounds, options));
		},

		hasLocation: function() {
			return true;
		},

		getInfoWindowPosition: function() {
			return new google.maps.LatLng(0, 0);
		},

		edit: function(showMapList) {				
			var t = this, view = new GoogleMaps.Views.GroundOverlayForm({
				model: this,
				map: this.get('map'),
				cancel: function() {
					GoogleMaps.Views.GroundOverlayForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.BaseForm({
				template: GoogleMaps.Template('delete-ground-overlay-form'),
				submit: function() {
					t.get('api').setMap(null);
					t.set('deleted', true);
					t.get('map').updateHiddenField();
					
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}

					t.get('map').closeInfoWindows();
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			this.get('map').showModal(view);
		},

		getBounds: function() {
			return this.get('api').getBounds();
		},

		getMap: function() {
			return this.get('api').getMap();
		},

		getOpacity: function() {
			return this.get('api').getOpacity();
		},

		getUrl: function() {
			return this.get('api').getUrl();
		},

		setMap: function(value) {
			this.get('api').setMap(value);
		},
		
		setOpacity: function(value) {
			this.get('api').setOpacity(value);
		},

		setOptions: function(value) {
			this.get('api').setOptions(value);
		},
		
		bindEvents: function() {
			var t = this;

			google.maps.event.addListener(this.get('api'), 'click', function() {
				t.onClick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'dblclick', function() {
				t.onDblclick.apply(t, arguments);
			});
		},

		onClick: function(e) {
			this.get('map').closeInfoWindows();
			this.get('infowindow').open(this.get('map').api);
			this.get('infowindow').setPosition(e.latLng);
		},

		onDblclick: function() {}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Marker = GoogleMaps.Models.Base.extend({

		initialize: function(options) {
			GoogleMaps.Models.Base.prototype.initialize.call(this, options);

			if(!this.get('api')) {
				this.initializeApi(options);
			}
			else {
				this.get('api').setMap(this.get('map').api);
			}

			if(this.get('icon')) {
				this.setIcon(this.get('icon'));
			}

			if(!this.get('infowindow')) {
				this.set('infowindow', new google.maps.InfoWindow({
					maxWidth: 300,
					content: this.buildInfoWindowContent()
				}));
			}

			this.bindEvents();
		},
		
		initializeApi: function(options) {
			if(!_.isObject(options)) {
				options = {};
			}

			this.set('api', new google.maps.Marker(_.extend({}, options, {
				map: this.get('map').api,
				position: new google.maps.LatLng(this.get('lat'), this.get('lng')),
				draggable: this.get('draggable') === false ? false : true
			})));
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		},

		edit: function(showMapList) {
			var t = this, view = new GoogleMaps.Views.MarkerForm({
				model: this,
				map: this.get('map'),
				cancel: function() {
					GoogleMaps.Views.MarkerForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.BaseForm({
				template: GoogleMaps.Template('delete-marker-form'),
				submit: function() {
					t.get('api').setMap(null);
					t.set('deleted', true);
					t.get('map').updateHiddenField();
					
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			this.get('map').showModal(view);
		},

		buildInfoWindowContent: function() {
			var content = this.get('content');
			var _return = ['<div>', (_.isArray(content) ? content.join('') : content)];

			var t = this, latLng = this.get('api').getPosition();

			_return.push([
					'<div class="oh-google-map-infowindow-actions">',
						'<a href="#" class="edit">Edit</a> | ',
						'<a href="#" class="delete">Delete</a>',
					'</div>',
				'</div>'
			].join(''));

			var $content = $(_return.join(''));

			$content.find('.edit').click(function(e) {
				t.edit();

				e.preventDefault();
			});

			$content.find('.delete').click(function(e) {
				t.delete();

				e.preventDefault();
			});

			return $content.get(0);
		},

		remove: function() {
			this.get('infowindow').close();
			this.set('deleted', true);
			this.setMap(null);
		},

		getAnimation: function() {
			return this.get('api').getAnimation();
		},

		getClickable: function() {
			return this.get('api').getClickable();
		},

		getCursor: function() {
			return this.get('api').getCursor();
		},

		getDraggable: function() {
			return this.get('api').getDraggable();
		},

		getIcon: function() {
			return this.get('api').getIcon();
		},

		getMap: function() {
			return this.get('api').getMap();
		},

		getOpacity: function() {
			return this.get('api').getOpacity();
		},

		getPosition: function() {
			return this.get('api').getPosition();
		},

		getShape: function() {
			return this.get('api').getShape()
		},

		getTitle: function() {
			return this.get('api').getTitle();
		},

		getVisible: function() {
			return this.get('api').getVisible();
		},

		getZIndex: function() {
			return this.get('api').getZIndex();
		},

		setAnimation: function(value) {
			this.get('api').setAnimation(value);
		},

		setClickable: function(value) {
			this.get('api').setClickable(value);
		},
		
		setCursor: function(value) {
			this.get('api').setCursor(value);
		},
		
		setDraggable: function(value) {
			this.get('api').setDraggable(value);
		},
		
		setIcon: function(value) {
			if(value) {
				var width = this.get('scaledWidth') ? this.get('scaledWidth') : 32;
				var height = this.get('scaledHeight') ? this.get('scaledHeight') : 32;

				var icon = {
					scaledSize: new google.maps.Size(width, height),
					url: value
				};
				
				if(this.get('scaleIcons') === false) {
					this.get('api').setIcon(value);
				}
				else {
					this.get('api').setIcon(icon);
				}
			}
			else {
				this.get('api').setIcon(null);
			}
		},
		
		setMap: function(value) {
			this.get('api').setMap(value);
		},
		
		setOpacity: function(value) {
			this.get('api').setOpacity(value);
		},
		
		setOptions: function(value) {
			this.get('api').setOptions(value);
		},
		
		setPosition: function(value) {
			this.get('api').setPosition(value);
		},
		
		setShape: function(value) {
			this.get('api').setShape(value);
		},
		
		setTitle: function(value) {
			this.get('api').setTitle(value);
		},
		
		setVisible: function(value) {
			this.get('api').setVisible(value);
		},
		
		setZIndex: function(value) {
			this.get('api').setZIndex(value);
		},

		bindEvents: function() {
			var t = this;

			google.maps.event.addListener(this.get('api'), 'animation_changed', function() {
				t.onAnimationChanged.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'click', function() {
				t.onClick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'cursor_changed', function() {
				t.onCursorChanged.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'dblclick', function() {
				t.onDblclick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'drag', function() {
				t.onDrag.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'dragend', function() {
				t.onDragend.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'draggable_changed', function() {
				t.onDraggableChanged.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'dragstart', function() {
				t.onDragstart.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'flat_changed', function() {
				t.onFlatChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'icon_changed', function() {
				t.onIconChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mousemove', function() {
				t.onMousemove.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseout', function() {
				t.onMouseout.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseover', function() {
				t.onMouseover.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'mouseup', function() {
				t.onMouseup.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'position_changed', function() {
				t.onPositionChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'rightclick', function() {
				t.onRightclick.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'shape_changed', function() {
				t.onShapeChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'tilt_changed', function() {
				t.onTiltChanged.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'visible_changed', function() {
				t.onVisibleChanged.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'zindex_changed', function() {
				t.onZindexChanged.apply(t, arguments);
			});
		},

		onAnimationChanged: function() {},

		onClick: function() {
			this.get('map').closeInfoWindows();
			this.get('infowindow').open(this.get('map').api, this.get('api'));
		},

		onCursorChanged: function() {},

		onDblclick: function() {},

		onDrag: function() {},

		onDragend: function(e, callback) {
			var t = this;

			t.set({
				lat: e.latLng.lat(),
				lng: e.latLng.lng()
			});

			this.get('map').geocoder.geocode({location: e.latLng}, function(results, status) {
				if(status == 'OK') {
					t.set('address', results[0].formatted_address);
					t.set('addressComponents', results[0].address_components);
				}
				else {
					t.set('address', null);
					t.set('addressComponents', null);
				}

				if(!t.get('customContent')) {
					if(!t.isCoordinate(t.get('address'))) {
						t.set('content', t.get('address').split(',').join('<br>'));
					}
					else {
						t.set('content', t.get('address'));
					}

					t.get('infowindow').setContent(t.buildInfoWindowContent());
				}

				t.get('map').updateHiddenField();
				
				if(_.isFunction(callback)) {
					callback(e);
				}
			});
		},

		onDraggableChanged: function() {},

		onDragstart: function() {},

		onFlatChanged: function() {},

		onIconChanged: function() {},

		onMousemove: function() {},

		onMouseout: function() {},

		onMouseover: function() {},

		onMouseup: function() {},

		onPositionChanged: function() {},

		onRightclick: function() {},

		onShapeChanged: function() {},

		onTiltChanged: function() {},

		onVisibleChanged: function() {},

		onZindexChanged: function() {}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Polygon = GoogleMaps.Models.Base.extend({

		api: false,

		map: false,

		infowindow: false,

		editable: false,

		draggable: false,

		title: null,

		content: null,

		points: [],

		strokeColor: '#000000',

		strokeWeight: 3,

		strokeOpacity: 0.6,

		fillColor: '#666666',

		fillOpacity: 0.6,

		initialize: function(options) {
			
			if(!options.strokeColor) {
				options.strokeColor = this.strokeColor;
			}

			if(!options.strokeOpacity) {
				options.strokeOpacity = this.strokeOpacity;
			}

			if(!options.strokeWeight) {
				options.strokeWeight = this.strokeWeight;
			}

			if(!options.fillColor) {
				options.fillColor = this.fillColor;
			}

			if(!options.fillOpacity) {
				options.fillOpacity = this.fillOpacity;
			}

			GoogleMaps.Models.Base.prototype.initialize.call(this, options);

			var points = [];

			_.each(this.get('points'), function(point) {
				points.push(new google.maps.LatLng(point.lat, point.lng));
			});
			
			if(!this.get('api')) {	
				this.initializeApi(points, options);
			}

			if(!this.get('infowindow')) {
				this.set('infowindow', new google.maps.InfoWindow({
					maxWidth: 300,
					content: this.buildInfoWindowContent()
				}));
			}

			this.bindEvents();
		},

		initializeApi: function(points, options) {

			options.strokeColor = this.get('strokeColor');
			options.strokeWeight = this.get('strokeWeight');
			options.strokeOpacity = this.get('strokeOpacity');
			options.fillColor = this.get('fillColor');
			options.fillOpacity = this.get('fillOpacity');
			options.paths = points;
			options.map = this.get('map').api;
			options.zIndex = this.get('map').polygons.length;

			if(!this.get('api')) {
				this.set('api', new google.maps.Polygon(options));
			}
		},	

		edit: function(showMapList) {
			var t = this, view = new GoogleMaps.Views.PolygonForm({
				api: this.get('api'),
				map: this.get('map'),
				model: this,
				cancel: function() {
					GoogleMaps.Views.PolygonForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.BaseForm({
				template: GoogleMaps.Template('delete-polygon-form'),
				submit: function() {
					t.get('api').setMap(null);
					t.get('infowindow').close();
					t.set('deleted', true);
					t.get('map').updateHiddenField();
					
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			t.get('map').showModal(view);
		},

		remove: function() {
			this.set('deleted', true);
			this.setMap(null);
		},

		buildInfoWindowContent: function() {
			var content = this.get('content');
			var _return = ['<div>', (_.isArray(content) ? content.join('') : content)];

			var t = this;

			_return.push([
					'<div class="oh-google-map-infowindow-actions">',
						'<a href="#" class="edit">Edit</a> | ',
						'<a href="#" class="delete">Delete</a>',
					'</div>',
				'</div>'
			].join(''));

			var $content = $(_return.join(''));

			$content.find('.edit').click(function(e) {
				
				t.edit();

				/*
				t.get('map').api.setCenter(latLng);
				t.get('map').api.panBy(0, -150);

				var view = new GoogleMaps.Views.BaseForm({
					model: new Backbone.Model({
						title: t.get('title'),
						content: t.get('content')
					}),
					template: GoogleMaps.Template('edit-marker-form'),								
					onShow: function() {
						setTimeout(function() {
							view.$el.find('input').focus();
						}, 250);
					},
					submit: function() {
						t.set('title', view.$el.find('input').val());
						t.set('content', view.$el.find('textarea').val());
						t.set('customContent', true);
						t.get('infowindow').setContent(t.buildInfoWindowContent());
						t.get('map').hideModal();
						t.get('map').updateHiddenField();
					},
					cancel: function() {
						t.get('map').hideModal();
					}
				});

				t.get('map').showModal(view);
				*/

				e.preventDefault();
			});

			$content.find('.delete').click(function(e) {
				t.delete();

				e.preventDefault();
			});

			return $content.get(0);
		},

		getDraggable: function() {
			return this.get('api').getDraggable();
		},

		getEditable: function() {
			return this.get('api').getEditable();
		},

		getMap: function() {
			return this.get('api').getMap();
		},

		getPath: function() {
			return this.get('api').getPath();
		},

		getPaths: function() {
			return this.get('api').getPaths();
		},

		getVisible: function() {
			return this.get('api').getVisible();
		},

		setDraggable: function(value) {
			this.get('api').setDraggable(value);
		},

		setEditable: function(value) {
			this.get('api').setEditable(value);
		},
		
		setMap: function(value) {
			this.get('api').setMap(value);
		},
		
		setOptions: function(value) {
			this.get('api').setOptions(value);
		},
		
		setPath: function(value) {
			this.get('api').setPath(value);
		},
		
		setPaths: function(value) {
			this.get('api').setPaths(value);
		},

		setPoints: function(value) {
			var points = [];

			_.each(value, function(point) {
				points.push(new google.maps.LatLng(point.lat, point.lng));
			});

			this.setPath(points);
		},
		
		setVisible: function(value) {
			this.get('api').setVisible(value);
		},
		
		toJSON: function() {
			var json = GoogleMaps.Models.Base.prototype.toJSON.call(this);
			var points = [];


			if(this.get('api').getPath()) {
				_.each(this.get('api').getPath().getArray(), function(latLng) {
					points.push({
						lat: latLng.lat(),
						lng: latLng.lng()
					});
				});
			}

			json.points = points;

			return json;
		},

		bindEvents: function() {
			var t = this;

			google.maps.event.addListener(this.get('api'), 'click', function() {
				t.onClick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'dblclick', function() {
				t.onDblclick.apply(t, arguments);
			});

			google.maps.event.addListener(this.get('api'), 'drag', function() {
				t.onDrag.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'dragend', function() {
				t.onDragend.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'dragstart', function() {
				t.onDragstart.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mousedown', function() {
				t.onMousedown.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mousemove', function() {
				t.onMousemove.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseout', function() {
				t.onMouseout.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseover', function() {
				t.onMouseover.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'mouseup', function() {
				t.onMouseup.apply(t, arguments);
			});
			
			google.maps.event.addListener(this.get('api'), 'rightclick', function() {
				t.onRightclick.apply(t, arguments);
			});
		},

		onClick: function(e) {
			if(!this.get('api').getEditable()) {
				this.get('map').closeInfoWindows();
				this.get('infowindow').open(this.get('map').api);
				this.get('infowindow').setPosition(e.latLng);
			}
		},

		onDblclick: function() {},

		onDrag: function() {},

		onDragend: function(e) {},

		onDragstart: function() {},

		onMousedown: function() {},

		onMousemove: function() {},

		onMouseout: function() {},

		onMouseover: function() {},

		onMouseup: function() {},

		onRightclick: function() {}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Polyline = GoogleMaps.Models.Polygon.extend({

		initializeApi: function(points, options) {

			options.strokeColor = this.get('strokeColor');
			options.strokeWeight = this.get('strokeWeight');
			options.strokeOpacity = this.get('strokeOpacity');
			options.path = points;
			options.map = this.get('map').api;
			options.zIndex = this.get('map').polygons.length;

			this.set('api', new google.maps.Polyline(options));
		},	

		getPaths: function() {
			return;
		},

		edit: function(showMapList) {
			var t = this, view = new GoogleMaps.Views.PolylineForm({
				api: this.get('api'),
				map: this.get('map'),
				model: this,
				cancel: function() {
					GoogleMaps.Views.PolylineForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.BaseForm({
				template: GoogleMaps.Template('delete-polyline-form'),
				submit: function() {
					t.get('api').setMap(null);
					t.get('infowindow').close();
					t.set('deleted', true);
					t.get('map').updateHiddenField();
					
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			this.get('map').showModal(view);
		},

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.Route = GoogleMaps.Models.Base.extend({

		initialize: function(options) {
			var t = this;

			GoogleMaps.Models.Base.prototype.initialize.call(this, options);

			if(!this.get('api')) {
				this.set('api', new google.maps.DirectionsRenderer(_.extend({}, options, {
					draggable: false,
					map: this.get('map').api,
					suppressInfoWindows: true,
					suppressMarkers: true,
					preserveViewport: true,
					infoWindow: new google.maps.InfoWindow({
						content: 'test'
					})
				})));
			}
			else {
				this.get('api').setMap(this.get('map').api);
			}

			if(this.get('markers')) {
				var markers = [];

				_.each(this.get('markers'), function(marker, i) {
					markers.push(new GoogleMaps.Models.RouteMarker(_.extend({}, marker, {
						location: t.getLocations()[i],
						route: t,
						map: t.get('map'),
						onDragend: function(e) {
							GoogleMaps.Models.RouteMarker.prototype.onDragend.call(this, e, function() {
								t.onDragend.call(t, e);
							});
						} 
					})));
				});

				this.set('markers', markers);
			}

			if(this.getLocations().length) {
				t.render(t.getDirectionsRequestObject());				
			}


			/*
			if(this.get('icon')) {
				this.setIcon(this.get('icon'));
			}

			if(!this.get('infowindow')) {
				this.set('infowindow', new google.maps.InfoWindow({
					maxWidth: 300,
					content: this.buildInfoWindowContent()
				}));
			}

			this.bindEvents();
			*/
		},

		remove: function() {
			this.get('api').setMap(null);
			this.set('deleted', true);

			_.each(this.getMarkers(), function(marker) {
				marker.remove();
			});
		},

		getDirectionsRequestObject: function() {
			return {
				origin: this.getOrigin(),
				destination: this.getDestination(),
				waypoints: this.getWaypoints(),
				avoidFerries: this.get('avoidFerries'),
				avoidHighways: this.get('avoidHighways'),
				avoidTolls: this.get('avoidTolls'),
				durationInTraffic: this.get('durationInTraffic'),
				optimizeWaypoints: this.get('optimizeWaypoints'),
				provideRouteAlternatives: this.get('provideRouteAlternatives'),
				transitOptions: this.get('transitOptions'),
				unitSystem: this.get('unitSystem')
			};
		},

		setDraggable: function(value) {
			this.get('api').setOptions({draggable: value});
		},

		getOrigin: function() {
			var locations = this.getLocations();
			var location = locations[0];

			if(location) {
				return new google.maps.LatLng(location.lat, location.lng);
			}

			return null;
		},

		getDestination: function() {
			var locations = this.getLocations();

			if(locations.length < 2) {
				return null;
			}

			var location = locations[locations.length - 1];

			if(location) {
				return new google.maps.LatLng(location.lat, location.lng);
			}

			return null;
		},

		render: function(request, callback) {
			var t = this; // , markers = [];

			if(!_.isObject(request)) {
				request = this.getDirectionsRequestObject();
			}

			this.directionsRequest(request, function(result, status) {
				if(status == 'OK') {
					t.setDirections(result);
					t.setMap(t.get('map').api);
				}
			});
		},

		getWaypoints: function() {
			var waypoints = [], locations = this.getLocations();

			if(locations.length < 3) {
				return [];
			}

			_.each(locations, function(location, i) {
				if(i > 0 && i < locations.length - 1) {
					waypoints.push({
						location: new google.maps.LatLng(location.lat, location.lng),
						stopover: true
					});
				}
			});

			return waypoints;
		},

		directionsRequest: function(request, callback) {
			if(_.isFunction(request)) {
				callback = request;
			}

			if(!_.isObject(request)) {
				request = {};
			}

			request = _.extend({}, request, {
				origin: this.getOrigin(),
				destination: this.getDestination(),
				waypoints: this.getWaypoints(),
				travelMode: this.get('travelMode') ? this.get('travelMode') : (request.travelMode ? request.travelMode : google.maps.TravelMode.DRIVING)
			});

			if(!request.origin || !request.destination) {
				return;
			}

			var t = this, service = new google.maps.DirectionsService();

			return service.route(request, function(result, status) {
				if(_.isFunction(callback)) {
					callback.call(t, result, status);
				}
			});
		},
		
		buildInfoWindowContent: function() {
			var content = this.get('content');
			var _return = ['<div>', (_.isArray(content) ? content.join('') : content)];

			var t = this;

			_return.push([
					'<div class="oh-google-map-infowindow-actions">',
						'<a href="#" class="edit">Edit</a> | ',
						'<a href="#" class="delete">Delete</a>',
					'</div>',
				'</div>'
			].join(''));

			var $content = $(_return.join(''));

			$content.find('.edit').click(function(e) {

				t.edit();

				e.preventDefault();
			});

			$content.find('.delete').click(function(e) {
				t.delete();

				e.preventDefault();
			});

			return $content.get(0);
		},

		edit: function(showMapList) {
			var t = this, view = new GoogleMaps.Views.RouteForm({
				model: this,
				map: this.get('map'),
				cancel: function() {
					GoogleMaps.Views.RouteForm.prototype.cancel.call(view);

					if(showMapList) {
						t.get('map').showMapList();
					}
				}
			});

			this.get('map').showModal(view);
		},

		delete: function(showMapList) {
			var t = this;

			var view = new GoogleMaps.Views.DeleteRouteForm({
				model: this,
				submit: function() {
					t.remove();
					t.get('map').updateHiddenField();
			
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				},
				cancel: function() {
					if(showMapList) {
						t.get('map').showMapList();
					}
					else {
						t.get('map').hideModal();
					}
				}
			});

			this.get('map').showModal(view);
		},

		getDirections: function() {
			return this.get('api').getDirections();
		},

		addLocation: function(location) {
			var t = this;
			var locations = this.getLocations();
			var i = locations.length;

			if(!locations) {
				locations = [];
			}

			locations.push(location);

			this.set('locations', locations);

			var marker = new GoogleMaps.Models.RouteMarker({
				scaledWidth: 22,
				scaledHeight: 40,
				route: this,
				map: this.get('map'),
				lat: location.lat,
				lng: location.lng,
				address: location.address,
				draggable: true,
				content: location.address.split(',').join('<br>'),
				location: location,
				onDragend: function(e) {
					GoogleMaps.Models.RouteMarker.prototype.onDragend.call(this, e, function() {
						t.onDragend.call(t, e);
					});
				} 
			});

			this.addMarker(marker);
		},

		removeLocation: function(index) {
			var locations = this.getLocations();

			if(locations[index]) {
				locations.splice(index, 1);
			}

			this.set('locations', locations);

			this.removeMarker(index);
		},

		addMarker: function(marker) {
			var markers = this.getMarkers();

			if(!markers) {
				markers = [];
			}

			markers.push(marker);

			this.updateMarkerIcons();
			this.set('markers', markers);
		},

		removeMarker: function(index) {
			var markers = this.getMarkers();

			if(markers[index]) {
				markers[index].setMap(null);
				markers.splice(index, 1);
			}

			this.updateMarkerIcons();
			this.set('markers', markers);
		},

		onDragend: function(e) {},

		updateMarkerIcons: function() {
			var t = this;

			_.each(this.getMarkers(), function(marker, i) {
				if(i < t.getMarkers().length - 1) {
					var icon = 'http://mt.google.com/vt/icon/text='+String.fromCharCode(65 + i)+'&psize=16&font=fonts/arialuni_t.ttf&color=ff330000&name=icons/spotlight/spotlight-waypoint-a.png&ax=44&ay=48&scale=2';
				}
				else {
					var icon = 'http://mt.google.com/vt/icon/text='+String.fromCharCode(65 + i)+'&psize=16&font=fonts/arialuni_t.ttf&color=ff330000&name=icons/spotlight/spotlight-waypoint-b.png&ax=44&ay=48&scale=2';
				}
				
				t.getLocation(i).icon = icon;

				marker.set('icon', icon);
				marker.setIcon(icon);
			});
		},

		getLocations: function() {
			return this.get('locations');
		},

		getLocation: function(i) {
			var locations = this.getLocations();

			if(locations[i]) {
				return locations[i];
			}

			return null;
		},

		getMarkers: function() {
			return this.get('markers');
		},

		getMarker: function(i) {
			var markers = this.getMarkers();

			if(markers[i]) {
				return markers[i];
			}

			return null;
		},

		getMap: function() {
			return this.get('api').getMap();
		},

		getPanel: function() {
			return this.get('api').getPanel();
		},

		getRouteIndex: function() {
			return this.get('api').getRouteIndex();
		},

		setDirections: function(value) {
			this.get('api').setDirections(value);
		},
		
		setMap: function(value) {
			this.get('api').setMap(value);
		},
		
		setOptions: function(value) {
			this.get('api').setOptions(value);
		},
		
		setPosition: function(value) {
			this.get('api').setPosition(value);
		},
		
		setPanel: function(value) {
			this.get('api').setPanel(value);
		},
		
		setVisible: function(value) {
			this.get('api').setVisible(value);
		},
		
		setRouteIndex: function(value) {
			this.get('api').setRouteIndex(value);
		},

		bindEvents: function() {
			var t = this;

			google.maps.event.addListener(this.get('api'), 'directions_changed', function() {
				t.onDirectionsChanged.apply(t, arguments);
			});
		},

		onDirectionsChanged: function() {}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Models.RouteMarker = GoogleMaps.Models.Marker.extend({

		originalMarker: false,

		initialize: function(options) {
			this.set('draggable', false);
			this.set('isSavedToMap', true);

			GoogleMaps.Models.Marker.prototype.initialize.call(this, options);

			this.originalMarker = $.extend(true, {}, this.toJSON());
		},

		edit: function() {	
			var view = new GoogleMaps.Views.RouteForm({
				model: this.get('route'),
				map: this.get('map')
			});

			this.get('map').showModal(view);
		},

		delete: function() {
			this.get('route').delete();
		},

		toJSON: function() {
			var json = GoogleMaps.Models.Marker.prototype.toJSON.call(this);

			delete json.route;

			return json;
		},

		revert: function() {
			this.set(this.originalMarker);
			this.setPosition(new google.maps.LatLng(this.get('lat'), this.get('lng')));
		},

		onDragend: function(e, callback) {
			var t = this;

			GoogleMaps.Models.Marker.prototype.onDragend.call(this, e, function() {
				t.set('lat', e.latLng.lat());
				t.set('lng', e.latLng.lng());

				t.get('location').lat = e.latLng.lat();
				t.get('location').lng = e.latLng.lng();
				t.get('location').address = t.get('address');
				t.get('route').render();

				if(_.isFunction(callback)) {
					callback(e);
				}
			});
		}
	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.ItemView = Backbone.Marionette.ItemView.extend({

		initialize: function(options) {	
			Backbone.Marionette.ItemView.prototype.initialize.call(this, options);

			if(this.options) {
				this.fill(this.options);
			}
		},

		fill: function(options) {
			_.extend(this, options);
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.LayoutView = Backbone.Marionette.LayoutView.extend({

		initialize: function(options) {	
			Backbone.Marionette.LayoutView.prototype.initialize.call(this, options);
		
			if(this.options) {
				this.fill(this.options);
			}
		},

		fill: function(options) {
			_.extend(this, options);
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.Address = GoogleMaps.Views.LayoutView.extend({

  		regions: {
  			modal: '.oh-google-map-window' 
  		},

		template: GoogleMaps.Template('address-fields'),

		initialize: function(options) {
			GoogleMaps.Views.LayoutView.prototype.initialize.call(this, options);

			if(!this.model && this.getOption('savedData')) {
				this.model = new GoogleMaps.Models.Address(this.getOption('savedData'));
			}

			if(this.getOption('fieldname')) {
				this.model.set('fieldname', this.getOption('fieldname'));
			}
		},

		onDomRefresh: function() {
			var t = this, value = false, geocoderResults = false, modal = false;

			this.$el.find('.view-all').click(function(e) {
				t.geocode(function(results, status) {
					var list = new GoogleMaps.Views.GeocoderList({
						model: new GoogleMaps.Models.Base({
							locations: results
						})
					});

					list.render();
 					
					list.$el.find('.modal-cancel').click(function(e) {
						modal.hide();
					});

 					modal = new Garnish.Modal(list.$el)

					list.on('select', function(model) {
						t.setLatitude(model.geometry.location.lat());
						t.setLongitude(model.geometry.location.lng());
							
						modal.hide();
					});
				});

				e.preventDefault();
			});

			this.$el.find('input').focus(function() {
				value = $(this).val();
			});

			this.$el.find('input').blur(function() {
				if(value != $(this).val()) {
					t.geocode(function(results, status) {
						if(status == google.maps.GeocoderStatus.OK) {
							geocoderResults = results;

							t.setLatitude(results[0].geometry.location.lat());
							t.setLongitude(results[0].geometry.location.lng());
							t.setResponse(results[0]);

							t.$el.find('.view-all').removeClass('hidden');
						}
						else {
							t.$el.find('.view-all').addClass('hidden');
						}
					});
				}
			});

			if(this.hasAddress()) {
				this.$el.find('.view-all').removeClass('hidden');
			}
		},

		getLatitude: function() {
			return this.$el.find('.latitude').val();
		},

		setLatitude: function(latitude) {
			this.$el.find('.latitude').val(latitude);
		},

		getLongitude: function() {
			return this.$el.find('.longitude').val();
		},

		setLongitude: function(latitude) {
			this.$el.find('.longitude').val(latitude);
		},

		getResponse: function() {
			return this.$el.find('.response').val();
		},

		setResponse: function(response) {
			if(!_.isString(response)) {
				response = JSON.stringify(response);
			}

			this.$el.find('.response').val(response).html(response);
		},

		hasAddress: function() {
			return this.getAddress() != '';
		},

		getAddress: function() {
			return [
				this.$el.find('.line1').val(),
				this.$el.find('.line2').val(),
				this.$el.find('.city').val(),
				this.$el.find('.state').val(),
				this.$el.find('.zipcode').val(),
				this.$el.find('.country').val()
			].join(' ').trim();
		},

		geocode: function(callback) {			
 			var api = new google.maps.Geocoder();
 			var address = this.getAddress();

			api.geocode({address: address}, function(results, status) {
				if(_.isFunction(callback)) {
					callback(results, status);
				};
			});
		},

		showModal: function(view) {
			this.modal.empty();
			this.modal.show(view);
			this.modal.$el.addClass('show');
		},

		hideModal: function(center) {
			this.modal.$el.removeClass('show');
			this.modal.empty();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.BaseForm = GoogleMaps.Views.ItemView.extend({

		className: 'oh-google-map-form',

		tagName: 'form',

		onRender: function() {

			var t = this;

			this.$el.off('submit').submit(function(e) {
				t.submit();

				e.preventDefault();
			});

			this.$el.find('.cancel').click(function(e) {
				t.cancel();

				e.preventDefault();
			});

			this.$el.find('.oh-google-map-tab-trigger').click(function(e) {
				var selector = $(this).attr('href');

				t.$el.find('.oh-google-map-tab.active').removeClass('active');
				t.$el.find('.oh-google-map-tab-trigger').removeClass('active');

				t.$el.find(selector).addClass('active');
				$(this).addClass('active');

				e.preventDefault();
			});

			this.$el.find('[href="#oh-points-tab"]').click(function() {
				t.$el.find('[name="point"]').focus();				
			});

			this.$el.find('.oh-google-map-tab-trigger.active').click();
		},

		submit: function() {

		},

		cancel: function() {
			this.$el.parent().removeClass('show');
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.Button = GoogleMaps.Views.ItemView.extend({

		className: 'oh-google-map-control-button',

		tagName: 'a'

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.ButtonBar = GoogleMaps.Views.ItemView.extend({

		className: 'oh-google-map-button-bar oh-google-map-clearfix',

		template: GoogleMaps.Template('button-bar'),

		initialize: function(options) {
			var t = this;

			if(!this.model) {
				this.model = new Backbone.Model();
			}

			Backbone.Marionette.ItemView.prototype.initialize.call(this, options);
		
			var buttons = [];

			if(this.options.showButtons) {
				_.each(this.options.buttons, function(button, i) {
					if(t.options.showButtons.indexOf(button.name) >= 0) {
						buttons.push(button);
					}
				});
			}

			this.model.set('buttons', buttons);
		},

		onRender: function() {
			var t = this;

			if(this.model.get('buttons')) {
				_.each(this.model.get('buttons'), function(button, i) {
					if(button.click) {
						t.$el.find('a').eq(i).click(function(e) {
							button.click.call(this, e);
						});
					}
				});
			}
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.CircleForm = GoogleMaps.Views.BaseForm.extend({

		geocoder: false,

		template: GoogleMaps.Template('circle-form'),

		map: false,

		api: false,

		originalCircle: {},

		initialize: function(options) {
			var t = this;

			this.model = false;

			this.geocoder = new google.maps.Geocoder();

			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			this.initializeApi();

			this.model.get('infowindow').close();
			this.model.get('api').setDraggable(true);
			this.model.get('api').setEditable(true);

			this.api = this.model.get('api');
		},

		initializeApi: function() {
			if(!this.model) {
				this.model = new GoogleMaps.Models.Circle({
					map: this.map,
					hideDetails: true,
					isNew: true,
					isSavedToMap: false,
					metric: 'miles',
					radius: 100
				});
			}

			this.originalCircle = this.model.toJSON();
		},

		onRender: function() {
			var t = this;

			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			this.model.onRadiusChanged = function() {
				GoogleMaps.Models.Circle.prototype.onRadiusChanged.call(this);

				if(!t.isDestroyed) {
					//t.map.updateHiddenField();
					t.render();
				}
			};

			this.model.onCenterChanged = function() {
				GoogleMaps.Models.Circle.prototype.onCenterChanged.call(this);

				if(!t.isDestroyed) {
					t.render();
				}
			};

			this.model.onDragend = function(e) {
				GoogleMaps.Models.Circle.prototype.onDragend.call(this, e, function() {	
					if(!t.isDestroyed) {
						//t.map.updateHiddenField();
						t.render();
					}
				});			
			};

			this.$el.find('.toggle-details').click(function(e) {
				var $panel = t.$el.find('.details');

				if($panel.css('display') == 'none') {
					$panel.show();			
					t.model.set('hideDetails', false);		
					$(this).html('Hide Details');
				}
				else {
					$panel.hide();
					t.model.set('hideDetails', true);
					$(this).html('Show Details');
				}

				t.$el.find('input').focus();

				e.preventDefault();
			});

			this.$el.find('input').keypress(function(e) {
				if(e.keyCode == 13) {
					t.$el.find('.add-point').click();
					e.preventDefault();
				}
			}).focus();

			this.$el.find('.set-location').click(function(e) {
				var view = new GoogleMaps.Views.Geocoder({
					map: t.map,
					responseHandler: function(response) {
						t.model.set({
							address: response.formatted_address,
							addressComponents: response.address_components,
							lat: response.geometry.location.lat(),
							lng: response.geometry.location.lng(),
							isSavedToMap: false
						});

						t.model.setCenter(response.geometry.location);

						t.isDestroyed = false;
						t.map.showModal(t);
					},
					cancel: function() {
						t.isDestroyed = false;
						t.map.showModal(t);
					}
				});

				t.map.showModal(view);
				t.model.setMap(t.map.api);

				e.preventDefault();
			});

			this.$el.find('[name="radius"]').blur(function() {
				if(t.model.get('radius') != parseFloat($(this).val())) {
					t.model.setRadius($(this).val());
				}
			});

			this.$el.find('[name="metric"]').change(function() {
				t.model.set('metric', $(this).val());
				t.model.setRadius(t.model.get('radius'));
			});

			this.$el.find('[name="metric"]').val(this.model.get('metric'));

			this.$el.find('.oh-google-map-tag a').click(function(e) {
				var index = $(this).parent().index();

				t.removePoint(index);

				e.preventDefault();
			});

			this.$el.find('.simple-color-picker').simpleColorPicker().blur(function() {
				t.updatePolygonOptions();
			})
			.blur();

			this.$el.find('.slider').each(function() {
				var value = $(this).data('value');
				var start = $(this).data('start');
				var step = $(this).data('step');
				var min = $(this).data('min');
				var max = $(this).data('max');

				$(this).noUiSlider({
					start: parseFloat(value ? value : start),
					step: parseFloat(step),
					range: {
						'min': parseFloat(min),
						'max': parseFloat(max)
					}
				})
				.change(function(e, value) {
					$(this).next().val(value);
					t.updatePolygonOptions();
				});

				$(this).next().val($(this).val());
			});

			t.updatePolygonOptions();
		},

		updatePolygonOptions: function() {
			var options = {
				strokeColor: this.$el.find('[name="strokeColor"]').val(),
				strokeOpacity: this.$el.find('[name="strokeOpacity"]').val(),
				strokeWeight: this.$el.find('[name="strokeWeight"]').val(),
				fillColor: this.$el.find('[name="fillColor"]').val(),
				fillOpacity: this.$el.find('[name="fillOpacity"]').val(),
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			};

			this.model.set(options);
			this.api.setOptions(options);
		},

		onShow: function() {
			var t = this;

			this.map.closeInfoWindows();

			this.map.api.setOptions({
				disableDoubleClickZoom: true
			});

			setTimeout(function() {
				t.$el.find('input').focus();
			}, 250);
		},

		onDestroy: function() {

			if(!this.model.get('isSavedToMap') && this.model.get('isNew')) {
				this.api.setMap(null);
			}

			this.map.api.setOptions({
				disableDoubleClickZoom: false
			});
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		},

		saveToMap: function() {
			if(!this.model.get('isSavedToMap')) {
				this.map.circles.push(this.model);
				this.model.set('isSavedToMap', true);
			}
		},

		submit: function() {
			this.api.setDraggable(false);
			this.api.setEditable(false);

			this.model.set({
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			});

			this.saveToMap();
			this.updatePolygonOptions();

			if(this.model.get('infowindow')) {
				this.model.get('infowindow').setOptions({
					content: this.model.buildInfoWindowContent()
				});
			}

			this.map.hideModal();
			this.map.updateHiddenField();
		},

		reset: function() {
			this.model.setRadius(this.originalCircle.radius);
			this.model.setCenter(new google.maps.LatLng(this.originalCircle.lat, this.originalCircle.lng));
			this.model.set(this.originalCircle);

			this.model.setOptions({
				strokeOpacity: this.originalCircle.strokeOpacity,
				strokeColor: this.originalCircle.strokeColor,
				strokeWeight: this.originalCircle.strokeWeight,
				fillOpacity: this.originalCircle.fillOpacity,
				fillColor: this.originalCircle.fillColor
			});
		},

		cancel: function() {
			this.reset();
			this.model.setDraggable(false);
			this.model.setEditable(false);
			this.map.hideModal();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.DeleteRouteForm = GoogleMaps.Views.BaseForm.extend({
		
		template: GoogleMaps.Template('delete-route-form')

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.Geocoder = GoogleMaps.Views.BaseForm.extend({

		className: 'oh-google-map-form oh-google-map-geocoder',

		template: GoogleMaps.Template('geocoder'),

		api: false,

		lastResponse: false,

		dblclickEvent: false,

		initialize: function(options) {
			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			if(!this.model) {
				this.model = new Backbone.Model();
			}

 			this.api = new google.maps.Geocoder();
		},

		onShow: function() {
			var t = this;

			setTimeout(function() {
				t.$el.find('input').focus();
			}, 250);

			this.map.api.setOptions({disableDoubleClickZoom: true});

			this.dblclickEvent = google.maps.event.addListener(this.map.api, 'dblclick', function(e) {
				t.geocode({location: e.latLng}, function(results, status) {
					if(results[0]) {
						results[0].geometry.location = e.latLng;
						t.responseHandler(results[0]);
					}
					else {
						t.responseHandler({
							formatted_address: '',
							addressComponents: [],
							geometry: {
								location: e.latLng
							}
						});
					}

					t.lastResponse = results[0];
				});				
			});
		},

		onDestroy: function() {
			this.map.api.setOptions({disableDoubleClickZoom: true});

			if(this.dblclickEvent) {
				this.dblclickEvent.remove();
			}
		},

		onRender: function() {
			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			var t = this;

			this.$el.find('.oh-google-map-highlight-list a').click(function(e) {
				var response = t.model.get('locations')[$(this).parent().index()];

				t.responseHandler(response);
				t.lastResponse = response;

				e.preventDefault();
			});
		},

		responseHandler: function(location) {
			
		},

		submit: function() {
			var t = this;

			this.model.set('location', this.getLocation());

			this.geocode(this.getLocation(), function(results, status, location) {
				if(status == "OK") {
					if(results.length > 1 || location.location) {
						/*
						if(!location.location) {
							var coord = location.split(',');

							coord = new google.maps.LatLng(coord[0], coord[1]);
						}
						*/

						if(location.location) {
							results.unshift({
								types: [],
								formatted_address: t.getLocation(),
								address_components: [],
								partial_match: false,
								geometry: {
									location: location.location ? location.location : coord,
									location_type: false,
									viewport: false,
									bounds: false
								}
							});
						}

						t.model.set('locations', results);
						t.render();
					}
					else {
						t.responseHandler(results[0]);
						t.lastResponse = results[0];
					}
				}
				else if(_.isObject(location)) {
					if(location.location) {
						var response = {
							types: [],
							formatted_address: t.getLocation(),
							address_components: [],
							partial_match: false,
							geometry: {
								location: location.location,
								location_type: false,
								viewport: false,
								bounds: false
							}
						};

						t.responseHandler(response);
						t.lastResponse = response;
					}
				}
			});
		},

		isCoordinate: function(coord) {
			return _.isString(coord) ? coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/) : false;
		},

		geocode: function(location, callback) {

			if(this.isCoordinate(location)) {
				var coord = location.split(',');

				location = {
					location: new google.maps.LatLng(
						parseFloat(coord[0]), 
						parseFloat(coord[1])
					)
				};
			}
			else if(_.isString(location)) {
				location = {address: location};
			}

			this.api.geocode(location, function(results, status) {
				if(_.isFunction(callback)) {
					callback(results, status, location);
				};
			});
		},

		getLocation: function() {
			return this.$el.find('input').val();
		},

		setLocation: function(location) {
			this.$el.find('input').val(location);
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.GeocoderList = GoogleMaps.Views.ItemView.extend({

		template: GoogleMaps.Template('geocoder-list'),

		className: 'oh-google-map-native-modal modal elementselectormodal',

		initialize: function(options) {
			GoogleMaps.Views.ItemView.prototype.initialize.call(this, options);
		},

		events: {
			'click tbody tr': 'onClick'
		},

		onClick: function(e) {
			var index = $(e.target).index();
			var model = this.model.get('locations')[index];

			this.trigger('select', model);

			e.preventDefault();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.GroundOverlayForm = GoogleMaps.Views.BaseForm.extend({

		template: GoogleMaps.Template('ground-overlay-form'),

		map: false,

		api: false,

		originalOverlay: {},

		initialize: function(options) {
			var t = this;

			this.model = false;

			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			this.initializeApi();

			this.model.get('infowindow').close();
			// this.model.get('api').setDraggable(true);
			// this.model.get('api').setEditable(true);

			this.api = this.model.get('api');
		},

		initializeApi: function() {
			if(!this.model) {
				this.model = new GoogleMaps.Models.GroundOverlay({
					map: this.map,
					hideDetails: true,
					isNew: true,
					isSavedToMap: false,
					opacity: 100
				});
			}

			this.originalOverlay = this.model.toJSON();
		},

		updateGroundOverlay: function() {
			if(this.model.get('url')) {
				this.model.setOptions({url: this.model.get('url')});
			}

			if(this.model.get('ne') && this.model.get('sw')) {
				var bounds = new google.maps.LatLngBounds(
					new google.maps.LatLng(this.model.get('sw').lat, this.model.get('sw').lng), 
					new google.maps.LatLng(this.model.get('ne').lat, this.model.get('ne').lng)
				);

				this.model.setOptions({bounds: bounds});
			}

			this.model.setOpacity(this.model.get('opacity'));

			this.model.setMap(this.map.api);
		},

		onRender: function() {
			var t = this;

			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			this.$el.find('.set-location').click(function(e) {
				var prop = $(this).data('prop');
				
				var view = new GoogleMaps.Views.Geocoder({
					map: t.map,
					responseHandler: function(response) {
						t.model.set(prop, {
							address: response.formatted_address,
							addressComponents: response.address_components,
							lat: response.geometry.location.lat(),
							lng: response.geometry.location.lng(),
							isSavedToMap: false
						});

						t.isDestroyed = false;
						t.map.showModal(t);
						t.updateGroundOverlay();
					},
					cancel: function() {
						t.isDestroyed = false;
						t.map.showModal(t);
					}
				});

				t.model.setMap(t.map.api);
				t.map.showModal(view);

				e.preventDefault();
			});

			this.$el.find('.set-image').click(function(e) {

				var modal = Craft.createElementSelectorModal('Asset', {
				    multiSelect: false,
				    storageKey: 'googleMapsPlugin',
				    criteria: { kind: 'image' },
				    onSelect: function(entries) {
				    	t.model.set('url', entries[0].url);
				    	t.render();
						t.updateGroundOverlay();
				    }
				});
				
				e.preventDefault();
			});
			
			this.$el.find('.slider').each(function() {
				var value = $(this).data('value');
				var start = $(this).data('start');
				var step = $(this).data('step');
				var min = $(this).data('min');
				var max = $(this).data('max');

				$(this).noUiSlider({
					start: parseFloat(value ? value : start),
					step: parseFloat(step),
					range: {
						'min': parseFloat(min),
						'max': parseFloat(max)
					}
				})
				.change(function(e, value) {
					$(this).next().val(value);

					t.model.set('opacity', parseFloat(value));
					t.updateGroundOverlay();
				});

				$(this).next().val($(this).val());
			});

			/*
			this.model.onRadiusChanged = function() {
				GoogleMaps.Models.Circle.prototype.onRadiusChanged.call(this);

				if(!t.isDestroyed) {
					//t.map.updateHiddenField();
					t.render();
				}
			};

			this.model.onCenterChanged = function() {
				GoogleMaps.Models.Circle.prototype.onCenterChanged.call(this);

				if(!t.isDestroyed) {
					t.render();
				}
			};

			this.model.onDragend = function(e) {
				GoogleMaps.Models.Circle.prototype.onDragend.call(this, e, function() {	
					if(!t.isDestroyed) {
						//t.map.updateHiddenField();
						t.render();
					}
				});			
			};

			this.$el.find('.toggle-details').click(function(e) {
				var $panel = t.$el.find('.details');

				if($panel.css('display') == 'none') {
					$panel.show();			
					t.model.set('hideDetails', false);		
					$(this).html('Hide Details');
				}
				else {
					$panel.hide();
					t.model.set('hideDetails', true);
					$(this).html('Show Details');
				}

				t.$el.find('input').focus();

				e.preventDefault();
			});

			this.$el.find('input').keypress(function(e) {
				if(e.keyCode == 13) {
					t.$el.find('.add-point').click();
					e.preventDefault();
				}
			}).focus();

			this.$el.find('.set-location').click(function(e) {
				var view = new GoogleMaps.Views.Geocoder({
					map: t.map,
					responseHandler: function(response) {
						t.model.set({
							address: response.formatted_address,
							addressComponents: response.address_components,
							lat: response.geometry.location.lat(),
							lng: response.geometry.location.lng(),
							isSavedToMap: false
						});

						t.model.setCenter(response.geometry.location);

						t.isDestroyed = false;
						t.map.showModal(t);
					},
					cancel: function() {
						t.isDestroyed = false;
						t.map.showModal(t);
					}
				});

				t.map.showModal(view);
				t.model.setMap(t.map.api);

				e.preventDefault();
			});

			this.$el.find('[name="radius"]').blur(function() {
				if(t.model.get('radius') != parseFloat($(this).val())) {
					t.model.setRadius($(this).val());
				}
			});

			this.$el.find('[name="metric"]').change(function() {
				t.model.set('metric', $(this).val());
				t.model.setRadius(t.model.get('radius'));
			});

			this.$el.find('[name="metric"]').val(this.model.get('metric'));

			this.$el.find('.oh-google-map-tag a').click(function(e) {
				var index = $(this).parent().index();

				t.removePoint(index);

				e.preventDefault();
			});

			this.$el.find('.simple-color-picker').simpleColorPicker().blur(function() {
				t.updatePolygonOptions();
			})
			.blur();

			this.$el.find('.slider').each(function() {
				var value = $(this).data('value');
				var start = $(this).data('start');
				var step = $(this).data('step');
				var min = $(this).data('min');
				var max = $(this).data('max');

				$(this).noUiSlider({
					start: parseFloat(value ? value : start),
					step: parseFloat(step),
					range: {
						'min': parseFloat(min),
						'max': parseFloat(max)
					}
				})
				.change(function(e, value) {
					$(this).next().val(value);
					t.updatePolygonOptions();
				});

				$(this).next().val($(this).val());
			});

			t.updatePolygonOptions();
			*/
		},

		/*
		updatePolygonOptions: function() {
			var options = {
				strokeColor: this.$el.find('[name="strokeColor"]').val(),
				strokeOpacity: this.$el.find('[name="strokeOpacity"]').val(),
				strokeWeight: this.$el.find('[name="strokeWeight"]').val(),
				fillColor: this.$el.find('[name="fillColor"]').val(),
				fillOpacity: this.$el.find('[name="fillOpacity"]').val(),
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			};

			this.model.set(options);
			this.api.setOptions(options);
		},
		*/

		onShow: function() {
			var t = this;

			this.map.closeInfoWindows();

			this.map.api.setOptions({
				disableDoubleClickZoom: true
			});

			setTimeout(function() {
				t.$el.find('input').focus();
			}, 250);
		},

		onDestroy: function() {
			if(!this.model.get('isSavedToMap') && this.model.get('isNew')) {
				this.api.setMap(null);
			}

			this.map.api.setOptions({
				disableDoubleClickZoom: false
			});
		},

		saveToMap: function() {
			if(!this.model.get('isSavedToMap')) {
				this.map.groundOverlays.push(this.model);
				this.model.set('isSavedToMap', true);
			}
		},

		submit: function() {
			this.updateGroundOverlay();

			this.model.set({
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			});

			this.saveToMap();
		
			if(this.model.get('infowindow')) {
				this.model.get('infowindow').setOptions({
					content: this.model.buildInfoWindowContent()
				});
			}

			this.map.hideModal();
			this.map.updateHiddenField();
		},

		reset: function() {
			this.model.set(this.originalOverlay);
			this.updateGroundOverlay();
		},

		cancel: function() {
			this.reset();
			this.map.hideModal();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.Map = GoogleMaps.Views.LayoutView.extend({

		availableButtons: [],

		template: GoogleMaps.Template('map'),

  		api: false,

  		fieldname: false,

  		geocoder: false,

  		width: false,

  		height: false,

  		position: false,

  		zoom: false,

  		savedData: false,

  		mapOptions: {},

  		regions: {
  			buttonBar: '.oh-google-map-controls',
  			modal: '.oh-google-map-window' 
  		},

  		markers: [],

  		polygons: [],

  		polylines: [],

  		routes: [],

  		circles: [],

  		groundOverlays: [],

  		showButtons: false,

  		className: 'oh-google-map-relative',

  		initialize: function(options) {
  			var t = this;

  			this.markers = [];
  			this.polygons = [];
  			this.polylines = [];
  			this.routes = [];
  			this.circles = [];
  			this.groundOverlays = [];

  			GoogleMaps.Views.LayoutView.prototype.initialize.call(this, options);

  			this.mapOptions = _.extend({}, {
	  			zoom: 8,
	  			disableDefaultUI: true,
	  			mapType: google.maps.MapTypeId.ROADMAP,
	  			center: new google.maps.LatLng(0, 0)
	  		}, (options.mapOptions ? options.mapOptions : {}));

  			if(!this.model) {
  				this.model = new Backbone.Model();
  			}

  			this.model.set({
  				fieldname: this.fieldname,
  				savedData: this.savedData,
  				width: this.width,
  				height: this.height
  			});

  			this.$el.css({
  				width: this.width,
  				height: this.height
  			}); 
  		},

		redraw: function() {
			google.maps.event.trigger(this.api, 'resize');
		},
		
  		updateHiddenField: function() {
  			var data = {
  				markers: [],
  				polygons: [],
  				polylines: [],
  				routes: [],
  				circles: [],
  				groundOverlays: []
  			};

  			_.each(this.markers, function(marker, i) {
  				data.markers.push(marker.toJSON());
  			});

  			_.each(this.polygons, function(polygon, i) {
  				data.polygons.push(polygon.toJSON());
  			});

  			_.each(this.polylines, function(polyline, i) {
  				data.polylines.push(polyline.toJSON());
  			});

  			_.each(this.routes, function(route, i) {
  				data.routes.push(route.toJSON());
  			});

  			_.each(this.circles, function(circle, i) {
  				data.circles.push(circle.toJSON());
  			});

  			_.each(this.groundOverlays, function(overlay, i) {
  				data.groundOverlays.push(overlay.toJSON());
  			});

  			data = JSON.stringify(data);

  			this.$el.parents('.oh-google-map-fieldtype').next('.field-data').val(data).html(data);
  		},

		onRender: function() {
 			var t = this;

 			this.geocoder = new google.maps.Geocoder();
	 		
 			this.api = new google.maps.Map(this.getCanvas(), this.getMapOptions());

 			this.buildButtonBar();

 			this.$el.find('.oh-google-map-zoom-in').click(function(e) {
 				t.zoomIn();

 				e.preventDefault();
 			});

 			this.$el.find('.oh-google-map-zoom-out').click(function(e) {
 				t.zoomOut();

 				e.preventDefault();
 			});

			this.mapTypeMenu = new Garnish.Menu(this.$el.find('#oh-google-map-map-type-menu'), {
				attachToElement: this.$el.find('.oh-google-map-map-type')
			});

			this.$el.find('.oh-google-map-map-type').click(function(e) {
				var $t = $(this);

				if($t.hasClass('active')) {
					$t.removeClass('active');
					t.mapTypeMenu.hide();
				}
				else {
					$t.addClass('active');
					t.mapTypeMenu.show();
				}

				e.preventDefault();
			});

			this.$el.find('#oh-google-map-map-type-menu a').click(function(e) {
				var $t = $(this);
				var type = $t.data('type').toUpperCase();

				if(google.maps.MapTypeId[type]) {
					t.mapOptions.mapType = google.maps.MapTypeId[type];
					t.setMapTypeId(google.maps.MapTypeId[type]);
				}
				else {
					t.mapOptions.mapType = google.maps.MapTypeId.ROADMAP;
					t.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				}

				$('#oh-google-map-map-type-menu .sel').removeClass('sel');

				t.$el.find('.oh-google-map-map-type').removeClass('active');

				$t.addClass('sel');

				e.preventDefault();
			});

			this.$el.find('#oh-google-map-map-type-menu a[data-type="'+t.mapOptions.mapType+'"]').addClass('sel');

 			// this.$el.find('.oh-google-map-window').css('max-height', parseInt(this.height.replace('px', '')) - 50);

 			if(this.savedData) {
	 			if(this.savedData.markers && this.savedData.markers.length) {
		 			_.each(this.savedData.markers, function(marker) {
						var options = {
							map: t,
							isNew: false,
							isSavedToMap: true
						};

		 				t.markers.push(new GoogleMaps.Models.Marker(_.extend({}, options, marker)));
		 			});
		 		}

	 			if(this.savedData.polygons && this.savedData.polygons.length) {
		 			_.each(this.savedData.polygons, function(polygon) {
						var options = {
							map: t,
							isSavedToMap: true
						};

		 				t.polygons.push(new GoogleMaps.Models.Polygon(_.extend({}, options, polygon)));
		 			});
		 		}

	 			if(this.savedData.polylines && this.savedData.polylines.length) {
		 			_.each(this.savedData.polylines, function(polyline) {
						var options = {
							map: t,
							isSavedToMap: true
						};

		 				t.polylines.push(new GoogleMaps.Models.Polyline(_.extend({}, options, polyline)));
		 			});
		 		}

	 			if(this.savedData.routes && this.savedData.routes.length) {
		 			_.each(this.savedData.routes, function(route) {
						var options = {
							map: t,
							isSavedToMap: true
						};

		 				t.routes.push(new GoogleMaps.Models.Route(_.extend({}, options, route)));
		 			});
		 		}

	 			if(this.savedData.circles && this.savedData.circles.length) {
		 			_.each(this.savedData.circles, function(circle) {
						var options = {
							map: t,
							isSavedToMap: true
						};

		 				t.circles.push(new GoogleMaps.Models.Circle(_.extend({}, options, circle)));
		 			});
		 		}

	 			if(this.savedData.groundOverlays && this.savedData.groundOverlays.length) {
		 			_.each(this.savedData.groundOverlays, function(overlay) {
						var options = {
							map: t,
							isSavedToMap: true
						};

		 				t.groundOverlays.push(new GoogleMaps.Models.GroundOverlay(_.extend({}, options, overlay)));
		 			});
		 		}

		 		this.center();
		 		this.updateHiddenField();
		 	}

  			var addressFields = this.getOption('addressFields');
  			var addressValues = {};

  			if(addressFields) {
  				var updateMap = function(fields) {
  					var address = [];

  					_.each(fields, function(value, field) {
  						if(value) {
  							address.push(value)
  						}
  					});

  					if(address.length) {

						var marker = t.markers[0];

	  					if(!marker) {
	  						marker = new GoogleMaps.Models.Marker({
	  							map: t
	  						});

	  						t.markers.push(marker);
	  					}

	  					t.geocoder.geocode({address: address.join(' ')}, function(results, status) {
	  						if(status == 'OK') {
	  							marker.set({
	  								lat: results[0].geometry.location.lat(),
	  								lng: results[0].geometry.location.lng(),
	  								address: results[0].formatted_address,
	  								addressComponents: results[0].address_components
	  							});

	  							if(!marker.get('customContent')) {
	  								marker.set('content', marker.get('address').split(',').join('<br>'));
	  							}

	  							marker.setPosition(new google.maps.LatLng(marker.get('lat'), marker.get('lng')));

	  							t.updateHiddenField();
	  							t.center();
	  						}
	  					});
					}
  				};

  				_.each(addressFields, function(field) {
  					var $field = $('#fields-'+field);

  					addressValues[field] = $field.val() != "" ? $field.val() : false;

  					$field.blur(function() {
  						if($(this).val() != '') {
  							addressValues[field] = $(this).val();
  						}
  						else {
  							addressValues[field] = false;
  						}

  						updateMap(addressValues);
  					});
  				});

  				updateMap(addressValues);
  			}
		},

		showMapList: function() {
			var data = {
 				markers: [],
				polygons: [],
				polylines: [],
				routes: [],
				circles: [],
				overlays: []
			};

			_.each(this.markers, function(marker) {
				data.markers.push(marker.toJSON());
			});

			_.each(this.polygons, function(polygon) {
				data.polygons.push(polygon.toJSON());
			});

			_.each(this.polylines, function(polyline) {
				data.polylines.push(polyline.toJSON());
			});

			_.each(this.routes, function(route) {
				data.routes.push(route.toJSON());
			});

			_.each(this.circles, function(circle) {
				data.circles.push(circle.toJSON());
			});

			_.each(this.groundOverlays, function(overlay) {
				data.overlays.push(overlay.toJSON());
			});

			var view = new GoogleMaps.Views.MapList({
				map: this,
				model: new Backbone.Model(data),
				showButtons: this.showButtons
			});

			this.showModal(view);
		},

		buildButtonBar: function() {
			var t = this;

			this.buttonBar.show(new GoogleMaps.Views.ButtonBar({
				showButtons: (this.showButtons != '*' ? this.showButtons : this.availableButtons),
 				buttons: [{
 					icon: 'list',
 					name: 'list',
 					click: function(e) {
 						t.showMapList();

 						e.preventDefault();
 					}
 				}, {
 					icon: 'refresh',
 					name: 'refresh',
 					click: function(e) {
 						t.center();

 						e.preventDefault();
 					}
 				},{
 					label: 'Add Marker',
 					name: 'markers',
 					click: function(e) {
 						var view = new GoogleMaps.Views.MarkerForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault();
 					}
 				},{
 					label: 'Add Route',
 					name: 'routes',
 					click: function(e) {
 						var view = new GoogleMaps.Views.RouteForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault(); 						
 					}
 				},{
 					label: 'Add Polygon',
 					name: 'polygons',
 					click: function(e) {
 						var view = new GoogleMaps.Views.PolygonForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault();
 					}
 				},{
 					label: 'Add Polyline',
 					name: 'polylines',
 					click: function(e) {
 						var view = new GoogleMaps.Views.PolylineForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault();
 					}
 				},{
 					label: 'Add Circle',
 					name: 'circles',
 					click: function(e) {
 						var view = new GoogleMaps.Views.CircleForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault();
 					}
 				},{
 					label: 'Add Image',
 					name: 'images',
 					click: function(e) {
 						var view = new GoogleMaps.Views.GroundOverlayForm({
 							map: t
 						});

 						t.showModal(view);

 						e.preventDefault();
 					}
 				}]
 			}));
		},

		closeInfoWindows: function() {
			_.each(this.markers, function(marker) {
				marker.get('infowindow').close();
			});

			_.each(this.polygons, function(polygon) {
				polygon.get('infowindow').close();
			});

			_.each(this.polylines, function(polyline) {
				polyline.get('infowindow').close();
			});

			_.each(this.circles, function(circle) {
				circle.get('infowindow').close();
			});

			_.each(this.groundOverlays, function(overlay) {
				overlay.get('infowindow').close();
			});

			_.each(this.routes, function(route) {
				_.each(route.get('markers'), function(marker) {
					marker.get('infowindow').close();
				});
			});
		},

		showModal: function(view) {	
			this.modal.empty();
			this.modal.show(view);
			this.modal.$el.addClass('show');
			this.buttonBar.$el.addClass('hide');
		},

		hideModal: function(center) {
			this.modal.$el.removeClass('show');
			this.buttonBar.$el.removeClass('hide');
			this.modal.empty();

			if(_.isUndefined(center) || center === true) {	
				this.center();
			}
		},

		zoomIn: function() {
			this.setZoom(this.getZoom() + 1);
		},

		zoomOut: function() {
			this.setZoom(this.getZoom() - 1);
		},

		center: function() {
			var t = this, bounds = new google.maps.LatLngBounds();
			var boundsChanged = false;

			_.each(this.markers, function(marker) {
				if(!marker.get('deleted')) {
					bounds.extend(marker.getPosition());
					boundsChanged = true;
				}
			});

			_.each(this.polygons, function(polygon) {
				if(!polygon.get('deleted')) {
					_.each(polygon.getPath().getArray(), function(latLng) {
						bounds.extend(latLng);
						boundsChanged = true;
					});
				}
			});

			_.each(this.polylines, function(polyline) {
				if(!polyline.get('deleted')) {
					_.each(polyline.getPath().getArray(), function(latLng) {
						bounds.extend(latLng);
						boundsChanged = true;
					});
				}
			});

			_.each(this.circles, function(circle) {
				if(!circle.get('deleted')) {
					bounds.union(circle.getBounds());
					boundsChanged = true;
				}
			});

			_.each(this.groundOverlays, function(overlay) {
				if(!overlay.get('deleted')) {
					bounds.union(overlay.getBounds());
					boundsChanged = true;
				}
			});

			_.each(this.routes, function(route) {
				_.each(route.getLocations(), function(location) {
					bounds.extend(new google.maps.LatLng(location.lat, location.lng));
					boundsChanged = true;
				});
			});

			if(boundsChanged) {
				this.fitBounds(bounds);
			}
		},

		union: function(bounds) {
			this.fitBounds(bounds.union(this.getBounds()));
		},

		fitBounds: function(bounds) {
			this.api.fitBounds(bounds);
		},

		getBounds: function() {
			return this.api.getBounds();
		},

		getCenter: function() {
			return this.api.getCenter();
		},

		getCanvas: function() {
			return this.$el.find('.oh-google-map').get(0);
		},

		getMapOptions: function() {
			return this.mapOptions;
		},

		getDiv: function() {
			return this.api.getDiv()
		},

		getHeading: function() {
			return this.api.getHeading();
		},

		getMapTypeId: function() {
			return this.api.getMapTypeId();
		},

		getProjection: function() {
			return this.api.getProjection();
		},

		getStreetView: function() {
			return this.api.getStreetView();
		},

		getTilt: function() {
			return this.api.getCenter();
		},

		getZoom: function() {
			return this.api.getZoom();
		},

		panBy: function(x, y) {
			this.api.panBy(x, y);
		},

		panTo: function(value) {
			this.api.panTo(value);
		},

		panToBounds: function(value) {
			this.api.panToBounds(value);
		},

		setCenter: function(value) {
			this.api.setCenter(value);
		},

		setHeading: function(value) {
			this.api.setHeading(value);
		},

		setMapTypeId: function(value) {
			this.api.setMapTypeId(value);
		},

		setOptions: function(value) {
			this.api.setOptions(value);
		},

		setStreetView: function(value) {
			this.api.setStreetView(value);
		},

		setTilt: function(value) {
			this.api.setTilt(value);
		},

		setZoom: function(x) {
			if(x < 0) {
				x = 0;
			}

			if(x > 20) {
				x = 20;
			}

			this.api.setZoom(x);
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.MapList = GoogleMaps.Views.ItemView.extend({

		map: false,

		template: GoogleMaps.Template('map-list'),

		initialize: function(options) {
			GoogleMaps.Views.ItemView.prototype.initialize.call(this, options);

			var t = this;

			if(this.getOption('showButtons')) {
				_.each(this.getOption('showButtons'), function(button) {
					t.model.set('show'+(button.charAt(0).toUpperCase() + button.slice(1)), true);
				});
			}
		},

		onRender: function() {
			var t = this;

			this.$el.find('.cancel').click(function(e) {
				t.map.hideModal(false);

				e.preventDefault();
			});

			this.$el.find('.edit').click(function(e) {
				var prop = $(this).data('property');
				var index = $(this).parents('li').index();
				var data = t.map[prop][index];

				data.edit(true);

				e.preventDefault();
			});

			this.$el.find('.delete').click(function(e) {
				var prop = $(this).data('property');
				var index = $(this).parents('li').index();
				var data = t.map[prop][index];

				data.delete(true);

				e.preventDefault();
			});

			this.$el.find('.marker-undo').click(function(e) {
				var index = $(this).parent().index();
				var marker = t.map.markers[index];

				marker.set('deleted', false);
				marker.get('api').setMap(t.map.api);

				t.model.get('markers')[index].deleted = false;

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.route-undo').click(function(e) {
				var index = $(this).parent().index();
				var route = t.map.routes[index];

				route.set('deleted', false);
				route.get('api').setMap(t.map.api);

				t.model.get('routes')[index].deleted = false;

				_.each(t.model.get('routes')[index].markers, function(marker) {
					marker.deleted = false;
					marker.setMap(t.map.api);
				});

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.polygon-undo').click(function(e) {
				var index = $(this).parent().index();
				var polygon = t.map.polygons[index];

				polygon.set('deleted', false);
				polygon.get('api').setMap(t.map.api);

				t.model.get('polygons')[index].deleted = false;

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.polyline-undo').click(function(e) {
				var index = $(this).parent().index();
				var polyline = t.map.polylines[index];

				polyline.set('deleted', false);
				polyline.get('api').setMap(t.map.api);

				t.model.get('polylines')[index].deleted = false;

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.circle-undo').click(function(e) {
				var index = $(this).parent().index();
				var circle = t.map.circles[index];

				circle.set('deleted', false);
				circle.get('api').setMap(t.map.api);

				t.model.get('circles')[index].deleted = false;

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.overlay-undo').click(function(e) {
				var index = $(this).parent().index();
				var overlay = t.map.groundOverlays[index];

				overlay.set('deleted', false);
				overlay.get('api').setMap(t.map.api);

				t.model.get('groundOverlays')[index].deleted = false;

				t.map.center();
				t.map.updateHiddenField();
				t.render();
				
				e.preventDefault();
			});

			this.$el.find('.marker-center').click(function(e) {
				var index = $(this).parent().index();
				var marker = t.map.markers[index];

				t.map.api.setZoom(14);
				t.map.api.setCenter(marker.getPosition());
				
				e.preventDefault();
			});

			this.$el.find('.route-center').click(function(e) {
				var index = $(this).parent().index();
				var route = t.map.routes[index];

				var bounds = new google.maps.LatLngBounds();

				_.each(route.getLocations(), function(location) {
					bounds.extend(new google.maps.LatLng(location.lat, location.lng));
				});

				t.map.fitBounds(bounds);

				e.preventDefault();
			});

			this.$el.find('.polygon-center').click(function(e) {
				var index = $(this).parent().index();
				var polygon = t.map.polygons[index];

				var bounds = new google.maps.LatLngBounds();

				polygon.getPath().forEach(function(latLng) {
					bounds.extend(latLng);
				});
				
				t.map.fitBounds(bounds);

				e.preventDefault();
			});

			this.$el.find('.polyline-center').click(function(e) {
				var index = $(this).parent().index();
				var polyline = t.map.polylines[index];

				var bounds = new google.maps.LatLngBounds();

				polyline.getPath().forEach(function(latLng) {
					bounds.extend(latLng);
				});
				
				t.map.fitBounds(bounds);

				e.preventDefault();
			});

			this.$el.find('.circle-center').click(function(e) {
				var index = $(this).parent().index();
				var circle = t.map.circles[index];

				t.map.fitBounds(circle.getBounds());

				e.preventDefault();
			});

			this.$el.find('.overlay-center').click(function(e) {
				var index = $(this).parent().index();
				var overlay = t.map.groundOverlays[index];

				t.map.fitBounds(overlay.getBounds());

				e.preventDefault();
			});
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.MarkerForm = GoogleMaps.Views.BaseForm.extend({

		map: false,

		template: GoogleMaps.Template('marker-form'),

		originalModel: {},

		initialize: function(options) {
			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			var t = this;

			if(!this.model) {
				this.model = new GoogleMaps.Models.Marker({
					map: this.map,
					isNew: true,
					isSavedToMap: false
				});
			}
			else {
				this.originalModel = this.model.toJSON();
			}

			/*
			this.model.onDragend = function(e) {
				GoogleMaps.Models.Marker.prototype.onDragend.call(this, e, function() {
					t.$el.find('.lat').html(e.latLng.lat());
					t.$el.find('.lng').html(e.latLng.lng());
					t.$el.find('.address').html(t.model.get('address'));

					if(!t.model.get('customContent')) {
						t.$el.find('[name="content"]').val(t.model.get('content'));
					}
				});
			};
			*/
		},

		submit: function() {
			this.model.set({
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val(),
				scaledWidth: parseInt(this.$el.find('[name="scaledWidth"]').val()),
				scaledHeight: parseInt(this.$el.find('[name="scaledHeight"]').val())
			});

			if(this.model.get('content') != this.model.get('address').split(',').join('<br>')) {
				this.model.set('customContent', true);
			}

			var latLng = new google.maps.LatLng(this.model.get('lat'), this.model.get('lng'));

			this.model.get('infowindow').setOptions({content: this.model.buildInfoWindowContent()});
			this.model.get('api').setPosition(latLng);

			if(!this.model.get('isSavedToMap')) {
				this.map.markers.push(this.model);
			}

			if(this.model.get('icon')) {
				this.model.setIcon(this.model.get('icon'));
			}
			else {
				this.model.setIcon(false);
			}

			this.model.set('isSavedToMap', true);

			this.model.get('infowindow').open(this.map.api, this.model.get('api'));

			this.map.center();
			this.map.hideModal();
			this.map.updateHiddenField();
		},

		hasLocation: function() {
			return _.isUndefined(this.model.get('lat')) || _.isUndefined(this.model.get('lng')) ? false : true;
		},

		onRender: function() {
			var t = this;

			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			this.$el.find('.edit-location').click(function(e) {
				t.showGeocoder();
				e.preventDefault();
			});

			this.$el.find('.change-icon').click(function(e) {
				
				var modal = Craft.createElementSelectorModal('Asset', {
				    multiSelect: false,
				    storageKey: 'googleMapsPlugin',
				    criteria: { kind: 'image' },
				    onSelect: function(entries) {
				    	t.model.set('icon', entries[0].url);
				    	t.$el.find('.oh-google-map-map-icon img').attr('src', entries[0].url);
				    }
				});
				
				e.preventDefault();
			});

			/*
			this.$el.find('[name="title"]').blur(function(e) {
				t.model.set('title', this.$el);				
			});
			*/
		},

		onShow: function() {
			var t = this;

			// GoogleMaps.Views.BaseForm.prototype.onShow.call(this);

			this.map.closeInfoWindows();

			if(this.model.get('isSavedToMap')) {
				this.model.get('infowindow').open(this.map.api, this.model.get('api'));
			}

			if(!this.hasLocation()) {
				this.showGeocoder();
			}
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		},

		showGeocoder: function() {
			var t = this;

			var view = new GoogleMaps.Views.Geocoder({
				map: this.map,
				responseHandler: function(response) {
					t.responseHandler(response);
				},
				cancel: function() {
					if(t.hasLocation()) {
						t.isDestroyed = false;
						t.map.showModal(t);
					}
					else {
						t.map.hideModal();
					}
				}
			});

			this.map.showModal(view);
		},

		responseHandler: function(response) {
			var t = this;
			
			t.model.set({
				address: response.formatted_address,
				addressComponents: response.address_components,
				lat: response.geometry.location.lat(),
				lng: response.geometry.location.lng()
			});

			if(!t.model.get('customContent')) {
				if(!t.model.isCoordinate(response.formatted_address)) {
					t.model.set('content', response.formatted_address.split(',').join('<br>'));
				}
				else {
					t.model.set('content', response.formatted_address);
				}
			}

			t.isDestroyed = false;
			t.map.showModal(t);
		},

		/*
		responseHandler: function(response) {
			var marker = this.addMarker({
				lat: response.geometry.location.lat(), 
				lng: response.geometry.location.lng(),
				address: response.formatted_address,
				addressComponents: response.address_components
			});

			this.map.closeInfoWindows();

			marker.get('infowindow').open(this.map.api, marker.get('api'));
		},
		*/
		
		addMarker: function(data, isNewMarker) {
			var t = this, latLng = new google.maps.LatLng(data.lat, data.lng);

			if(_.isUndefined(isNewMarker)) {
				isNewMarker = true;
			}

			/*
			google.maps.event.addListener(marker, 'click', function() {
				t.map.closeInfoWindows();
				infowindow.open(t.map.api, marker);
			});

			google.maps.event.addListener(marker, 'dragend', function(e) {
				t.geocoder.geocode({location: e.latLng}, function(results, status) {
					var content = data.content ? data.content : data.address.split(',').join('<br>');

					if(status == 'OK') {
						marker.address = results[0].formatted_address;
						marker.addressComponents = results[0].address_components;
					}
					else {
						marker.address = '';
						marker.addressComponents = [];
					}

					if(!marker.customContent) {
						marker.content = marker.address.split(',').join('<br>');
						marker.infowindow.setContent(t.buildInfoWindowContent(marker, marker.content));
					}

					t.map.updateHiddenField();
				});
			});

			var content = data.content ? data.content : data.address.split(',').join('<br>');

			var infowindow = new google.maps.InfoWindow({
				content: this.buildInfoWindowContent(marker, content)
			});
			*/

			/*
			marker.title = data.title ? data.title : null;
			marker.content = content;
			marker.customContent = data.customContent ? true : false;
			marker.infowindow = infowindow;
			marker.address = data.address;
			marker.addressComponents = data.addressComponents;
			marker.isNew = isNewMarker ? true : false;
			*/

			/*
			if(data.locationId) {
				marker.locationId = data.locationId;
			}

			if(data.elementId) {
				marker.elementId = data.elementId;
			}

			var marker = new GoogleMaps.Models.Marker({
				map: this.map,
				api: new google.maps.Marker({
					position: latLng,
					draggable: true
				}),
				title: data.title ? data.title : null,
				content: data.content ? data.content : data.address.split(',').join('<br>'),
				customContent: data.customContent ? true : false,
				address: data.address,
				addressComponents: data.addressComponents,
				// infowindow: infowindow,
				isNew: isNewMarker ? true : false,
				icon: data.icon ? data.icon : null,
				elementId: data.elementId ? data.elementId : null,
				locationId: data.locationId ? data.locationId : null
			});

			this.map.markers.push(marker);

			this.map.center();
			this.map.hideModal();
			this.map.updateHiddenField();

			return marker;

			*/
		},

		cancel: function() {
			if(this.model.get('isSavedToMap')) {
				var position = new google.maps.LatLng(
					this.originalModel.lat, 
					this.originalModel.lng
				);

				this.model.set(this.originalModel);
				this.model.get('api').setPosition(position);
				this.model.get('infowindow').setOptions({content: this.model.buildInfoWindowContent()});
			}

			this.map.hideModal();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.PolygonForm = GoogleMaps.Views.BaseForm.extend({

		geocoder: false,

		template: GoogleMaps.Template('polygon-form'),

		map: false,

		api: false,

		dblclickEvent: false,

		initialize: function(options) {
			var t = this;

			this.geocoder = new google.maps.Geocoder();

			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			this.initializeApi();

			this.model.get('infowindow').close();
			this.model.get('api').setDraggable(true);
			this.model.get('api').setEditable(true);

			this.api = this.model.get('api');
		},

		initializeApi: function() {
			if(!this.model) {
				this.model = new GoogleMaps.Models.Polygon({
					map: this.map,
					points: [],
					hideDetails: true,
					isNew: true,
					isSavedToMap: false
				});
			}
		},

		onRender: function() {
			var t = this;

			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			this.model.onMouseup = function() {
				setTimeout(function() {
					// t.model.set('points', t.api.getPath().getArray());
					t.render();
				}, 200);
			};

			this.model.onDragend = function() {
				// t.model.set('points', t.api.getPath().getArray());
				t.render();
			};

			this.$el.find('.toggle-details').click(function(e) {
				var $panel = t.$el.find('.details');

				if($panel.css('display') == 'none') {
					$panel.show();			
					t.model.set('hideDetails', false);		
					$(this).html('Hide Details');
				}
				else {
					$panel.hide();
					t.model.set('hideDetails', true);
					$(this).html('Show Details');
				}

				t.$el.find('input').focus();

				e.preventDefault();
			});

			this.$el.find('input').keypress(function(e) {
				if(e.keyCode == 13) {
					t.$el.find('.add-point').click();
					e.preventDefault();
				}
			}).focus();

			this.$el.find('.add-point').click(function(e) {
				t.addPoint(t.$el.find('input').val());

				e.preventDefault();
			});

			this.$el.find('.oh-google-map-tag a').click(function(e) {
				var index = $(this).parent().index();

				t.removePoint(index);

				e.preventDefault();
			});

			this.$el.find('.simple-color-picker').simpleColorPicker().blur(function() {
				t.updatePolygonOptions();
			})
			.blur();

			this.$el.find('.slider').each(function() {
				var value = $(this).data('value');
				var start = $(this).data('start');
				var step = $(this).data('step');
				var min = $(this).data('min');
				var max = $(this).data('max');

				$(this).noUiSlider({
					start: parseFloat(value ? value : start),
					step: parseFloat(step),
					range: {
						'min': parseFloat(min),
						'max': parseFloat(max)
					}
				})
				.change(function(e, value) {
					$(this).next().val(value);
					t.updatePolygonOptions();
				});

				$(this).next().val($(this).val());
			});

			t.updatePolygonOptions();
		},

		updatePolygonOptions: function() {
			var options = {
				strokeColor: this.$el.find('[name="strokeColor"]').val(),
				strokeOpacity: this.$el.find('[name="strokeOpacity"]').val(),
				strokeWeight: this.$el.find('[name="strokeWeight"]').val(),
				fillColor: this.$el.find('[name="fillColor"]').val(),
				fillOpacity: this.$el.find('[name="fillOpacity"]').val(),
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			};

			this.model.set(options);
			this.api.setOptions(options);
		},

		onShow: function() {
			var t = this;

			this.map.closeInfoWindows();

			this.map.api.setOptions({
				disableDoubleClickZoom: true
			});

			this.dblclickEvent = google.maps.event.addListener(this.map.api, 'dblclick', function(e) {
				t.addPoint(e.latLng);
			});

			setTimeout(function() {
				t.$el.find('input').focus();
			}, 250);

		},

		onDestroy: function() {

			this.model.onMouseup = function() {};

			this.model.onDragend = function() {};

			if(!this.model.get('isSavedToMap') && this.model.get('isNew')) {
				this.api.setMap(null);
			}

			this.map.api.setOptions({
				disableDoubleClickZoom: false
			});

			if(this.dblclickEvent) {
				this.dblclickEvent.remove();
			}
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		},

		addPoint: function(coord) {
			var t = this, path = this.api.getPath();

			if(!path) {
				path = [];
			}

			if(_.isObject(coord)) {
				path.push(coord);

				this.api.setPath(path);
				this.render();
			}
			else if(this.isCoordinate(coord)) {
				coord = coord.split(',');

				path.push(new google.maps.LatLng(parseFloat(coord[0]), parseFloat(coord[1])));

				this.api.setPath(path);
				this.render();
			}
			else {
				this.geocoder.geocode({address: coord}, function(results, status) {
					if(status == 'OK') {
						path.push(results[0].geometry.location);

						t.api.setPath(path);
					}

					t.render();
				});
			}
		},

		removePoint: function(index) {
			var path = this.api.getPath();

			path.removeAt(index);

			this.api.setPath(path);
			this.render();
		},

		saveToMap: function() {
			if(!this.model.get('isSavedToMap')) {
				this.map.polygons.push(this.model);
				this.model.set('isSavedToMap', true);
			}
		},

		submit: function() {
			this.api.setDraggable(false);
			this.api.setEditable(false);

			var points = [];

			this.api.getPath().forEach(function(path) {
				points.push({lat: path.lat(), lng: path.lng()});
			});

			this.model.set('points', points);

			this.saveToMap();
			this.updatePolygonOptions();

			if(this.model.get('infowindow')) {
				this.model.get('infowindow').setOptions({
					content: this.model.buildInfoWindowContent()
				});
			}

			this.map.hideModal();
			this.map.updateHiddenField();
		},

		cancel: function() {
			this.model.setPoints(this.model.get('points'));
			this.model.setDraggable(false);
			this.model.setEditable(false);
			this.map.hideModal();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.PolylineForm = GoogleMaps.Views.PolygonForm.extend({

		geocoder: false,

		template: GoogleMaps.Template('polyline-form'),

		initializeApi: function() {
			if(!this.model) {
				this.model = new GoogleMaps.Models.Polyline({
					map: this.map,
					points: [],
					hideDetails: true,
					isNew: true,
					isSavedToMap: false
				});
			}
		},

		saveToMap: function() {
			if(!this.model.get('isSavedToMap')) {
				this.map.polylines.push(this.model);
				this.model.set('isSavedToMap', true);
			}
		}			

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.RouteForm = GoogleMaps.Views.BaseForm.extend({

		geocoder: false,

		template: GoogleMaps.Template('route-form'),

		map: false,

		api: false,

		dblclickEvent: false,

		originalRoute: false,

		initialize: function(options) {
			var t = this;

			this.geocoder = new google.maps.Geocoder();

			GoogleMaps.Views.BaseForm.prototype.initialize.call(this, options);

			this.initializeApi();

			this.originalRoute = $.extend(true, {}, this.model.toJSON());

			/*
			this.model.get('infowindow').close();
			this.model.get('api').setDraggable(true);
			this.model.get('api').setEditable(true);
			*/

			this.api = this.model.get('api');
		},

		initializeApi: function() {
			if(!this.model) {
				this.model = new GoogleMaps.Models.Route({
					map: this.map,
					locations: [],
					hideDetails: true,
					isNew: true,
					isSavedToMap: false,		
					onDragend: function(e) {
						view.render();
					}
				});
			}
		},

		onRender: function() {
			var t = this;

			GoogleMaps.Views.BaseForm.prototype.onRender.call(this);

			/*
			this.model.onMouseup = function() {
				setTimeout(function() {
					// t.model.set('points', t.api.getPath().getArray());
					t.render();
				}, 200);
			};

			*/

			this.model.onDragend = function() {
				t.render();
			};

			this.$el.find('.toggle-details').click(function(e) {
				var $panel = t.$el.find('.details');

				if($panel.css('display') == 'none') {
					$panel.show();			
					t.model.set('hideDetails', false);		
					$(this).html('Hide Details');
				}
				else {
					$panel.hide();
					t.model.set('hideDetails', true);
					$(this).html('Show Details');
				}

				t.$el.find('input').focus();

				e.preventDefault();
			});

			this.$el.find('input').keypress(function(e) {
				if(e.keyCode == 13) {
					t.$el.find('.add-location').click();
					e.preventDefault();
				}
			}).focus();

			this.$el.find('.edit-location').click(function(e) {
				var index = $(this).parents('li').index();
				var markers = t.model.getMarkers();

				if(markers[index]) {
					var view = new GoogleMaps.Views.RouteMarkerForm({
						map: t.map,
						model: markers[index],
						submit: function() {

							GoogleMaps.Views.RouteMarkerForm.prototype.submit.call(this);

							this.model.get('location').lat = this.model.get('lat');
							this.model.get('location').lng = this.model.get('lng');
							this.model.get('location').address = this.model.get('address');
							this.model.get('location').icon = this.model.get('icon');

							t.model.render();

							t.isDestroyed = false;
							t.map.showModal(t);
						},
						cancel: function() {
							t.isDestroyed = false;
							t.map.showModal(t);
						}
					});

					t.map.showModal(view);
				}

				e.preventDefault();
			});

			this.$el.find('.remove-location').click(function(e) {
				var index = $(this).parents('li').index();

				t.model.removeLocation(index);

				if(t.model.getLocations().length > 1) {
					t.model.render();
				}
				else {
					t.model.setMap(null);	
				}

				t.render();

				e.preventDefault();
			});

			this.$el.find('.add-location').click(function(e) {
				var view = new GoogleMaps.Views.Geocoder({
					map: t.map,
					responseHandler: function(response) {
						t.model.addLocation({
							address: response.formatted_address,
							lat: response.geometry.location.lat(),
							lng: response.geometry.location.lng(),
							isSavedToMap: false
						});

						t.isDestroyed = false;
						t.model.render(t.getOptions());
						t.model.updateMarkerIcons();
						t.map.showModal(t);
					},
					cancel: function() {
						t.isDestroyed = false;
						t.map.showModal(t);
					}
				});

				t.map.showModal(view);

				e.preventDefault();
			});

			this.$el.find('.lightswitch').lightswitch({
				onChange: function() {
					t.model.render(t.getOptions());
				}
			});

			this.$el.find('[name="travelMode"]').click(function(e) {
				t.model.render(t.getOptions());
			});

			this.$el.find('select').change(function() {
				t.model.render(t.getOptions());
			});
		},

		getSwitchOption: function(name) {
			var value = this.$el.find('[name="'+name+'"]').val();

			return value != "" ? true : false;
		},

		getOptions: function() {
			return {
				avoidFerries: this.getSwitchOption('avoidFerries'),
				avoidHighways: this.getSwitchOption('avoidHighways'),
				avoidTolls: this.getSwitchOption('avoidTolls'),
				durationInTraffic: this.getSwitchOption('durationInTraffic'),
				optimizeWaypoints: this.getSwitchOption('optimizeWaypoints'),
				provideRouteAlternatives: this.getSwitchOption('provideRouteAlternatives'),
				transitOptions: {},
				travelMode: this.$el.find('[name="travelMode"]:checked').val(),
				unitSystem: google.maps.UnitSystem.IMPERIAL
			};
		},

		onShow: function() {
			var t = this;

			_.each(this.model.getMarkers(), function(marker, i) {
				marker.setDraggable(true);
			});

			this.map.closeInfoWindows();

			this.map.api.setOptions({
				disableDoubleClickZoom: true
			});

			this.dblclickEvent = google.maps.event.addListener(this.map.api, 'dblclick', function(e) {
				t.geocoder.geocode({location: e.latLng}, function(results, status) {
					t.model.addLocation({
						address: status == 'OK' ? results[0].formatted_address : '',
						lat: e.latLng.lat(),
						lng: e.latLng.lng(),
						isSavedToMap: false
					});
					t.model.render(t.getOptions());
					t.model.updateMarkerIcons();
					t.render();
				});				
			});

			setTimeout(function() {
				t.$el.find('input').focus();
			}, 250);

		},

		onDestroy: function() {

			_.each(this.model.getMarkers(), function(marker, i) {
				marker.setDraggable(false);
			});

			if(this.dblclickEvent) {
				this.dblclickEvent.remove();
			}

			this.map.api.setOptions({disableDoubleClickZoom: false});

			/*
			this.model.onMouseup = function() {};

			this.model.onDragend = function() {};

			if(!this.model.get('isSavedToMap') && this.model.get('isNew')) {
				this.api.setMap(null);
			}

			this.map.api.setOptions({
				disableDoubleClickZoom: false
			});

			*/
		},

		isCoordinate: function(coord) {
			return coord.match(/^([-\d.]+),(\s+)?([-\d.]+)$/);
		},

		saveToMap: function() {
			if(!this.model.get('isSavedToMap')) {
				this.map.routes.push(this.model);
				this.model.set('isSavedToMap', true);
			}

			_.each(this.model.getLocations(), function(location, i) {
				location.isSavedToMap = true;
			});
		},

		submit: function() {
			var t = this;

			this.saveToMap();

			this.model.set(this.getOptions());
			this.model.set({
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val()
			});

			this.model.setDraggable(false);

			if(this.model.get('infowindow')) {
				this.model.get('infowindow').setOptions({
					content: this.model.buildInfoWindowContent()
				});
			}

			_.each(this.model.getLocations(), function(location, i) {
				var marker = t.model.getMarker(i);

				/*
				marker.set('lat', location.lat);
				marker.set('lng', location.lng);
				marker.set('location', location);
				*/

				marker.originalMarker = $.extend(true, {}, marker.toJSON());
			});

			this.originalRoute = $.extend(true, {}, this.model.toJSON());

			this.map.hideModal();
			this.map.updateHiddenField();
		},

		cancel: function() {
			var t = this, locations = [], markers = [];

			_.each(this.model.getLocations(), function(location, i) {
				if(location.isSavedToMap !== false) {
					locations.push(location);
					markers.push(t.model.getMarker(i));
				}
				else {
					t.model.getMarker(i).setMap(null);
				}
			});

			this.model.set('locations', locations);
			this.model.set('markers', markers);

			_.each(markers, function(marker, i) {
				marker.revert();
				marker.set('location', t.originalRoute.locations[i]);
			});

			this.model.set(this.originalRoute);

			if(!this.model.getLocations().length) {
				this.model.setMap(null);
			}
			else {
				this.model.render();
			}

			this.model.updateMarkerIcons();
			this.map.updateHiddenField();
			this.map.hideModal();
		}

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.RouteLocationForm = GoogleMaps.Views.Geocoder.extend({

		template: GoogleMaps.Template('route-location-form')

	});

}());
(function() {

	"use strict";

	GoogleMaps.Views.RouteMarkerForm = GoogleMaps.Views.MarkerForm.extend({

		submit: function() {
			this.model.set({
				title: this.$el.find('[name="title"]').val(),
				content: this.$el.find('[name="content"]').val(),
				scaledWidth: parseInt(this.$el.find('[name="scaledWidth"]').val()),
				scaledHeight: parseInt(this.$el.find('[name="scaledHeight"]').val())
			});

			if(this.model.get('content') != this.model.get('address').split(',').join('<br>')) {
				this.model.set('customContent', true);
			}

			var latLng = new google.maps.LatLng(this.model.get('lat'), this.model.get('lng'));

			this.model.get('infowindow').setOptions({content: this.model.buildInfoWindowContent()});
			this.model.get('api').setPosition(latLng);

			if(this.model.get('icon')) {
				this.model.get('location').icon = this.model.get('icon');
				this.model.setIcon(this.model.get('icon'));
			}
			else {
				this.model.get('location').icon = null;
				this.model.setIcon(false);
			}

			// this.model.get('infowindow').open(this.map.api, this.model.get('api'));
		}

	});

}());
(function() {

	"use strict";

	/*
	GoogleMaps.App.addInitializer(function() {

		GoogleMaps.addScript = function(url, callback) {
			if(typeof google === "undefined") {
			    var script = document.createElement('script');
			    if(callback) script.onload = callback;
			    script.type = 'text/javascript';
			    script.src = url;
			    document.body.appendChild(script);
			}
			else {
				GoogleMaps.googleApiCallback();
			}
		};

		GoogleMaps.googleApiCallback = function() {
			var map = new GoogleMaps.Views.Map();

			GoogleMaps.App.content.show(map);
		};

		$(document).ready(function() {
			GoogleMaps.addScript('https://maps.googleapis.com/maps/api/js?&sensor=false&callback=GoogleMaps.googleApiCallback');
		});
		
	});
	*/

}());
(function() {

    Handlebars.registerHelper('activeSegment', function(segment, match, options) {
        var _return = [];

        if(Timeblocker.Uri.segment(segment) == match) {
            return options.fn();
        }

        return false;
    });

}());
(function() {

    Handlebars.registerHelper('addon', function(addon, options) {
    	if(Account.hasAddon(addon)) {
	        return options.fn(Account.get('addons')[addon]);
	    }
        return null;
    });

}());
(function() {

    Handlebars.registerHelper('date', function(timestamp, format, options) {

      if(_.isObject(format)) {
        format = timestamp;
        timestamp = new Timeblocker.Date();
      }

      var time;

      if(_.isObject(timestamp) && _.isFunction(timestamp.timestamp)) {
        time = timestamp.timestamp();
      }
      else {
        time = new Timeblocker.Date(timestamp);
      }

      if(!time.date) {
        time = new Timeblocker.Date(time); 
      }
      
      return time.format(format);

    });

}());
(function() {

	'use strict';

    Handlebars.registerHelper('eachProperty', function(context, options) {
    	var ret = [];

    	if(_.isObject(context)) {
	    	_.each(context, function(value, property) {
	    		var parse = {
	    			property: property,
	    			value: value
	    		};

	    		ret.push(options.fn(parse));
	    	});
	    }

    	return ret.join("\n");
    });

}());


(function() {

	'use strict';

    Handlebars.registerHelper('forEach', function(context, options) {
    	var ret = [];

    	if(_.isObject(context)) {
	    	_.each(context, function(value, i) {
	    		var parse = _.extend(value, {
	    			index: i,
	    			count: i + 1
	    		});

	    		ret.push(options.fn(parse));
	    	});
	    }

    	return ret.join("\n");
    });

}());


(function() {

    Handlebars.registerHelper('hasAddon', function(addon, options) {
    	if(Account.hasAddon(addon)) {
	        return options.fn();
	    }
    });

    Handlebars.registerHelper('hasNoAddon', function(addon, options) {
    	if(!Account.hasAddon(addon)) {
	        return options.fn();
	    }
    });

}());
(function() {

    Handlebars.registerHelper('profile', function(options) {
        return options.fn(Profile.toJSON());
    });

    Handlebars.registerHelper('account', function(options) {
        return options.fn(Account.toJSON());
    });

    Handlebars.registerHelper('hasPermission', function(permission, options) {
    	if(Profile.hasPermission(permission)) {
	        return options.fn();
	    }
    });

    Handlebars.registerHelper('notPermitted', function(permission, options) {
     	if(!Profile.hasPermission(permission)) {
	        return options.fn();
	    }
    });

    Handlebars.registerHelper('canCancelAppointment', function(client, options) {
    	if( Profile.get('uid') == client.uid || 
            Profile.get('uid') == client.parent.uid ||
            Profile.hasPermission('manageAppointments') ) {
    		return options.fn();
    	}
    });

}());
(function() {

    Handlebars.registerHelper('inArray', function(needle, haystack, options) {
        if( typeof haystack == "object" && haystack.indexOf(needle) >= 0) {
        	return options.fn();
        }
    });

}());
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('handlebars'));
    } else if (typeof define === 'function' && define.amd) {
        define(['handlebars'], factory);
    } else {
        root.HandlebarsHelpersRegistry = factory(root.Handlebars);
    }
}(this, function (Handlebars) {

    var isArray = function(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    var ExpressionRegistry = function() {
        this.expressions = [];
    };

    ExpressionRegistry.prototype.add = function (operator, method) {
        this.expressions[operator] = method;
    };

    ExpressionRegistry.prototype.call = function (operator, left, right) {
        if ( ! this.expressions.hasOwnProperty(operator)) {
            throw new Error('Unknown operator "'+operator+'"');
        }

        return this.expressions[operator](left, right);
    };

    var eR = new ExpressionRegistry();
    eR.add('not', function(left, right) {
        return left != right;
    });
    eR.add('>', function(left, right) {
        return left > right;
    });
    eR.add('<', function(left, right) {
        return left < right;
    });
    eR.add('>=', function(left, right) {
        return left >= right;
    });
    eR.add('<=', function(left, right) {
        return left <= right;
    });
    eR.add('==', function(left, right) {
        return left == right;
    });
    eR.add('===', function(left, right) {
        return left === right;
    });
    eR.add('!==', function(left, right) {
        return left !== right;
    });
    eR.add('in', function(left, right) {
        if ( ! isArray(right)) {
            right = right.split(',');
        }
        return right.indexOf(left) !== -1;
    });

    var isHelper = function() {
        var args = arguments,
            left = args[0],
            operator = args[1],
            right = args[2],
            options = args[3];

        if (args.length == 2) {
            options = args[1];
            if (left) return options.fn(this);
            return options.inverse(this);
        }

        if (args.length == 3) {
            right = args[1];
            options = args[2];
            if (left == right) return options.fn(this);
            return options.inverse(this);
        }

        if (eR.call(operator, left, right)) {
            return options.fn(this);
        }
        return options.inverse(this);
    };

    Handlebars.registerHelper('is', isHelper);

    /*
    Handlebars.registerHelper('nl2br', function(text) {
        var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
        return new Handlebars.SafeString(nl2br);
    });

    Handlebars.registerHelper('log', function() {
        console.log(['Values:'].concat(
            Array.prototype.slice.call(arguments, 0, -1)
        ));
    });

    Handlebars.registerHelper('debug', function() {
        console.log('Context:', this);
        console.log(['Values:'].concat(
            Array.prototype.slice.call(arguments, 0, -1)
        ));
    });
	*/

    return eR;

}));
(function() {

    Handlebars.registerHelper('isArray', function(variable, options) {
        if(_.isArray(variable)) {
            return options.fn();
        }
    });

    Handlebars.registerHelper('notArray', function(variable, options) {
        if(!_.isArray(variable)) {
            return options.fn();
        }
    });

}());
(function() {

    Handlebars.registerHelper('isHost', function(options) {
        if(Profile.isHost()) {
            return options.fn();
        }
    });

    Handlebars.registerHelper('notHost', function(options) {
        if(!Profile.isHost()) {
            return options.fn();
        }
    });

    Handlebars.registerHelper('isClient', function(options) {
        if(Profile.isClient()) {
            return options.fn();
        }
    });

    Handlebars.registerHelper('notClient', function(options) {
        if(!Profile.isClient()) {
            return options.fn();
        }
    });

}());
(function() {

    Handlebars.registerHelper('localize', function() {
        var str = Timeblocker.localize(arguments[0].replace(/\s$/, ''));

        if(arguments.length > 1) {
            for(var i = 1; i <= arguments.length; i++) {
                var x = arguments[i];

                str = str.replace('{{$'+(i-1)+'}}', x);
            }
        }

        return new Handlebars.SafeString(str);
    });

}());
(function() {

    Handlebars.registerHelper('not', function(value, options) {
    	return !value || value == 0 ? options.fn(value) : false;
    });

    Handlebars.registerHelper('undefined', function(value, options) {
    	return _.isUndefined(value) ? true : false;
    });

}());
(function() {

	function link(path, text, options) {
		var attrs = [];

		path = new Timeblocker.Path(path);

		attrs.push('href="'+path.string()+'"');

		_.each(options.hash, function(value, name) {
			attrs.push(name+'="'+value+'"');
		});

		return '<a '+attrs.join(' ')+'>'+text+'</a>';
	}

    Handlebars.registerHelper('path', function() {
        return new Timeblocker.Path(arguments).string();        
    });

    Handlebars.registerHelper('url', function() {
        if(arguments[0] && !_.isObject(arguments[0])) {
            return new Timeblocker.Path(arguments).url();
        }
        else {
            return arguments[0];
        }
    });

    Handlebars.registerHelper('image', function() {
        return new Timeblocker.Path(arguments).account();
    });

    Handlebars.registerHelper('link', function(url, text, options) {
    	if(_.isObject(text)) {
    		options = text;
    		text = options.fn ? options.fn(this) : '';
    	}

    	return new Handlebars.SafeString(link(url, text, options));
    });

}());
(function() {

    Handlebars.registerHelper('segment', function(segment) {
        return Timeblocker.Uri.segment(segment);
    });

}());


(function() {

    Handlebars.registerHelper('swapFieldNameWithLabel', function(value, subject) {
     	_.each(subject, function(obj) {
    		if(obj.name == value) {
    			value = obj.label;
    		}
    	});

    	return value;
    });

}());