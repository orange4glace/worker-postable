function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
function sealed2(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

class Nothing{}

@sealed
class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}

@sealed2
class Greeter2 {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}

export {
  Greeter
}