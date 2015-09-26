var Phaser = Phaser || {};
var Platformer = Platformer || {};

var style = { font: "32px Arial", fill: "#ff0044" };

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

    this.ws = new WebSocket("ws://localhost:8080/");
    this.ws.onmessage = this.onMessage.bind(this);

    this.player = 0;
    this.actionController = 0;

    this.input.onDown.add(this.processInput, this);

    this.paths = {};
    this.visiblePaths = {};
    this.reachOverlays = [];
    this.message = null;
    this.playerText = null;
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
        this.layers[layer.name] = this.map.createLayer(layer.name, undefined, undefined, this.groups["layers"]);
        var tiles = [];
        layer.data.forEach(function(data_row) { // find tiles used in the layer
            var row = [];
            data_row.forEach(function(tile) {
                row.push(tile.index);
                this.create_object(tile);
            }, this);
            tiles.push(row);
        }, this);

        if (layer.name == 'objetos') {
            this.state = tiles;
            this.layers[layer.name].alpha = 0.2; // FIXME: visible = false
        } else if (layer.name == 'walls') {
            this.walls = tiles;
        }
    }, this);

    // create go button
    this.add.button(940, 30, 'go', function() {
        console.log("Paths: " + this.paths.toString());
        console.log(this.player);
        this.send({ type: "MOVE", move: this.paths });
        Object.keys(this.visiblePaths).forEach(function(key) {
            this.world.remove(this.visiblePaths[key])
        }, this);
        this.paths = {};
        this.visiblePaths = {};
        this.showMessage(WAITING_OTHER_PLAYER);
    }, this, 1, 2);

    this.showMessage(CONNECTING);

    // resize the world to be the size of the current layer
    this.layers[this.map.layer.name].resizeWorld();
};

Platformer.TiledState.prototype.create_object = function(object) {
    "use strict";
    var position, prefab;
    position = { "x": object.x * this.map.tileHeight + 6, "y": object.y * this.map.tileHeight - 6 };
    switch (object.index) {
        case P11:
        case P21:
            prefab = new Platformer.Player(this, position, {
                texture: CHARACTERS[object.index].name,
                group: "characters",
                isP1: object.index == P11
            });
            break;
        case P12:
        case P22:
            prefab = new Platformer.Player(this, position, {
                texture: CHARACTERS[object.index].name,
                group: "characters",
                isP1: object.index == P12
            });
            break;
        case P13:
        case P23:
            prefab = new Platformer.Player(this, position, {
                texture: CHARACTERS[object.index].name,
                group: "characters",
                isP1: object.index == P13
            });
            break;
        case MONEY:
            prefab = new Platformer.Goal(this, position);
            break;
    }
    if (prefab) {
        this.prefabs[object.index] = prefab;
    }
};
Platformer.TiledState.prototype.processInput = function(pointer) {
    var x = Math.floor(pointer.x / this.map.tileWidth);
    var y = Math.floor(pointer.y / this.map.tileHeight);

    var state = this.state[y][x];
    if (!this.selected) {
        // Select the character to move
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
        // Select target destination
        var reachable = this.reachable[y][x];
        if (reachable) {
            this.path = [];
            this.findPath(x, y);
            var points = this.path.map(function(p) {
                return new Phaser.Point(p[0] * this.map.tileWidth, p[1] * this.map.tileHeight)
            }, this);
            if (this.visiblePaths[this.selected.type]) {
                this.world.remove(this.visiblePaths[this.selected.type]);
            }
            this.visiblePaths[this.selected.type] = this.game.add.rope(32, 32, 'line', null, points);
            this.paths[this.selected.type] = this.path.shift();
        }
        this.selected = null;
        this.reachOverlays.forEach(function(overlay) {
            this.world.remove(overlay);
        }, this);
    }
};

Platformer.TiledState.prototype.showMessage = function(message) {
    this.message = this.add.text(20, 20, message, style);
};

Platformer.TiledState.prototype.onMessage = function(message) {
    console.log("message received:", message);
    message = JSON.parse(message.data);
    switch (message.type) {
        case "START":
            if (message.firstPlayer) {
                this.player = 1;
                this.send({ type: "STATE", state: this.state, walls: this.walls });
            } else {
                this.player = 2;
            }
            this.playerText = this.add.text(910, 0, "Player " + this.player, style);
            break;
        case "ACTIONS":
            break;
        case "STATE":
            break;
    }

    if (this.message) {
        this.world.remove(this.message);
        this.message = null;
        this.actionController = 0;
    }
};

Platformer.TiledState.prototype.send = function(message) {
    this.ws.send(JSON.stringify(message));
};

Platformer.TiledState.prototype.findReachable = function(x, y, reach) {
    if (reach == 0) {
        return;
    }

    if (!this.reachable[y][x] || this.reachable[y][x] < reach) {
        this.reachable[y][x] = reach;
    }

    var wall, state;
    // NORTH
    state = y > 0 && this.state[y - 1][x];
    if (state == -1 || state == 3) {
        wall = this.walls[y - 1][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y - 1, reach - 1);
        }
    }
    // EAST
    state = x < 15 && this.state[y][x + 1];
    if (state == -1 || state == 3) {
        wall = this.walls[y][x + 1];
        if (wall != WALL_W && wall != WALL_SW) {
            this.findReachable(x + 1, y, reach - 1);
        }
    }
    // SOUTH
    state = y < 8 && this.state[y + 1][x];
    if (state == -1 || state == 3) {
        wall = this.walls[y][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y + 1, reach - 1);
        }
    }
    // WEST
    state = x > 0 && this.state[y][x - 1];
    if (state == -1 || state == 3) {
        wall = this.walls[y][x];
        if (wall != WALL_W && wall != WALL_SW) {
            this.findReachable(x - 1, y, reach - 1);
        }
    }
};

Platformer.TiledState.prototype.findPath = function(x, y) {
    this.path.unshift([x, y]);
    var reach = this.reachable[y][x];

    // NORTH
    if (y > 0 && this.reachable[y - 1][x] > reach) {
        wall = this.walls[y - 1][x];
        if (wall != WALL_S && wall != WALL_SW) {
            return this.findPath(x, y - 1);
        }
    }
    // EAST
    if (x < 15 && this.reachable[y][x + 1] > reach) {
        wall = this.walls[y][x + 1];
        if (wall != WALL_W && wall != WALL_SW) {
            return this.findPath(x + 1, y);
        }
    }
    // SOUTH
    if (y < 8 && this.reachable[y + 1][x] > reach) {
        wall = this.walls[y][x];
        if (wall != WALL_S && wall != WALL_SW) {
            return this.findPath(x, y + 1);
        }
    }
    // WEST
    if (x > 0 && this.reachable[y][x - 1] > reach) {
        wall = this.walls[y][x];
        if (wall != WALL_W && wall != WALL_SW) {
            return this.findPath(x - 1, y);
        }
    }
};

Platformer.TiledState.prototype.restart_level = function() {
    "use strict";
    this.game.state.restart(true, false, this.level_data);
};
