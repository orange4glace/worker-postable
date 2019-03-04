console.log('test')
// this example will create a simple typescript source file programmatically, parse it to AST Nodes and then 
// use TypeScript Transformations to manipulate some ot its nodes (changing  particular arithmetic expressions). 
// Finally , the transformed AST will be printed back to another source file as a string

// (Note: I've taken this example from somewhere else some credits are not mine - but since there's limited typescript 
// documentation I think is a good idea to duplicate this... )

import * as ts from 'typescript'
import { readFileSync } from 'fs';
console.log(__dirname);

function main(source: string, log: (msg: string) => void): string {

  const sourceFile: ts.SourceFile = ts.createSourceFile(
    __dirname + '\\source.ts', readFileSync(__dirname + '/source.ts').toString(), ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
  )

  generate(sourceFile);
  const printer: ts.Printer = ts.createPrinter()
  console.log(printer.printNode(ts.EmitHint.Unspecified, classes[1], null))

  /*
  // Apply transformation to the sourcefile 
  const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(
    sourceFile, [transformer]
  )

  // obtain the transformed source file
  const transformedSourceFile: ts.SourceFile = result.transformed[0]
  const printer: ts.Printer = ts.createPrinter()
  const transformedContent = printer.printFile(transformedSourceFile)

  log('Original file:\\n' + printer.printFile(sourceFile) + 'Transformed file:\\n' + transformedContent)

  result.dispose()
  return transformedContent
  */
  return ''
}

let classes: Array<ts.ClassDeclaration> = [];

function generate(node: ts.Node): void {
  if (ts.isClassDeclaration(node)) return visitClassDeclaration(node);
  ts.forEachChild(node, generate);
}

function visitClassDeclaration(node: ts.ClassDeclaration): void {
  let properties: Array<ts.PropertyDeclaration> = [];
  ts.forEachChild(node, cbNode => {
    if (ts.isPropertyDeclaration(cbNode)) {
      properties.push(visitPropertyDeclaration(cbNode));
    }
  });
  console.log(properties.length)
  classes.push(ts.createClassDeclaration(null, null, 'ab', null, null, properties));
}

function visitPropertyDeclaration(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
  return ts.createProperty(null, null, node.name.getText(), node.questionToken, node.type, null);
}


const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
  let postableClass = false;
  let onClassDeclaration = false;
  let onPropertyDeclaration = false;

  function visit(node: ts.Node): ts.Node {
    if (ts.isClassDeclaration(node)) return visitClassDeclaration(node);
    ts.visitEachChild(node, visit, context);
    return node;
  }

  function visitDecorator(node: ts.Node): ts.Node {
    console.log('@Decorator',node.decorators);
    return node;
  }

  function visitClassDeclaration(node: ts.Node): ts.Node {
    console.log('class decl', node.getText())
    ts.forEachChild(node, cbNode => {
      console.log('class decl', cbNode.kind)
      if (ts.isPropertyDeclaration(cbNode)) {
        console.log('prop', cbNode.getText())
      }
    });
    ts.visitEachChild(node, visit, context);
    return ts.createClassDeclaration(null, null, 'ab', null, null, []);
    return node;
  }

  function visitPropertyDeclaration(node: ts.Node): ts.Node {
    return null;
  }

  return ts.visitNode(rootNode, visit)
}

main(null, console.log)