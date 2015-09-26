var Phaser = Phaser || {};
var Platformer = Platformer || {};

Platformer.TiledState = function() {
    "use strict";
    Phaser.State.call(this);
};

Platformer.TiledState.prototype = Object.create(Phaser.State.prototype);
Platformer.TiledState.prototype.constructor = Platformer.TiledState;

Platformer.TiledState.prototype.init = function(level_data) {
    "use strict";
    this.level_data = level_data;

    this.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    // create map and set tileset
    this.map = this.game.add.tilemap(level_data.map.key);
    this.map.addTilesetImage(this.map.tilesets[0].name, level_data.map.tileset);
};

Platformer.TiledState.prototype.create = function() {
    "use strict";
    var group_name, object_layer, state, walls;

    // create groups
    this.groups = {};
    this.level_data.groups.forEach(function (group_name) {
        this.groups[group_name] = this.game.add.group();
    }, this);

    // create map layers
    this.layers = {};
    this.prefabs = {};
    this.map.layers.forEach(function(layer) {
        this.layers[layer.name] = this.map.createLayer(layer.name);
        var tiles = [];
        layer.data.forEach(function(data_row) { // find tiles used in the layer
            var row = [];
            data_row.forEach(function(tile) {
                row.push(tile.index);
                this.create_object(tile);
            }, this);
            tiles.push(row);
        }, this);
        //   this.map.setCollision(collision_tiles, true, layer.name);
        if (layer.name == 'objetos') { // collision layer
            state = tiles;
        } else if (layer.name == 'walls') {
            walls = tiles;
        }
    }, this);

    // resize the world to be the size of the current layer
    this.layers[this.map.layer.name].resizeWorld();
};

Platformer.TiledState.prototype.create_object = function(object) {
    "use strict";
    var position, prefab;
    // tiled coordinates starts in the bottom left corner
    position = { "x": object.x * this.map.tileHeight, "y": object.y * this.map.tileHeight };
    // create object according to its type
    switch (object.index) {
        case P11:
        case P21:
            prefab = new Platformer.Player(this, position, { texture: TEXTURES[object.index], group: "players" });
            break;
        case P12:
        case P22:
            prefab = new Platformer.Player(this, position, { texture: TEXTURES[object.index], group: "players" });
            break;
        case P13:
        case P23:
            prefab = new Platformer.Player(this, position, { texture: TEXTURES[object.index], group: "players" });
            break;
        case MONEY:
            prefab = new Platformer.Goal(this, position);
            break;
    }
    if (prefab) {
        this.prefabs[object.name] = prefab;
    }
};

Platformer.TiledState.prototype.restart_level = function() {
    "use strict";
    this.game.state.restart(true, false, this.level_data);
};
