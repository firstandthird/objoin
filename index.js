const async = require('async');

module.exports = (collection, schema, method, callback) => {
  // cache of id's that were previously seen:
  const key = schema.key;
  const property = schema.set;
  const cache = {};
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
