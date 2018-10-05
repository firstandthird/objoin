const pMap = require('p-map');

module.exports = async(collection, schema, method, options) => {
  const key = schema.key;
  const property = schema.set;
  const get = schema.get;

  /// make sure collection is an array:
  if (!Array.isArray(collection)) {
    collection = [collection];
  }

  // get unique list of keys in the collection:
  // organize the unique items by key:
  const promiseObj = {};
  await pMap(collection, async (item) => {
    const entry = item[key];
    if (Array.isArray(entry)) {
      await pMap(entry, async (child) => {
        if (!promiseObj[child]) {
          try {
            promiseObj[child] = await method(child);
          } catch (e) {
            if (schema.fallback) {
              promiseObj[child] = schema.fallback;
            } else {
              throw e;
            }
          }
        }
      });
    } else {
      if (!promiseObj[entry]) {
        try {
          promiseObj[entry] = await method(entry);
        } catch (e) {
          if (schema.fallback) {
            promiseObj[entry] = schema.fallback;
          } else {
            throw e;
          }
        }
      }
    }
  }, options);

  // now set the requested property field using the fetched items:
  collection.forEach((item) => {
    const curKey = item[key];
    if (Array.isArray(curKey)) {
      const allValues = [];
      curKey.forEach((individualKey) => {
        allValues.push(get ? promiseObj[individualKey][get] : promiseObj[individualKey]);
      });
      item[property] = allValues;
    } else {
      item[property] = get ? promiseObj[curKey][get] : promiseObj[curKey];
    }
  });
  return collection;
};
