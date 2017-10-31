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

  // apply single or multiple method to a collection item:
  const apply = (collectionItem, applyDone) => {
    if (!Array.isArray(collectionItem[key])) {
      return applySingleMethod(collectionItem, applyDone);
    }
    // if the collection item is a list of multiple items:
    return applyMultipleMethod(collectionItem, applyDone);
  };

  const handleCallback = (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, collection);
  };

  // if collection was just one item, just process and return it by itself:
  if (!Array.isArray(collection)) {
    return apply(collection, handleCallback);
  }

  // otherwise, if collection is multiple items, first
  // synchronously cache one item for each unique identifier:
  const keyList = [];
  const processedItems = [];
  async.eachSeries(collection, (collectionItem, eachDone) => {
    const identifier = collectionItem[key];
    if (keyList.indexOf(identifier) === -1) {
      keyList.push(identifier);
      processedItems.push(collectionItem);
      return apply(collectionItem, eachDone);
    }
    eachDone();
  }, (err) => {
    if (err) {
      return callback(err);
    }
    // then remaining items can be populated asynchronously:
    async.each(collection, (collectionItem, eachIdentifier) => {
      // skip previously-processed items:
      if (processedItems.indexOf(collectionItem) !== -1) {
        return eachIdentifier();
      }
      apply(collectionItem, eachIdentifier);
    }, handleCallback);
  });
};
