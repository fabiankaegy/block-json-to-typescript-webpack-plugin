# Block.json to TypeScript - Webpack Plugin

Automatically generate typings for block edit functions based on the content of the `block.json` file for any block.

## Usage

```js
// webpack.config.js
const path = require('path');
const BlockJsonToTypescriptWebpackPlugin = require('block-json-to-typescript-webpack-plugin');

module.exports = {
 plugins: [
  new BlockJsonToTypescriptWebpackPlugin({
   sourceDirectory: path.resolve(__dirname, 'includes/blocks/'),
   distDirectory: path.resolve(__dirname, 'dist/blocks/'),
  }),
 ]
}
```

With this added any `block.json` file located in the source folder will get an additional `types.d.ts` file added to its dist location with interfaces for the block attributes, context, and general properties passed into the blocks edit function.

```json
{
  "apiVersion": 3,
  "name": "namespace/example",
  "title": "Example Block",
  "attributes": {
    "title": {
      "type": "string"
    }
  },
  "supports": {
    "align": [
      "wide",
      "full"
    ],
  },
  "usesContext": [
    "postType",
    "postId"
  ],
}
```

turns to:

```ts
interface NamespaceExampleAttributes {
    readonly title: string;
    readonly style?: Record<string, any>;
    readonly align?: string;
}

interface NamespaceExampleContext {
    readonly postType: string;
    readonly postId: number;
}

interface NamespaceExampleProps {
    readonly name: string;
    readonly isSelected: boolean;
    readonly isSelectionEnabled: boolean;
    readonly clientId: string;
    readonly attributes: NamespaceExampleAttributes;
    readonly context: NamespaceExampleContext;
    setAttributes(attributes: Partial<NamespaceExampleAttributes>): void;
    insertBlocksAfter(block: any): void;
    mergeBlocks(blocks: Array<any>): void;
    onRemove(callback: any): void;
    onReplace(callback: any): void;
    toggleSelection(): void;
    [key: string]: any;
}
```

In order for these types to get picked up correctly, the `dist/blocks/` folder needs to get added to the `typeRoots` in the `tsconfig`.

```json
{
  "compilerOptions": {
    "typeRoots": [
      "node_modules/@types",
      "dist/blocks"
    ]
  }
}
```
