var Phaser = Phaser || {};
var Platformer = Platformer || {};

var style = { font: "32px Arial", fill: "#99ffcc" };

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

    this.ws = new WebSocket(document.location.hostname == 'localhost' ? "ws://localhost:8080/" : "ws://associate-warriors.herokuapp.com/");
    this.ws.onmessage = this.onMessage.bind(this);
    this.bg = game.add.tileSprite(0, 0, 1024, 576, 'background');

    this.player = 0;

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
                row.push(tile.index > 0 ? tile.index : 0);
                this.create_object(tile);
            }, this);
            tiles.push(row);
        }, this);

        if (layer.name == 'objetos') {
            this.state = tiles;
            this.layers[layer.name].visible = false;
        } else if (layer.name == 'walls') {
            this.walls = tiles;
            this.layers[layer.name].pivot.set(8, -8);
        }
    }, this);

    // create go button
    this.okButton = this.add.button(900, 0, 'go', function() {
        console.log("paths: ", JSON.stringify(this.paths));
        this.send({ type: "MOVE", move: this.paths });
        var pathGroup = this.groups["paths"];
        Object.keys(this.visiblePaths).forEach(function(key) {
            pathGroup.remove(this.visiblePaths[key])
        }, this);
        this.paths = {};
        this.visiblePaths = {};
        this.okButton.visible = false;
        this.showMessage(WAITING_OTHER_PLAYER);
    }, this, 1, 2);

    this.okButton.visible = false;
    this.showMessage(CONNECTING);

    // resize the world to be the size of the current layer
    this.layers[this.map.layer.name].resizeWorld();
};

Platformer.TiledState.prototype.create_object = function(object) {
    "use strict";
    var position, prefab;
    position = { "x": object.x * this.map.tileHeight + 32, "y": object.y * this.map.tileHeight + 32 };
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
                        //this.reachOverlays.push(this.add.text(x1 * this.map.tileWidth + 24, y1 * this.map.tileHeight + 16, reach, style));
                        this.reachOverlays.push(this.add.image(x1 * this.map.tileWidth, y1 * this.map.tileHeight, 'area'));
                    }
                }
            }
        }
    } else {
        // Select target destination
        var reachable = this.reachable[y][x];
        if (reachable) {
            var pathGroup = this.groups["paths"];
            this.path = [];
            this.findPath(x, y);
            var points = this.path.map(function(p) {
                return new Phaser.Point(p[0] * this.map.tileWidth, p[1] * this.map.tileHeight)
            }, this);

            if (this.visiblePaths[this.selected.type]) {
                pathGroup.remove(this.visiblePaths[this.selected.type]);
            }
            if (this.visiblePaths[this.selected.type + "X"]) {
                pathGroup.remove(this.visiblePaths[this.selected.type + "X"]);
            }

            this.visiblePaths[this.selected.type] = this.game.add.rope(32, 32, 'line', null, points, pathGroup);
            this.path.shift();
            this.paths[this.selected.type] = this.path;

            var last = points[points.length - 1];
            this.visiblePaths[this.selected.type + "X"] = this.game.add.image(last.x, last.y, "cross", 0, pathGroup);
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
                this.okButton.visible = true;
            } else {
                this.player = 2;
            }
            //this.playerText = this.add.text(910, 0, "Player " + this.player, style);
            break;
        case "ACTIONS":
            this.proccessActions(message);
            this.okButton.visible = true;
            break;
        case "STATE":
            this.state = message.state;
            this.okButton.visible = true;
            break;
    }

    if (this.message) {
        this.world.remove(this.message);
        this.message = null;
    }
};

Platformer.TiledState.prototype.proccessActions = function(message) {
    var i = 0;
    var bullet = null;
    message.actions.forEach(function(action) {
        setTimeout(function() {
            console.log("proccessActions: ", action);
            Object.keys(action).forEach(function(id) {
                var player = this.prefabs[id];
                console.log("player: ", id);

                // SHOOT
                if (action[id].shoot) {
                    if (id == P11 || id == P21) {
                        bullet = game.add.sprite(player.x, player.y, 'p11_p');
                    } else if (id == P12 || id == P22) {
                        bullet = game.add.sprite(player.x, player.y, 'p12_p');
                    } else if (id == P13 || id == P23) {
                        bullet = game.add.sprite(player.x, player.y, 'p13_p');
                    }

                    var shootX = action[id].shoot[0] * 64 + 32;
                    var shootY = action[id].shoot[1] * 64 + 32;

                    bullet.angle = this.calculateAngle(player, shootX, shootY);

                    var tween = this.add.tween(bullet).to({ x: shootX, y: shootY }, 300, Phaser.Easing.Linear.none, false);
                    tween.onComplete.add(function() {
                        bullet.destroy();
                        //emitter.destroy();
                    }, this);
                    this.add.tween(player).to({ angle: bullet.angle }, 100, Phaser.Easing.Linear.none, true).chain(tween);
                }

                // DIE
                if (action[id].die) {
                    this.add.tween(player).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.none, true, 100);
                }

                // MOVE
                var pos = action[id].pos;
                if (pos) {
                    console.log("move: ", pos);
                    var posX = pos[0];
                    var posY = pos[1];

                    var angle = this.calculateAngle(player, (posX * 64) + 32, (posY * 64) + 32);
                    this.add.tween(player).to({ angle: angle }, 100, Phaser.Easing.Linear.none, true).chain(
                            this.add.tween(player).to({ x: (posX * 64) + 32, y: (posY * 64) + 32 }, 600, Phaser.Easing.Linear.none)
                    );
                }
            }, this);
        }.bind(this), (i++) * 700);
    }, this);
};

Platformer.TiledState.prototype.calculateAngle = function(player, xPos, yPos) {
    var angle;
    var lastAngle = player.angle;
    var dx = xPos - player.x;
    var dy = yPos - player.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -1) {
            angle = 0;
        } else if (dx > 1) {
            angle = 180;
        }
    } else {
        if (dy < -1) {
            angle = 90;
        } else if (dy > 1) {
            angle = -90;
        }
    }

    while (Math.abs(lastAngle - angle) > 180) {
        angle += angle < lastAngle ? 360 : -360;
    }

    return angle;
};

/////////////////////////////////////////////////////////////

Platformer.TiledState.prototype.send = function(message) {
    this.ws.send(JSON.stringify(message));
};

Platformer.TiledState.prototype.findReachable = function(x, y, reach) {
    if (reach == 0 || x < 0 || y < 0 || x > 15 || y > 8) {
        return;
    }

    if (!this.reachable[y][x] || this.reachable[y][x] < reach) {
        this.reachable[y][x] = reach;
    }

    var wall, state;
    // NORTH
    state = y > 0 && this.state[y - 1][x];
    if (!state || state == 3) {
        wall = y >= 1 && this.walls[y - 1][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y - 1, reach - 1);
        }
    }
    // EAST
    state = x < 15 && this.state[y][x + 1];
    if (!state || state == 3) {
        wall = x < 15 && this.walls[y][x + 1];
        if (wall != WALL_W && wall != WALL_SW) {
            this.findReachable(x + 1, y, reach - 1);
        }
    }
    // SOUTH
    state = y < 8 && this.state[y + 1][x];
    if (!state || state == 3) {
        wall = this.walls[y][x];
        if (wall != WALL_S && wall != WALL_SW) {
            this.findReachable(x, y + 1, reach - 1);
        }
    }
    // WEST
    state = x > 0 && this.state[y][x - 1];
    if (!state || state == 3) {
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
