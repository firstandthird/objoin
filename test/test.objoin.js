'use strict';
const test = require('tap').test;
const objoin = require('../index.js');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  t.deepEqual(obj, [{ authorId: 'id1',
    title: 'this is post 1',
    author: { name: 'bob smith' } },
  { authorId: 'id2',
    title: 'this is post 2',
    author: { name: 'jane brown' } },
  { authorId: 'id1',
    title: 'this is post 3',
    author: { name: 'bob smith' } }
  ]);
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
  t.deepEqual(obj, [{ authorId: 'id1',
    title: 'this is post 1',
    author: { name: 'bob smith' } }
  ]);
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
    await wait(3000);
    return fetchIt(authorId);
  });
  t.deepEqual(obj, [{ authorId: 'id1', title: 'this is post 1', author: 'bob smith' },
    { authorId: 'id2', title: 'this is post 2', author: 'jane brown' },
    { authorId: 'id1', title: 'this is post 3', author: 'bob smith' }
  ]);
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
  t.deepEqual(obj, [{ authors: ['bob smith', 'jane brown'], title: 'this is post 1' },
    { authors: ['bob smith', 'john doe'], title: 'this is post 2' }]);
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
  t.deepEqual(obj, [{ authors: ['bob smith', 'jane brown' ],
    title: 'this is post 1' }
  ]);
  t.end();
});
