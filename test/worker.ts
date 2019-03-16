import { Posted, listen, ConstructorStore, postableMessageHandler, ObjectStore, listenable } from '../src/client/client'
import a from './retest';

@Posted('A')
class A {
  @listenable a;

  constructor() {
    listen(this, (change: any) => {
      console.log(change)
      if (change.type == 'update' && change.name == 'a') {
        let os = change.newValue;
        listen(os, change => console.log(change))
      }
    });
  }
}

self.onmessage = e => {
  console.log(e.data);
  postableMessageHandler(e.data);
}

console.log(ObjectStore);