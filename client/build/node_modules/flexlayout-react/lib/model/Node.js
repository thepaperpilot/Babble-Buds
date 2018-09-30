"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rect = require("../Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _Orientation = require("../Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

var _DockLocation = require("../DockLocation.js");

var _DockLocation2 = _interopRequireDefault(_DockLocation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = function () {
    function Node(model) {
        _classCallCheck(this, Node);

        this._model = model;
        this._attributes = {};
        this._parent = null;
        this._children = [];
        this._fixed = false;
        this._rect = new _Rect2.default();
        this._visible = false;
        this._listeners = {};
    }

    _createClass(Node, [{
        key: "getId",
        value: function getId() {
            return this._attributes["id"];
        }
    }, {
        key: "getModel",
        value: function getModel() {
            return this._model;
        }
    }, {
        key: "getType",
        value: function getType() {
            return this._attributes["type"];
        }
    }, {
        key: "getParent",
        value: function getParent() {
            return this._parent;
        }
    }, {
        key: "getChildren",
        value: function getChildren() {
            return this._children;
        }
    }, {
        key: "getRect",
        value: function getRect() {
            return this._rect;
        }
    }, {
        key: "isVisible",
        value: function isVisible() {
            return this._visible;
        }
    }, {
        key: "getOrientation",
        value: function getOrientation() {
            if (this._parent == null) {
                return _Orientation2.default.HORZ;
            } else {
                return _Orientation2.default.flip(this._parent.getOrientation());
            }
        }

        // event can be: resize, visibility, maximize (on tabset), close

    }, {
        key: "setEventListener",
        value: function setEventListener(event, callback) {
            this._listeners[event] = callback;
        }
    }, {
        key: "removeEventListener",
        value: function removeEventListener(event) {
            delete this._listeners[event];
        }
    }, {
        key: "_setId",
        value: function _setId(id) {
            this._attributes["id"] = id;
        }
    }, {
        key: "_fireEvent",
        value: function _fireEvent(event, params) {
            //console.log(this._type, " fireEvent " + event + " " + JSON.stringify(params));
            if (this._listeners[event] != null) {
                this._listeners[event](params);
            }
        }
    }, {
        key: "_getAttr",
        value: function _getAttr(name) {
            var val = this._attributes[name];

            if (val === undefined) {
                var modelName = this._getAttributeDefinitions().getModelName(name);
                if (modelName != null) {
                    val = this._model._attributes[modelName];
                }
            }

            //console.log(name + "=" + val);
            return val;
        }
    }, {
        key: "_forEachNode",
        value: function _forEachNode(fn, level) {
            fn(this, level);
            level++;
            this._children.forEach(function (node) {
                node._forEachNode(fn, level);
            });
        }
    }, {
        key: "_getPrefSize",
        value: function _getPrefSize(orientation) {
            var prefSize = this.getWidth();
            if (orientation === _Orientation2.default.VERT) {
                prefSize = this.getHeight();
            }
            return prefSize;
        }
    }, {
        key: "_setVisible",
        value: function _setVisible(visible) {
            if (visible != this._visible) {
                this._fireEvent("visibility", { visible: visible });
                this._visible = visible;
            }
        }
    }, {
        key: "_getDrawChildren",
        value: function _getDrawChildren() {
            return this._children;
        }
    }, {
        key: "_layout",
        value: function _layout(rect) {
            this._rect = rect;
        }
    }, {
        key: "_findDropTargetNode",
        value: function _findDropTargetNode(dragNode, x, y) {
            var rtn = null;
            if (this._rect.contains(x, y)) {
                rtn = this._canDrop(dragNode, x, y);
                if (rtn == null) {
                    if (this._children.length !== 0) {
                        for (var i = 0; i < this._children.length; i++) {
                            var child = this._children[i];
                            rtn = child._findDropTargetNode(dragNode, x, y);
                            if (rtn != null) {
                                break;
                            }
                        }
                    }
                }
            }

            return rtn;
        }
    }, {
        key: "_canDrop",
        value: function _canDrop(dragNode, x, y) {
            return null;
        }
    }, {
        key: "_canDockInto",
        value: function _canDockInto(dragNode, dropInfo) {
            if (dropInfo != null) {
                if (dropInfo.location === _DockLocation2.default.CENTER && dropInfo.node.isEnableDrop() === false) {
                    return false;
                }

                // prevent named tabset docking into another tabset, since this would loose the header
                if (dropInfo.location === _DockLocation2.default.CENTER && dragNode.getType() === "tabset" && dragNode.getName() !== null) {
                    return false;
                }

                if (dropInfo.location !== _DockLocation2.default.CENTER && dropInfo.node.isEnableDivide() === false) {
                    return false;
                }

                // finally check model callback to check if drop allowed
                if (this._model._onAllowDrop) {
                    return this._model._onAllowDrop(dragNode, dropInfo);
                }
            }
            return true;
        }
    }, {
        key: "_removeChild",
        value: function _removeChild(childNode) {
            var pos = this._children.indexOf(childNode);
            if (pos !== -1) {
                this._children.splice(pos, 1);
            }
            this._dirty = true;
            return pos;
        }
    }, {
        key: "_addChild",
        value: function _addChild(childNode, pos) {
            if (pos != undefined) {
                this._children.splice(pos, 0, childNode);
            } else {
                this._children.push(childNode);
                pos = this._children.length - 1;
            }
            childNode._parent = this;
            this._dirty = true;
            return pos;
        }
    }, {
        key: "_removeAll",
        value: function _removeAll() {
            this._children = [];
            this._dirty = true;
        }
    }, {
        key: "_styleWithPosition",
        value: function _styleWithPosition(style) {
            if (style == undefined) {
                style = {};
            }
            return this._rect.styleWithPosition(style);
        }
    }, {
        key: "isEnableDivide",
        value: function isEnableDivide() {
            return true;
        }

        // implemented by subclasses

    }, {
        key: "_updateAttrs",
        value: function _updateAttrs(json) {}

        // implemented by subclasses

    }, {
        key: "_getAttributeDefinitions",
        value: function _getAttributeDefinitions() {
            return null;
        }
    }, {
        key: "_toStringIndented",
        value: function _toStringIndented(lines, indent) {
            lines.push(indent + this.getType() + " " + this.getWeight().toFixed(2) + " " + this.getId());
            indent = indent + "\t";
            this._children.forEach(function (child) {
                child._toStringIndented(lines, indent);
            });
        }
    }, {
        key: "_toAttributeString",
        value: function _toAttributeString() {
            return JSON.stringify(this._attributes, null, "\t");
        }
    }]);

    return Node;
}();

exports.default = Node;