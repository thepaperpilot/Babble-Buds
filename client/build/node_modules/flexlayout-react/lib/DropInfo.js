"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DropInfo = function DropInfo(node, rect, location, index, className) {
    _classCallCheck(this, DropInfo);

    this.node = node;
    this.rect = rect;
    this.location = location;
    this.index = index;
    this.className = className;
};

exports.default = DropInfo;