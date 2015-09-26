var Phaser = Phaser || {};
var Platformer = Platformer || {};

Platformer.BootState = function() {
    "use strict";
    Phaser.State.call(this);
};

Platformer.prototype = Object.create(Phaser.State.prototype);
Platformer.prototype.constructor = Platformer.BootState;

Platformer.BootState.prototype.init = function() {
    "use strict";
    this.level_files = ["assets/level_data.json"];
};

Platformer.BootState.prototype.preload = function() {
    "use strict";
    this.load.text("level_data", this.level_files[0]);
};

Platformer.BootState.prototype.create = function() {
    "use strict";
    var level_text, level_data;
    level_text = this.game.cache.getText("level_data");
    level_data = JSON.parse(level_text);
    this.game.state.start("LoadingState", true, false, level_data);
};
