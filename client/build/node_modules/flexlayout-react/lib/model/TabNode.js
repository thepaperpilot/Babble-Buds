"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Node2 = require("./Node.js");

var _Node3 = _interopRequireDefault(_Node2);

var _AttributeDefinitions = require("../AttributeDefinitions.js");

var _AttributeDefinitions2 = _interopRequireDefault(_AttributeDefinitions);

var _Attribute = require("../Attribute");

var _Attribute2 = _interopRequireDefault(_Attribute);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TabNode = function (_Node) {
    _inherits(TabNode, _Node);

    function TabNode(model, json) {
        _classCallCheck(this, TabNode);

        var _this = _possibleConstructorReturn(this, (TabNode.__proto__ || Object.getPrototypeOf(TabNode)).call(this, model));

        _this._tabRect = null; // rect of the tab rather than the tab contents=
        _this._extra = {}; // extra data added to node not saved in json

        attributeDefinitions.fromJson(json, _this._attributes);
        model._addNode(_this);
        return _this;
    }

    _createClass(TabNode, [{
        key: "getTabRect",
        value: function getTabRect() {
            return this._tabRect;
        }
    }, {
        key: "setTabRect",
        value: function setTabRect(rect) {
            this._tabRect = rect;
        }
    }, {
        key: "getName",
        value: function getName() {
            return this._attributes["name"];
        }
    }, {
        key: "getComponent",
        value: function getComponent() {
            return this._attributes["component"];
        }
    }, {
        key: "getConfig",
        value: function getConfig() {
            return this._attributes["config"];
        }
    }, {
        key: "getExtraData",
        value: function getExtraData() {
            return this._extra;
        }
    }, {
        key: "getIcon",
        value: function getIcon() {
            return this._attributes["icon"];
        }
    }, {
        key: "isEnableClose",
        value: function isEnableClose() {
            return this._getAttr("enableClose");
        }
    }, {
        key: "isEnableDrag",
        value: function isEnableDrag() {
            return this._getAttr("enableDrag");
        }
    }, {
        key: "isEnableRename",
        value: function isEnableRename() {
            return this._getAttr("enableRename");
        }
    }, {
        key: "getClassName",
        value: function getClassName() {
            return this._getAttr("className");
        }
    }, {
        key: "_setName",
        value: function _setName(name) {
            this._attributes["name"] = name;
        }
    }, {
        key: "_layout",
        value: function _layout(rect) {
            if (!rect.equals(this._rect)) {
                this._fireEvent("resize", { rect: rect });
            }
            this._rect = rect;
        }
    }, {
        key: "_delete",
        value: function _delete() {
            this._parent._remove(this);
            this._fireEvent("close", {});
        }
    }, {
        key: "_toJson",
        value: function _toJson() {
            var json = {};
            attributeDefinitions.toJson(json, this._attributes);
            return json;
        }
    }, {
        key: "_updateAttrs",
        value: function _updateAttrs(json) {
            attributeDefinitions.update(json, this._attributes);
        }
    }, {
        key: "_getAttributeDefinitions",
        value: function _getAttributeDefinitions() {
            return attributeDefinitions;
        }
    }], [{
        key: "_fromJson",
        value: function _fromJson(json, model) {
            var newLayoutNode = new TabNode(model, json);
            return newLayoutNode;
        }
    }]);

    return TabNode;
}(_Node3.default);

TabNode.TYPE = "tab";

var attributeDefinitions = new _AttributeDefinitions2.default();
attributeDefinitions.add("type", TabNode.TYPE, true);
attributeDefinitions.add("id", null).setType(_Attribute2.default.ID);

attributeDefinitions.add("name", null).setType(_Attribute2.default.STRING);
attributeDefinitions.add("component", null).setType(_Attribute2.default.STRING);
attributeDefinitions.add("config", null).setType(_Attribute2.default.JSON);

attributeDefinitions.addInherited("enableClose", "tabEnableClose").setType(_Attribute2.default.BOOLEAN);
attributeDefinitions.addInherited("enableDrag", "tabEnableDrag").setType(_Attribute2.default.BOOLEAN);
attributeDefinitions.addInherited("enableRename", "tabEnableRename").setType(_Attribute2.default.BOOLEAN);
attributeDefinitions.addInherited("className", "tabClassName").setType(_Attribute2.default.STRING);
attributeDefinitions.addInherited("icon", "tabIcon").setType(_Attribute2.default.STRING);

exports.default = TabNode;