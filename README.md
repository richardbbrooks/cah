#Cards Against Humanity Online#

Yet another shit attempt at putting this fun game online.

This is extremely rough and does not work at all right now. There is some vestigial code and I'm expecting some decent refactoring in the future. 

The functionality that exists right now is going to //server/game/[whatever] to make a game room and associate that room with your session. From there, the SIO commands you issue are performed against that game instance.

Depends on node, redis, express, socket.io, handlebars, and underscore.

Known Bugs:

* draw*Card uses the same DB key

* Going to a game room resets the game room (this should be factored out into a reset command - perhaps requiring some consensus of others in the room)

So yeah, this is a hot mess. Sorry.
