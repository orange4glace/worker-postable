import { Postable, postable, ref, unref, context } from "../src/server/postable";
import Worker from 'worker-loader!./worker';

@Postable
class A {
  @postable color: string;
  @postable score: number = 5;

  name = 'name'
}

@Postable
class B {
  @postable name = 'sando';
  @postable grade = 5;

  speed = 37
}

@Postable
class C extends B {
  @postable wheel;
}

let worker = new Worker();
context.onMesssage = msg => {
  worker.postMessage(msg);
}

let a1 = new A();
let b1 = new B();
let c1 = new C();

ref(a1)
a1.name = 'skir'
a1.color = 'hello'
c1.wheel = [];
for (var i = 0; i < 0; i ++) c1.wheel.push(new B());
ref(c1)