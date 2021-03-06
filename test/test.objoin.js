'use strict';
const test = require('tap').test;
const objoin = require('../index.js');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const rint = (l, u) => Math.random() * (u - l) + l;

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
  const obj = await objoin(posts, { key: 'authorId', set: 'author' }, (authorId) => fetchIt(authorId));
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
  await objoin(posts, { key: 'authorId', set: 'author' }, async (authorId) => {
    idCalls++;
    await wait(100);
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
  const obj = await objoin({ authorId: 'id1', title: 'this is post 1' }, { key: 'authorId', set: 'author' }, (authorId) => users[authorId]);
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
  t.deepEqual(obj, [{ authors: ['bob smith', 'jane brown'],
    title: 'this is post 1' }
  ]);
  t.end();
});

test('objoin takes a fallback method to handle errors in the method promise', async(t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const posts2 = [
    { authors: ['id1', 'id2'], title: 'this is post 1' },
    { authors: ['id1', 'id3'], title: 'this is post 2' },
  ];

  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' }
  };
  const fetchIt = (authorId) => {
    if (authorId === 'id2') {
      throw new Error('some error');
    }
    return users[authorId];
  };
  const fallback = { name: 'clarence smith' };
  const obj = await objoin(posts, { key: 'authorId', set: 'author', fallback }, (authorId) => fetchIt(authorId));
  t.deepEqual(obj, [{ authorId: 'id1',
    title: 'this is post 1',
    author: { name: 'bob smith' } },
  { authorId: 'id2',
    title: 'this is post 2',
    author: { name: 'clarence smith' } },
  { authorId: 'id1',
    title: 'this is post 3',
    author: { name: 'bob smith' } }]);

  const obj2 = await objoin(posts2, { key: 'authors', set: 'author', get: 'name', fallback }, (authorId) => {
    throw new Error('an error');
  });
  t.deepEqual(obj2, [
    {
      authors: ['id1', 'id2'],
      title: 'this is post 1',
      author: ['clarence smith', 'clarence smith']
    },
    {
      authors: ['id1', 'id3'],
      title: 'this is post 2',
      author: ['clarence smith', 'clarence smith']
    }
  ]);
  const obj3 = await objoin({ authorId: 'id1', title: 'this is post 1' }, { key: 'authorId', set: 'author', fallback }, (authorId) => {
    throw new Error('no way no way');
  });
  t.deepEqual(obj3, [{ authorId: 'id1',
    title: 'this is post 1',
    author: { name: 'clarence smith' } }
  ]);
  t.end();
});

test('objoin throws errors if method promise fails', async(t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const posts2 = [
    { authors: ['id1', 'id2'], title: 'this is post 1' },
    { authors: ['id1', 'id3'], title: 'this is post 2' },
  ];

  let errCount = 0;
  // handle when entries are not lists:
  try {
    await objoin(posts, { key: 'authorId', set: 'author' }, (authorId) => {
      throw new Error('hey hey you you');
    });
    t.fail();
  } catch (e) {
    errCount++;
  }
  // handle when each entry in post is a list
  try {
    await objoin(posts2, { key: 'authors', set: 'author', get: 'name' }, (authorId) => {
      throw new Error('i dont like your girlfriend');
    });
    t.fail();
  } catch (e) {
    errCount++;
  }
  // handle for singular:
  try {
    await objoin({ authorId: 'id1', title: 'this is post 1' }, { key: 'authorId', set: 'author' }, (authorId) => {
      throw new Error('no way no way');
    });
    t.fail();
  } catch (e) {
    errCount++;
    t.equal(errCount, 3, 'throws all expected errors');
    t.end();
  }
});

test('passing concurrency limits number of promises', async (t) => {
  let running = 0;
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id9', title: 'this is post 3' },
    { authorId: 'id4', title: 'this is post 4' },
    { authorId: 'id8', title: 'this is post 4' },
    { authorId: 'id3', title: 'this is post 4' },
    { authorId: 'id6', title: 'this is post 4' },
    { authorId: 'id5', title: 'this is post 4' }
  ];

  try {
    await objoin(posts, { key: 'authorId', set: 'author' }, async (authId) => {
      running++;
      t.true(running <= 3);
      await wait(rint(40, 50));
      running--;
      return `Mister Beauchamp ${authId}`;
    }, { concurrency: 3 });
    await wait(5);
  } catch (e) {
    t.fail();
  }
  t.end();
});
