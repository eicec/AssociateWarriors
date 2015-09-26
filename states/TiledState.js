var Phaser = Phaser || {};
var Platformer = Platformer || {};

var style = { font: "32px Arial", fill: "#ff0044" };

Platformer.TiledState = function() {
    "use strict";
    Phaser.State.call(this);
};

Platformer.TiledState.prototype = Object.create(Phaser.State.prototype);
Platformer.TiledState.prototype.constructor = Platformer.TiledState;

Platformer.TiledState.prototype.findReachable = function(x, y, reach) {
    if (reach == 0) {
        return;
    }

    if (!this.reachable[y][x] || this.reachable[y][x] < reach) {
        this.reachable[y][x] = reach;
    }

    var wall;
    // NORTH
    if (y > 0 && this.state[y - 1][x] == -1) {
        wall = this.walls[y - 1][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y - 1, reach - 1);
        }
    }
    // EAST
    if (x < 15 && this.state[y][x + 1] == -1) {
        wall = this.walls[y][x + 1];
        if (wall != WALL_W && wall != WALL_SW) {
            this.findReachable(x + 1, y, reach - 1);
        }
    }
    // SOUTH
    if (y < 8 && this.state[y + 1][x] == -1) {
        wall = this.walls[y][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y + 1, reach - 1);
        }
    }
    // WEST
    if (x > 0 && this.state[y][x - 1] == -1) {
        wall = this.walls[y][x];
        if (wall != WALL_W && wall != WALL_SW) {
            this.findReachable(x - 1, y, reach - 1);
        }
    }
};

Platformer.TiledState.prototype.init = function(level_data) {
    "use strict";
    this.level_data = level_data;

    this.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    // create map and set tileset
    this.map = this.game.add.tilemap(level_data.map.key);
    this.map.addTilesetImage(this.map.tilesets[0].name, level_data.map.tileset);

    this.input.onDown.add(doSomething, this);

    this.player = 1;

    this.reachOverlays = [];
    function doSomething(pointer) {
        var x = Math.floor(pointer.x / this.map.tileWidth);
        var y = Math.floor(pointer.y / this.map.tileHeight);

        var state = this.state[y][x];
        if (!this.selected) {
            var character = CHARACTERS[state];
            if (character && character.player == this.player) {
                this.selected = character;
                this.reachable = [[], [], [], [], [], [], [], [], []];
                this.findReachable(x, y, character.reach);
                for (var y1 = 0; y1 < 9; y1++) {
                    for (var x1 = 0; x1 < 16; x1++) {
                        var reach = this.reachable[y1][x1];
                        if (reach) {
                            this.reachOverlays.push(this.add.text(x1 * this.map.tileWidth + 24, y1 * this.map.tileHeight + 16, reach, style));
                        }
                    }
                }
            }
        } else {
            var reachable = this.reachable[y][x];
            if (reachable) {
                alert(x + "," + y + "=" + reachable);
            }
            this.selected = null;
            this.reachOverlays.forEach(function(text) {
                this.world.remove(text)
            }, this);
        }
    }
};

Platformer.TiledState.prototype.create = function() {
    "use strict";
    // create groups
    this.groups = {};
    this.level_data.groups.forEach(function(group_name) {
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
            this.state = tiles;
        } else if (layer.name == 'walls') {
            this.walls = tiles;
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
            prefab = new Platformer.Player(this, position, { texture: CHARACTERS[object.index].name, group: "characters" });
            break;
        case P12:
        case P22:
            prefab = new Platformer.Player(this, position, { texture: CHARACTERS[object.index].name, group: "characters" });
            break;
        case P13:
        case P23:
            prefab = new Platformer.Player(this, position, { texture: CHARACTERS[object.index].name, group: "characters" });
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
