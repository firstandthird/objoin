'use strict';
const test = require('tap').test;
const objoin = require('../index.js');

test('objoin retrieves and adds record to each item in collection', (t) => {
  const posts = [
    { authorId: 'id1', title: 'this is post 1' },
    { authorId: 'id2', title: 'this is post 2' },
    { authorId: 'id1', title: 'this is post 3' }
  ];
  const users = {
    id1: { name: 'bob smith' },
    id2: { name: 'jane brown' }
  };
  objoin(posts, { key: 'authorId', set: 'author' }, (authorId, next) => {
    //authorIds are just unique Ids, so you don't have to fetch the same id multiple times
    //in this case, it would get called with authorId id1 and id2 (the second id1 would not be called)
    //normally this would be some call to the db or ajax call
    next(null, users[authorId]);
  }, (err, obj) => {
    t.equal(err, null);
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
});

test('objoin uses caching to avoid re-fetching the same id twice', (t) => {
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
  objoin(posts, { key: 'authorId', set: 'author' }, (authorId, next) => {
    idCalls++;
    next(null, users[authorId]);
  }, (err, obj) => {
    t.equal(err, null);
    t.equal(idCalls, 2);
    t.end();
  });
});
