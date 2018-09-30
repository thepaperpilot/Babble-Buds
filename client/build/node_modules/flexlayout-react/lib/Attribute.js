"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Attribute = function () {
    function Attribute(name, modelName, defaultValue, alwaysWriteJson) {
        _classCallCheck(this, Attribute);

        this.name = name;
        this.modelName = modelName;
        this.defaultValue = defaultValue;
        this.alwaysWriteJson = alwaysWriteJson;

        this.type = null;
        this.values = [];
        this.from = -99999999;
        this.to = 99999999;
    }

    _createClass(Attribute, [{
        key: "setType",
        value: function setType(value) {
            this.type = value;
            return this;
        }
    }, {
        key: "setValues",
        value: function setValues() {
            this.values = Array.from(arguments);
            return this;
        }
    }, {
        key: "setFrom",
        value: function setFrom(value) {
            this.from = value;
            return this;
        }
    }, {
        key: "setTo",
        value: function setTo(value) {
            this.to = value;
            return this;
        }
    }]);

    return Attribute;
}();

Attribute.ENUM = "Enum";
Attribute.INT = "Int";
Attribute.NUMBER = "Number";
Attribute.STRING = "String";
Attribute.BOOLEAN = "Boolean";
Attribute.ID = "Id";
Attribute.JSON = "Json";

exports.default = Attribute;