const async = require('async');

module.exports = async(collection, schema, method) => {
  const key = schema.key;
  const property = schema.set;
  const get = schema.get;

  /// make sure collection is an array:
  if (!Array.isArray(collection)) {
    collection = [collection];
  }

  // get unique list of keys in the collection:
  const uniqueKeys = collection.reduce((accumulator, item) => {
    const entry = item[key];
    if (Array.isArray(entry)) {
      entry.forEach((curKey) => {
        if (accumulator.indexOf(curKey) === -1) {
          accumulator.push(curKey);
        }
      });
    } else {
      if (accumulator.indexOf(entry) === -1) {
        accumulator.push(entry);
      }
    }
    return accumulator;
  }, []);

  // get unique list of items needed by the collection:
  const uniqueItemList = await Promise.all(uniqueKeys.map((itemKey) => method(itemKey)));

  // organize the unique items by key:
  const uniqueItemDict = {};
  uniqueKeys.forEach((itemKey, i) => {
    uniqueItemDict[itemKey] = uniqueItemList[i];
  });

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
