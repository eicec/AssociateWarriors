var Phaser = Phaser || {};
var Platformer = Platformer || {};

var game = new Phaser.Game(1024, 576, Phaser.AUTO);

game.state.add("BootState", new Platformer.BootState());
game.state.add("LoadingState", new Platformer.LoadingState());
game.state.add("MainScreenState", new Platformer.MainScreenState());
game.state.add("GameState", new Platformer.TiledState());

game.state.start("BootState", true, false);

