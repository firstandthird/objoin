const async = require('async');

module.exports = (collection, schema, method, callback) => {
  const key = schema.key;
  const property = schema.set;
  const get = schema.get;
  const cache = {};

  // assigns either a specific field or the whole object:
  // for either an array or a field:
  const assign = (destination, source) => {
    const element = get ? source[get] : source;
    if (Array.isArray(destination)) {
      destination.push(element);
    } else {
      destination[property] = element;
    }
  };

  // applies the fetch method one time to one item:
  const applySingleMethod = (collectionItem, done) => {
    if (cache[collectionItem[key]]) {
      assign(collectionItem, cache[collectionItem[key]]);
      return done();
    }
    return method(collectionItem[key], (err, fetchedItem) => {
      if (err) {
        return done(err);
      }
      cache[collectionItem[key]] = fetchedItem;
      assign(collectionItem, fetchedItem);
      done();
    });
  };

  // applies the fetch method one time each to an array of items:
  const applyMultipleMethod = (collectionItem, done) => {
    const allFetchedItems = [];
    async.eachSeries(collectionItem[key], (listItem, eachDone) => {
      if (cache[listItem]) {
        assign(allFetchedItems, cache[listItem]);
        return eachDone();
      }
      method(listItem, (err, fetchedItem) => {
        if (err) {
          return done(err);
        }
        cache[listItem] = fetchedItem;
        assign(allFetchedItems, fetchedItem);
        eachDone();
      });
    }, (err) => {
      if (err) {
        return done(err);
      }
      collectionItem[property] = allFetchedItems;
      return done();
    });
  };

  const handleCallback = (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, collection);
  };

  // if collection was just one item, just process and return it by itself:
  if (!Array.isArray(collection)) {
    if (!Array.isArray(collection[key])) {
      return applySingleMethod(collection, handleCallback);
    }
    // the collection's field is an array of items to fetch here:
    return applyMultipleMethod(collection, handleCallback);
  }

  // otherwise, if collection is multiple items:
  return async.eachSeries(collection, (collectionItem, eachDone) => {
    // if each field of the collection item is one item:
    if (!Array.isArray(collectionItem[key])) {
      return applySingleMethod(collectionItem, eachDone);
    }
    // if the collection item is a list of multiple items:
    return applyMultipleMethod(collectionItem, eachDone);
  }, handleCallback);
};
