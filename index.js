const pprops = require('p-props');

module.exports = async(collection, schema, method) => {
  const key = schema.key;
  const property = schema.set;
  const get = schema.get;

  /// make sure collection is an array:
  if (!Array.isArray(collection)) {
    collection = [collection];
  }

  // get unique list of keys in the collection:
  // organize the unique items by key:
  const promiseObj = collection.reduce((accumulator, item) => {
    const entry = item[key];
    if (Array.isArray(entry)) {
      entry.forEach((curKey) => {
        if (!accumulator[curKey]) {
          try {
            accumulator[curKey] = method(curKey);
          } catch (e) {
            if (schema.fallback) {
              accumulator[curKey] = schema.fallback;
            } else {
              throw e;
            }
          }
        }
      });
    } else {
      if (!accumulator[entry]) {
        try {
          accumulator[entry] = method(entry);
        } catch (e) {
          if (schema.fallback) {
            accumulator[entry] = schema.fallback;
          } else {
            throw e;
          }
        }
      }
    }
    return accumulator;
  }, {});

  // get unique list of items needed by the collection:
  const uniqueItemDict = await pprops(promiseObj);

  // now set the requested property field using the fetched items:
  collection.forEach((item) => {
    const curKey = item[key];
    if (Array.isArray(curKey)) {
      const allValues = [];
      curKey.forEach((individualKey) => {
        allValues.push(get ? uniqueItemDict[individualKey][get] : uniqueItemDict[individualKey]);
      });
      item[property] = allValues;
    } else {
      item[property] = get ? uniqueItemDict[curKey][get] : uniqueItemDict[curKey];
    }
  });
  return collection;
};
