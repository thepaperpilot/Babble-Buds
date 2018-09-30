"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Attribute = require("./Attribute");

var _Attribute2 = _interopRequireDefault(_Attribute);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AttributeDefinitions = function () {
    function AttributeDefinitions() {
        _classCallCheck(this, AttributeDefinitions);

        this.attributes = [];
        this.nameToAttribute = {};
    }

    _createClass(AttributeDefinitions, [{
        key: "addWithAll",
        value: function addWithAll(name, modelName, defaultValue, alwaysWriteJson) {
            var attr = new _Attribute2.default(name, modelName, defaultValue, alwaysWriteJson);
            this.attributes.push(attr);
            this.nameToAttribute[name] = attr;
            return attr;
        }
    }, {
        key: "addInherited",
        value: function addInherited(name, modelName) {
            return this.addWithAll(name, modelName, undefined, false);
        }
    }, {
        key: "add",
        value: function add(name, defaultValue, alwaysWriteJson) {
            return this.addWithAll(name, null, defaultValue, alwaysWriteJson);
        }
    }, {
        key: "getAttributes",
        value: function getAttributes() {
            return this.attributes;
        }
    }, {
        key: "getModelName",
        value: function getModelName(name) {
            var conversion = this.nameToAttribute[name];
            if (conversion != null) {
                return conversion.modelName;
            } else {
                return null;
            }
        }
    }, {
        key: "toJson",
        value: function toJson(jsonObj, obj) {
            this.attributes.forEach(function (attr) {
                var fromValue = obj[attr.name];
                if (attr.alwaysWriteJson || fromValue !== attr.defaultValue) {
                    jsonObj[attr.name] = fromValue;
                }
            });
        }
    }, {
        key: "fromJson",
        value: function fromJson(jsonObj, obj) {
            this.attributes.forEach(function (attr) {
                var fromValue = jsonObj[attr.name];
                if (fromValue === undefined) {
                    obj[attr.name] = attr.defaultValue;
                } else {
                    obj[attr.name] = fromValue;
                }
            });
        }
    }, {
        key: "update",
        value: function update(jsonObj, obj) {
            this.attributes.forEach(function (attr) {

                var fromValue = jsonObj[attr.name];
                if (fromValue !== undefined) {
                    obj[attr.name] = fromValue;
                }
            });
        }
    }, {
        key: "setDefaults",
        value: function setDefaults(obj) {
            this.attributes.forEach(function (attr) {
                obj[attr.name] = attr.defaultValue;
            });
        }
    }]);

    return AttributeDefinitions;
}();

exports.default = AttributeDefinitions;