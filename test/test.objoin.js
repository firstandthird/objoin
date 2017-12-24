'use strict';
const test = require('tap').test;
const objoin = require('../index.js');

test('objoin retrieves and adds record to each item in collection', async(t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' }
  };
  const fetchIt = (authorId) => users[authorId];
  const obj = await objoin(posts, { key: 'authorId', set: 'author' }, (authorId) => {
    //authorIds are just unique Ids, so you don't have to fetch the same id multiple times
    //in this case, it would get called with authorId id1 and id2 (the second id1 would not be called)
    //normally this would be some call to the db or ajax call
    return fetchIt(authorId);
  });
  t.equal(obj[0].authorId, 'id1');
  t.equal(obj[1].authorId, 'id2');
  t.equal(obj[2].authorId, 'id1');

  t.equal(obj[0].title, 'this is post 1');
  t.equal(obj[1].title, 'this is post 2');
  t.equal(obj[2].title, 'this is post 3');

  t.equal(obj[0].author.name, 'bob smith');
  t.equal(obj[1].author.name, 'jane brown');
  t.equal(obj[2].author.name, 'bob smith');
  t.end();
});

test('objoin uses caching to avoid re-fetching the same id twice', async(t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' }
  };
  let idCalls = 0;
  const obj = await objoin(posts, { key: 'authorId', set: 'author' }, (authorId) => {
    idCalls++;
    return users[authorId];
  });
  t.equal(idCalls, 2, 'id fetcher only runs for ids that are not already cached');
  t.end();
});

test('objoin can process one object as well as a list of objects', async(t) => {
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' }
  };
  const obj = await objoin({ authorId: 'id1', title: 'this is post 1' }, { key: 'authorId', set: 'author' }, (authorId) => {
    //authorIds are just unique Ids, so you don't have to fetch the same id multiple times
    //in this case, it would get called with authorId id1 and id2 (the second id1 would not be called)
    //normally this would be some call to the db or ajax call
    return users[authorId];
  });
  t.equal(obj[0].authorId, 'id1');
  t.equal(obj[0].title, 'this is post 1');
  t.equal(obj[0].author.name, 'bob smith');
  t.end();
});

test('"get" option retrieves and adds a specific field from a record to each item in collection', async(t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const users = {
    id1: { name: 'bob smith', occupation: 'cult leader' },
    id2: { name: 'jane brown', occupation: 'antiques curator' }
  };
  const fetchIt = (authorId) => users[authorId];
  const obj = await objoin(posts, { key: 'authorId', set: 'author', get: 'name' }, async(authorId) => {
    //authorIds are just unique Ids, so you don't have to fetch the same id multiple times
    //in this case, it would get called with authorId id1 and id2 (the second id1 would not be called)
    //normally this would be some call to the db or ajax call
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await wait(3000);
    return fetchIt(authorId);
  });
  t.equal(obj[0].authorId, 'id1');
  t.equal(obj[1].authorId, 'id2');
  t.equal(obj[2].authorId, 'id1');

  t.equal(obj[0].title, 'this is post 1');
  t.equal(obj[1].title, 'this is post 2');
  t.equal(obj[2].title, 'this is post 3');

  t.equal(obj[0].author, 'bob smith');
  t.equal(obj[1].author, 'jane brown');
  t.equal(obj[2].author, 'bob smith');
  t.end();
});

test('objoin retrieves and adds record to each item in collection when collection field is a list', async(t) => {
  const posts = [
    { authors: ['id1', 'id2'], title: 'this is post 1' },
    { authors: ['id1', 'id3'], title: 'this is post 2' },
  ];
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' },
    id3: { name: 'john doe' }
  };
  const fetchIt = (authorId) => users[authorId];
  const obj = await objoin(posts, { key: 'authors', set: 'authors', get: 'name' }, (authorId) => fetchIt(authorId));
  t.equal(obj[0].authors.length, 2);
  t.equal(obj[1].authors.length, 2);
  t.notEqual(obj[0].authors.indexOf('bob smith'), -1);
  t.notEqual(obj[1].authors.indexOf('bob smith'), -1);
  t.notEqual(obj[1].authors.indexOf('john doe'), -1);
  t.equal(obj[0].title, 'this is post 1');
  t.equal(obj[1].title, 'this is post 2');
  t.end();
});

test('objoin retrieves and adds record to a single item when collection field is a list', async(t) => {
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' },
    id3: { name: 'john doe' }
  };
  const fetchIt = (authorId) => users[authorId];
  const obj = await objoin({ authors: ['id1', 'id2'], title: 'this is post 1' }, { key: 'authors', set: 'authors', get: 'name' }, (authorId) => fetchIt(authorId));
  t.equal(obj[0].authors.length, 2);
  t.notEqual(obj[0].authors.indexOf('bob smith'), -1);
  t.notEqual(obj[0].authors.indexOf('jane brown'), -1);
  t.equal(obj[0].authors.indexOf('john doe') === -1, true);
  t.equal(obj[0].title, 'this is post 1');
  t.end();
});
