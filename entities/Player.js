var Platformer = Platformer || {};

Platformer.Player = function(game_state, position, properties) {
    "use strict";
    Platformer.Prefab.call(this, game_state, position, properties);

    //this.animations.add("walking", [0, 1, 2, 1], 6, true);
    //this.frame = 3;
    //this.anchor.setTo(0.5);
};

Platformer.Player.prototype = Object.create(Platformer.Prefab.prototype);
Platformer.Player.prototype.constructor = Platformer.Player;

Platformer.Player.prototype.update = function() {
    "use strict";
};
