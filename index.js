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
  const set = new Set();
  collection.forEach((item) => {
    if (Array.isArray(item[key])) {
      item[key].forEach((curKey) => {
        set.add(curKey);
      });
    } else {
      set.add(item[key]);
    }
  });
  const uniqueKeys = Array.from(set);

  // get unique list of items needed by the collection:
  const promiseList = [];
  uniqueKeys.forEach((itemKey) => {
    promiseList.push(method(itemKey));
  });
  const uniqueItemList = await Promise.all(promiseList);

  // organize the unique items by key:
  const uniqueItemDict = {};
  for (let i = 0; i < uniqueKeys.length; i++) {
    uniqueItemDict[uniqueKeys[i]] = uniqueItemList[i];
  }

  // now set the requested property field using the fetched items:
  collection.forEach((item) => {
    const curKey = item[key];
    let setProperty = () => {
      item[property] = get ? uniqueItemDict[curKey][get] : uniqueItemDict[curKey];
    };
    if (Array.isArray(curKey)) {
      setProperty = () => {
        const allValues = [];
        curKey.forEach((individualKey) => {
          allValues.push(get ? uniqueItemDict[individualKey][get] : uniqueItemDict[individualKey]);
        });
        item[property] = allValues;
      };
    }
    setProperty();
  });
  return collection;
};
