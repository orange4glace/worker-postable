import { ConstructorStore, postableMessageHandler } from '../src/client/client'

import { IA, IB, IC } from './worker-postable-generated'

class A implements IA {
  color: string;
  score: number;
}

class B implements IB {
  name;
  grade;
}

class C extends B implements IC {
  wheel;
}

ConstructorStore.set('A', A)
ConstructorStore.set('B', A)
ConstructorStore.set('C', A)

self.onmessage = msg => {
  console.log(msg.data);
  postableMessageHandler(msg)
}