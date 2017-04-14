# Babble Buds

> This is an **ALPHA** release. It is not yet feature complete, and existing features are not thoroughly tested. 

Babble buds is a free, open source puppet show software. It is heavily based on the non-public software called "Puppet Pals", used in URealms Live. The software is written in electron and PIXI.js.

Users can create puppets with different faces for different emotions, and then use the puppet on a stage where you and other users can each make your respective puppets move, change emotions, and "babble" at each other. The stage has a green screen feature and can be popped out, which gives the users tons of possibilities in terms of using the program for a role playing live stream, faux video chatting with friends, game development, or whatever ellse you want! 

## Why not just use Marionette Mates?

You may have heard of a Puppet Pals clone called Marionette Mates. It was based off the first version of puppet pals, however, and therefore lacks many features, most noticeably a puppet editor. At the moment Marionette Mates has more puppets, but those can be ported over. Additionally, I believe my software has the following advantages over Marionette Mates:

- Native executables for each platform (Win, macOS, and Linux)
- Better performance
- Cleaner, more useful UI
- Integrated puppet editor
- The show panel can be popped out
- Much more customizations, each of which can be edited without needing to touch physical files
- No need to run a separate program to host a server
- Support for multiple project folders
- Ability to seamlessly connect to servers with characters and assets you don't have

... and many more. 

## Feature Roadmaps

### Roadmap to Beta

Features I'm hoping to add before creating a beta release:

- Installer
- Renaming, moving, and deleting assets
- Renaming and deleting asset lists
- Creating and importing asset lists
- Asset bundles (e.g. make a bundle for deadbones' head, and be able to add the whole head onto any puppet)
- Undo and redo actions in editor
- Configurable local AND global hotkeys
- Status indicators when connecting, downloading assets, etc.
- Button to remove unused assets, stray files, etc.

### Roadmap to 1.0

Further things to be done between beta and the 1.0 release:

- Test extensively, and fix any bugs found
- Convert rest of puppets available in Marionette Mates (without needing individual copies of files for each character)
- More information on how to use the program, using tool tips, written tutorials, and maybe video tutorials

### Further Development

After the 1.0 release I'm going to work on making plugins for popular game engines so game developers can use babble buds puppets to make more interesting dialogue scenes. It should be really useful to anyone looking at making a role playing game or visual novel. 

## How to Contribute

First off, thanks for wanting to help! It means a lot, truly. There are two ways people can contribute to this project:

1. **Development**

	That means cloning the repo, going through the issue tracker, and implementing or fixing what needs to be implemented and fixed. This requires knowledge of javascript and node. 

2. **Make Puppets!**

	I'm no artist, and I realize this project needs art in order to succeed. I cannot thank you enough if you commit any art to the project. If you're improving on the sample project, then replace the folder in `src/sample-project` with your project folder and commit your changes. Do note that the sample project should stick solely to the 5 characters already in there, and have only their associated assets. Any other characters or assets should go into a projects folder in  the `projects/` directory of the repo. Thanks!

	For converting marionette mates into babble buds assets, you can just import the images through the editor. But, that will give you large unused areas around the image. I'd recommend cropping them first (I use gimp's autocrop feature). You can crop the layer first and look at the boundaries to figure out where to place the image in the puppet as well: x should be `left+(right-left)/2-136` and y `300-(top+(top-bottom)/2)`. Eventually I hope to also have them all use the same mouth pieces, with different scalings and positions and stuff. 

## Thanks

Thanks to Marionette Mates for originally collecting all the assets I've ported over. 

Thanks to Rob and the rest of the buffalo wizards for making so much amazing content, and particularly URealms Live for inspiring this project. 
