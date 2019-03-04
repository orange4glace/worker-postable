import {  
  ConstructorStore,
  ObjectStore,
  postableMessageHandler } from '../index'

class A {
  observ;
}

ConstructorStore.set('A', A)

self.onmessage = postableMessageHandler;

console.log('hi worker')

console.log(ObjectStore);