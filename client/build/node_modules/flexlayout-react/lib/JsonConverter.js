"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JsonConverter = function () {
    function JsonConverter() {
        _classCallCheck(this, JsonConverter);

        this.conversions = [];
    }

    _createClass(JsonConverter, [{
        key: "addConversion",
        value: function addConversion(name, jsonName, defaultValue, alwayWriteJson) {
            this.conversions.push({
                name: name,
                jsonName: jsonName,
                defaultValue: defaultValue,
                alwaysWriteJson: alwayWriteJson
            });
        }
    }, {
        key: "toJson",
        value: function toJson(jsonObj, obj) {
            this.conversions.forEach(function (c) {
                var fromValue = obj[c.name];
                if (c.alwaysWriteJson || fromValue !== c.defaultValue) {
                    jsonObj[c.jsonName] = fromValue;
                }
            });
        }
    }, {
        key: "fromJson",
        value: function fromJson(jsonObj, obj) {
            if (jsonObj == null) {
                debugger;
            }
            this.conversions.forEach(function (c) {
                var fromValue = jsonObj[c.jsonName];
                if (fromValue === undefined) {
                    obj[c.name] = c.defaultValue;
                } else {
                    obj[c.name] = fromValue;
                }
            });
        }
    }, {
        key: "updateAttrs",
        value: function updateAttrs(jsonObj, obj) {
            this.conversions.forEach(function (c) {
                var fromValue = jsonObj[c.jsonName];
                if (fromValue !== undefined) {
                    obj[c.name] = fromValue;
                }
            });
        }
    }, {
        key: "setDefaults",
        value: function setDefaults(obj) {
            this.conversions.forEach(function (c) {
                obj[c.name] = c.defaultValue;
            });
        }
    }, {
        key: "toTable",
        value: function toTable() {
            var lines = [];
            lines.push("| Attribute | Default | Description  |");
            lines.push("| ------------- |:-------------:| -----|");
            this.conversions.forEach(function (c) {
                lines.push("| " + c.jsonName + " | " + c.defaultValue + " | |");
            });

            return lines.join("\n");
        }
    }, {
        key: "toTableValues",
        value: function toTableValues(obj, model) {
            var lines = [];
            lines.push("<table border='1'>");
            lines.push("<tr><th>Attribute</th><th>Default</th><th>Value</th></tr>");
            this.conversions.forEach(function (c) {
                //if (obj[c.name] !== c.defaultValue) {
                lines.push("<tr><td>" + c.jsonName + "</td><td>" + c.defaultValue + "</td><td>" + JSON.stringify(obj[c.name]) + "</td></tr>");
                //}
            });
            lines.push("</table>");

            return lines.join("\n");
        }
    }]);

    return JsonConverter;
}();

exports.default = JsonConverter;