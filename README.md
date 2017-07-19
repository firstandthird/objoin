# objoin
Join two objects together

## Usage

```javascript
const posts = [
  { authorId: 'id1', title: 'this is post 1' },
  { authorId: 'id2', title: 'this is post 2' },
  { authorId: 'id1', title: 'this is post 3' }
]

const users = {
  id1: { name: 'bob smith' },
  id2: { name: 'jane brown' }
}

objoin(posts, { key: 'authorId', set: 'author' }, (authorId, next) => {
  //authorIds are just unique Ids, so you don't have to fetch the same id multiple times
  //in this case, it would get called with authorId id1 and id2 (the second id1 would not be called)
  //normally this would be some call to the db or ajax call
  next(null, users[authorId]);
}, (err, obj) => {
  obj == [
    { authorId: 'id1', author: { name: 'bob smith' }, title: 'this is post 1' },
    { authorId: 'id2', author: { name: 'jane brown' }, title: 'this is post 2' },
    { authorId: 'id1', author: { name: 'bob smith' }, title: 'this is post 3' }
  ]
})
```
