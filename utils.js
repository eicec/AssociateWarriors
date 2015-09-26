var MONEY = 3;

var WALL_SW = 13;
var WALL_W = 14;
var WALL_S = 15;

var P11 = 5;
var P12 = 6;
var P13 = 7;

var P21 = 9;
var P22 = 10;
var P23 = 11;

var CONNECTING = "Conectando...";
var WAITING_OTHER_PLAYER = "Esperando outro jogador...";

var CHARACTERS = {};

CHARACTERS[P11] = { type: P11, player: 1, name: "p11", reach: 5 };
CHARACTERS[P12] = { type: P12, player: 1, name: "p12", reach: 5 };
CHARACTERS[P13] = { type: P13, player: 1, name: "p13", reach: 5 };
CHARACTERS[P21] = { type: P21, player: 2, name: "p21", reach: 5 };
CHARACTERS[P22] = { type: P22, player: 2, name: "p22", reach: 5 };
CHARACTERS[P23] = { type: P23, player: 2, name: "p23", reach: 5 };
