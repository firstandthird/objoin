const async = require('async');

module.exports = (collection, schema, method, callback) => {
  // cache of id's that were previously seen:
  const key = schema.key;
  const property = schema.set;
  const cache = {};
  // if collection was just one item, just process and return it by itself:
  if (!Array.isArray(collection)) {
    return method(collection[key], (err, fetchedItem) => {
      if (err) {
        return callback(err);
      }
      collection[property] = fetchedItem;
      callback(err, collection);
    });
  }
  async.each(collection, (collectionItem, eachDone) => {
    // don't reprocess if it's cached:
    if (cache[collectionItem[key]]) {
      collectionItem[property] = cache[collectionItem[key]];
      return eachDone();
    }
    method(collectionItem[key], (err, fetchedItem) => {
      if (err) {
        return callback(err);
      }
      cache[collectionItem[key]] = fetchedItem;
      collectionItem[property] = fetchedItem;
      eachDone();
    });
  }, (err) => {
    callback(err, collection);
  });
};
