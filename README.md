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

... and much more! 

## How to Use

### Controlling your Puppet

- You can move your puppet around the stage using the left and right arrow keys
- You can change emotes by either pressing the emote buttons under the stage or their associated hotkey
- You can change puppets by either pressing the puppet buttons under the stage or their associated hotkey
- You can "babble" by holding down space
- Right clicking on a puppet button allows you to replace what puppet is stored in that hotbar slot

### The Editor

- Open allows you to select one of your existing puppets to edit them
- Save will save your current puppet. Changes will not appear in the stage until you save the puppet. Note this does NOT save the *project*, so closing the program will not preserve your changes
- New will allow you to create a new puppet from scratch (does not get added to your puppet list until saved)
- Duplicate creates a copy of your current puppet (does not get added to your puppet list until saved)
- Import allows you to select a puppet file from another project, and add it to your current project
- You can also click a puppet on the stage (even other players' puppets!) to open a copy of the puppet in the editor (does not get added to your puppet list until saved)
- The layers tab allows you to select which layer of the puppet you are editing
- The babble tab allows you to select which emotes the puppet can cycle through whilst babbling
- The settings tab is where you can rename the puppet, delete the puppet, and adjust its settings
	- The "Bobble head while talking" option decides whether or not the head, emotes, and hat layers bobble up and down while talking
- There is a plus and minus sign in the editor, that allows you to zoom in and out

### Puppet Layers

- Layers higher up on the layers tab will appear on top of lower layers
- Only one emote layer will be visible at a time
- Each emote actually has two sub-layers: the mouth and the eyes. You can toggle between the two in the layers tab
- Asset Bundles are actually collections of assets which can be on various layers, and are edited in their own special layer

### Assets

- You can add assets to a puppet by dragging (or clicking to pick up) an asset from the asset finder below the editor, and placing it in the editor
- Holding down shift while placing an asset allows you to add multiple copies of that asset
- There are different asset lists to help organize assets, as well as a search bar
- Right clicking an asset allows you to rename it, delete it, or move it to a different list
- You can create and rename asset lists, and import lists from other projects
- You can create asset bundles, which you edit like puppets, but can place onto puppets like an asset
	- They are useful for doing things like creating a standardized head or face or body, and then being able to place it on several different puppets
	- Editing an asset bundle will update any puppet that uses it
- Clicking an asset in the editor will allow you to select it
- Selected assets can be moved, scaled, and rotated
	- While scaling, holding shift scaled from the center instead of the corner, and holding control maintains the aspect ratio
	- While moving, holding control will make it only move on the horizontal axis, vertical axis, or at any 45° angle
	- While rotating, holding control will make it rotate in 45° increments
- You can cut, copy, paste, and delete selected assets using `control x`(`command` on mac), `control c`, `control v`, and `delete`, respectively

### Project

- Turning on the green screen replaces the background of the stage with a solid color, configurable in the project settings. This is to help replace the background with other content through video editing
- Project settings allows you to configure things that affect the project
	- Green screen color is the solid color that replaces the background when green screen is enabled. It's also the background color of the popout
	- Transparent popout means making the popout have a transparent background. It already doesn't have windows decorations, so this would make it so just the puppets are visible, the rest of the window would be completely transparent
	- Minimum slot width is a number (in pixels) where the stage will scale down if there isn't enough room for the current number of slots at the current minimum slot width
	- Number of slots is a number that represents how many slots there are for puppets to move between on the stage. This is the only setting that gets synced over the network
	- Server IP and Port are for networking
- The popout is a second window with just the stage on it. It'll still accept hotkey inputs like the main window, and can be used when you don't need to see the rest of the program
- Hosting server will allow other users to connect to you. This may require port forwarding or other complex things. Works with localhost and LAN IP addresses, generally without needing any additional configuration
- Connecting to a server allows you to join someone else's session. It uses the IP address listed in the project settings

### Debugging

If something goes wrong, you can click the status bar (the thing between the stage and the area with all the puppet and emote buttons) to open the console. Any errors should appear there, along with debug messages. When submitting a bug report you can post any relevant log entries there. 

## Feature Roadmap

- Installer
- Undo and redo actions in editor
- Configurable local AND global hotkeys
- Button to remove unused assets, stray files, etc.

## How to Contribute

First off, thanks for wanting to help! It means a lot, truly. There are two ways people can contribute to this project:

1. **Development**

	That means cloning the repo, going through the issue tracker, and implementing or fixing what needs to be implemented and fixed. This requires knowledge of javascript and node. You'll need to install node.js and the node package manager (npm), run `npm install` in the `src` directory to automatically download and install the rest of the dependencies, and run `npm start` to actually run the program. You can package it for release by running `npm run-script package`. 

2. **Make Puppets!**

	I'm no artist, and I realize this project needs art in order to succeed. I cannot thank you enough if you commit any art to the project. You can add new projects filled with (preferably consistent) puppets and assets in the `projects/` directory of the repo. If you can improve on the sample project, you can do that as well by modifying the project folder located at `src/sample-project/`. Please take care when modifying this project - its goal is to help new users, not overwhelm them. 

## Thanks

Thanks to Marionette Mates for originally collecting all the assets I've ported over. 

Thanks to Rob and the rest of the buffalo wizards for making so much amazing content, and particularly URealms Live for inspiring this project. 
