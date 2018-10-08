const pprops = require('p-props');

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
  const promiseObj = collection.reduce((accumulator, item) => {
    const entry = item[key];
    if (Array.isArray(entry)) {
      entry.forEach((curKey) => {
        if (!accumulator[curKey]) {
          if (schema.fallback) {
            accumulator[curKey] = schema.fallback;
          } else {
            accumulator[curKey] = null;
          }
        }
      });
    } else {
      if (!accumulator[entry]) {
        if (schema.fallback) {
          accumulator[entry] = schema.fallback;
        } else {
          accumulator[entry] = null;
        }
      }
    }
    return accumulator;
  }, {});

  // get unique list of items needed by the collection:
  const uniqueItemDict = await pprops(promiseObj, async (val, loopKey) => {
    let newVal = null;
    try {
      newVal = await method(loopKey);
    } catch (e) {
      if (val === null) {
        throw e;
      }

      return val;
    }

    return newVal;
  }, options);

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
