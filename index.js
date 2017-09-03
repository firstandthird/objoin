const async = require('async');

module.exports = (collection, schema, method, callback) => {
  // cache of id's that were previously seen:
  const key = schema.key;
  const property = schema.set;
  const get = schema.get;
  const cache = {};
  // assigns either a specific field or the whole object:
  const assign = (destination, source) => {
    if (get) {
      destination[property] = source[get];
    } else {
      destination[property] = source;
    }
  };
  // if collection was just one item, just process and return it by itself:
  if (!Array.isArray(collection)) {
    return method(collection[key], (err, fetchedItem) => {
      if (err) {
        return callback(err);
      }
      assign(collection, fetchedItem);
      callback(err, collection);
    });
  }
  async.each(collection, (collectionItem, eachDone) => {
    // don't reprocess if it's cached:
    if (cache[collectionItem[key]]) {
      assign(collectionItem, cache[collectionItem[key]]);
      return eachDone();
    }
    method(collectionItem[key], (err, fetchedItem) => {
      if (err) {
        return callback(err);
      }
      cache[collectionItem[key]] = fetchedItem;
      assign(collectionItem, fetchedItem);
      eachDone();
    });
  }, (err) => {
    callback(err, collection);
  });
};
