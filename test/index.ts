import { Postable, postable, context, ref } from './../src/server/postable'
import Worker from 'worker-loader!./worker'

let worker = new Worker();

context.onMessage = e => {
  console.log(e)
  worker.postMessage(e)
}

@Postable
class A {
  @postable a;
}

let a = new A();

ref(a);

a.a = new Set();

console.log(a)

a.a.add(53);
a.a.add(54);
a.a.add(55);
a.a.add(56);