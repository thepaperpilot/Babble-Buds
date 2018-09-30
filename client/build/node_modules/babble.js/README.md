# babble.js

babble.js is a library for creating and manipulating virtual puppets

## Installation

**Using Node**

Run this command to install babble.js

```
npm install babble.js --save
```

and then use it in your code like so:

```
const babble = require('babble.js')
```

**Client Side**

Download the file at `dist/babble.js` and load it in your page somewhere (using the correct path to wherever you've placed the file)

```
<script src="js/babble.js"></script>
```

and then use it in your code using the global `babble` object.

## How To Use

Here's an example usage of the program:

```
var stage = new babble.Stage('stage', {
	numCharacters: 5,
	assets: assetLists
}, assets, assetsPath)

stage.addPuppet(puppet, 1)

stage.getPuppet(1).jiggle()
```

Also available are docs over each of the program's classes:

- [Stage](./docs/stage.md)
- [Puppet](./docs/puppet.md)
- [Cutscene](./docs/cutscene.md)

Creating puppets can be made significantly easier by using [Babble Buds](https://github.com/thepaperpilot/Babble-Buds), which contains a puppet editor, and using the JSON files in the projects' "characters" folder
