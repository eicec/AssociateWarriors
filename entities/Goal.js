var Platformer = Platformer || {};
var coinN = 1;

Platformer.Goal = function(game_state, position, properties) {
    "use strict";
    properties = properties || {};
    properties.texture = 'coin' + (coinN++);
    properties.group = 'goals';
    Platformer.Prefab.call(this, game_state, position, properties);

    this.pivot.set(32, 32);
};

Platformer.Goal.prototype = Object.create(Platformer.Prefab.prototype);
Platformer.Goal.prototype.constructor = Platformer.Goal;

Platformer.Goal.prototype.update = function() {
    "use strict";
};

