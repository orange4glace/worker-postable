# Worker-Postable

worker-postable automatically clone Main thread data to WebWorker thread.

It depends on [mobx](https://github.com/mobxjs/mobx).

## Example (Typescript)

Main thread code
```typescript
import { PostableContext, Postable, postable, ref, getPostableID }

// Register |sendMessage|
PostableContext.onMessage = msg => worker.postMessage({
  type: 'post',
  data: msg
});

@Postable
class Vector2 {
  // @postable is also @observable.
  @postable x: number;
  @postable y: number;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

@Postable
class Vector2Array {
  @postable arr: Vector2[];

  constructor() {
    this.arr = [];
  }
}

let data = new Vector2Array();
vec.arr.push(new Vector2(3, 5));
vec.arr.push(new Vector2(10, 2));

// Reference object by worker-postable so it can be posted to worker thread
// |Vector2| data in |vec.arr| is also posted because |vec.arr| is also @postable and its ref count is 1. (eg: ref count of |data| is 1)
ref(data);

// Post more data
vec.arr.push(new Vector2(10, 2));

// Old |vec.arr| will be unreferenced and will be deleted from worker thread.
// Also new |vec.arr| is referenced and will be created from worker thread.
vec.arr = [];

// Get Postable id of the object
let dataPostableID = getPostableID(data);
worker.postMessage({
  type: 'id',
  data: dataPostableID
})

// Unref data. data on worker thread side will be cleaned up since ref count of |data| is now 0.
unref(data);
```


Worker thread code
```typescript
import { postableMessageHandler, ObjectStore, listen, PostableEventListener } from 'worker-postable'

@Posted('Vector2')
class Vector2Posted implements PostableEventListener {
  x: number;
  y: number;

  // Called when instance is created
  __onPostableInstanceCreated() {
    console.log('Vector2Posted created', this);
  }
}

@Posted('Vector2Array')
class Vector2ArrayPosted {
  // Post event is listenable by annotating |@listenable|
  @listenable arr: Vector2Posted[];

  constructor() {
    this.listenArr = this.listenArr.bind(this);
    // it is basically from mobx (https://mobx.js.org/refguide/observe.html)
    listen(this, (change: any) => {
      if ((change.type == 'add' ||  change.type == 'update')
          && change.name == 'arr')
        this.listenArr(change.newValue);
    })
  }

  private listenArr(arr: Vector2Posted[]) {
    listen(arr, change => {
      console.log(change);
    })
  }
}

self.onmessage = (e: any) => {
  if (e.type == 'posted') // Handle worker-postable message
    postableMessageHandler(e.data);
  else if (e.type == 'id') {
    let dataID = e.data;
    
    // Get object from ObjectStore
    let vec: Vector2Posted = ObjectStore.get(dataID);

    console.log('vector', vec);
  }
}
```

worker-postable post and update object **if** the object is referenced by worker-postable at least once.

When ref count of object becomes 0, worker thread will remove its posted object from ObjectStore and will be garbage collected.