var Phaser = Phaser || {};
var Platformer = Platformer || {};

Platformer.MainScreenState = function() {
    "use strict";
    Phaser.State.call(this);
};

Platformer.prototype = Object.create(Phaser.State.prototype);
Platformer.prototype.constructor = Platformer.MainScreenState;

Platformer.MainScreenState.prototype.init = function(level_data) {
    "use strict";

    this.level_data = level_data;

    this.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

}

Platformer.MainScreenState.prototype.preload = function() {
    "use strict";

	this.mainbg = game.add.sprite(0, 0, 'mainbg');
	
    this.logo = game.add.sprite(240, 20, 'logo');
	this.logo.scale.setTo(0.7, 0.7);

    this.play = game.add.sprite(410, 470, 'play');

    this.play.scale.setTo(0.3, 0.3);
    this.play.inputEnabled = true;

}

Platformer.MainScreenState.prototype.create = function() {
    "use strict";

    this.play.events.onInputDown.add(function() {
        this.game.state.start("GameState", true, false, this.level_data);
    }, this);

}