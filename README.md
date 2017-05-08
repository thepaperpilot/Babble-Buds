# Babble Buds

> This is an **ALPHA** release. It is not yet feature complete, and existing features are not thoroughly tested. 

Babble buds is a free, open source puppet show software. It is heavily based on the non-public software called "Puppet Pals", used in URealms Live. The software is written using electron and PIXI.js.

Users can create puppets with different faces for different emotions, and then use the puppet on a stage where you and other users can each make your respective puppets move, change emotions, and "babble" at each other. The stage has a green screen feature and can be popped out, which gives the users tons of possibilities in terms of using the program for a role playing live stream, faux video chatting with friends, game development, or whatever else you want! 

## Features

- Extensive puppet editor, with support for custom assets
- Ability to move, emote, and talk through your own personal puppet
- Ability to quickly swap between 9 different puppets (but of course you can have more than that, just not on the hotbar)
- Network support so you can have your puppet on a stage with other users' puppets
- Keep multiple project folders for better organization
- Run a standalone server and connect to it whenever
- Pop out the stage for better use in screen capturing
- Automatic asset syncing when connected to other users

... and much more! Check out the [tutorial](./tutorial.md) on how to use it.

## Feature Roadmap

- Installer
- Undo and redo actions in editor
- Configurable local AND global hotkeys
- Button to clean up project (remove unused assets, stray files, move any assets into their proper spots, etc.)
- Sorting assets and characters

## How to Contribute

First off, thanks for wanting to help! It means a lot, truly. There are two ways people can contribute to this project:

1. **Development**

	That means cloning the repo, going through the issue tracker, and implementing or fixing what needs to be implemented and fixed. This requires knowledge of javascript and node. You'll need to install node.js and the node package manager (npm), run `npm install` in the `src` directory to automatically download and install the rest of the dependencies, and run `npm start` to actually run the program. You can package it for release by running `npm run-script package`. 

2. **Make Puppets!**

	I'm no artist, and I realize this project needs art in order to succeed. I cannot thank you enough if you commit any art to the project. You can add new projects filled with (preferably consistent) puppets and assets in the `projects/` directory of the repo. If you can improve on the sample project, you can do that as well by modifying the project folder located at `src/sample-project/`. Please take care when modifying this project - its goal is to help new users, not overwhelm them. 

## Thanks

Thanks to Marionette Mates for originally collecting all the assets I've ported over. 

Thanks to Rob and the rest of the buffalo wizards for making so much amazing content, and particularly URealms Live for inspiring this project. 
