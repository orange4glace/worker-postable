function Postable(constructor: Function) {
  console.log('Decorate')
}

@Postable
export class Deco {

}

console.log('export')

export default new Deco()