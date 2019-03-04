import { Postable, postable, registerWorker } from './../index'
import MyWorker from 'worker-loader!./worker'

var worker = new MyWorker();
registerWorker(worker);

@Postable
class A{
  @postable observ: any = 7;

  constructor() {
  }
}

var a = new A();
var b = new A();
a.observ = b;
b.observ = 8;