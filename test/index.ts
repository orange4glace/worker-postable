import { Postable, postable, ref, unref } from "../src/server/postable";
import { autorun } from "./mobx/mobx";

@Postable
class A {
  @postable value;
}

let a = new A();
let b = new A();
let c = new A();
let set = new Set()
set.add(b);
set.add(5);
a.value = set;

ref(a);

console.log(a);

a.value.add(5);
a.value.add(6);
a.value.add(c);

unref(a);

a.value = 7;