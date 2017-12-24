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
  // const uniqueKeys = Array.from(new Set(collection.map(item => item[key])));
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

  const promiseList = [];
  // get unique item list without blocking::
  uniqueKeys.forEach((itemKey) => {
    promiseList.push(method(itemKey));
  });
  const uniqueItemList = await Promise.all(promiseList);

  // organize them by key:
  const uniqueItemDict = {};
  for (let i = 0; i < uniqueKeys.length; i++) {
    uniqueItemDict[uniqueKeys[i]] = uniqueItemList[i];
  }

  // set the requested property field:
  collection.forEach((item) => {
    console.log('item')
    console.log('item')
    console.log('item')
    console.log(item)
    const curKey = item[key];
    let getProperty = () => get ? uniqueItemDict[curKey][get] : uniqueItemDict[curKey];
    let setProperty = () => {
      item[property] = getProperty();
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
