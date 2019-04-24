import { Postable, postable, context, ref } from './../src/server/postable'

export interface Cloneable {
  clone(obj: Object): Object;
}

export function clone<T>(original: Cloneable): T {
  let clone = Object.create(original.constructor.prototype) as T;
  original.clone(clone);
  return clone;
}

@Postable
class A implements Cloneable {
  @postable a;

  clone(obj: A): Object {
    obj.a = this.a;
    return obj;
  }
}

@Postable
class B extends A {
  @postable c: C[];

  constructor() {
    super();
    this.c = [];
  }

  clone(obj: B): Object {
    super.clone(obj);
    obj.c = [];
    this.c.forEach(cc => obj.c.push(clone(cc)))
    return obj;
  }

}

@Postable
class C implements Cloneable {
  @postable val: number;
  constructor(val: number) {
    this.val = val;
  }

  clone(obj: C): Object {
    obj.val = this.val;
    return obj;
  }
}

let c = new C(35);
let b = new B();
b.c.push(c);
ref(b);

let clone_b = clone<B>(b);
console.log(c);
console.log(b);
console.log(clone_b);

console.log(b.c == clone_b.c)

ref(clone_b);
console.log(clone_b);