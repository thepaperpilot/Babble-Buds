"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Node2 = require("./Node.js");

var _Node3 = _interopRequireDefault(_Node2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SplitterNode = function (_Node) {
    _inherits(SplitterNode, _Node);

    function SplitterNode(model) {
        _classCallCheck(this, SplitterNode);

        var _this = _possibleConstructorReturn(this, (SplitterNode.__proto__ || Object.getPrototypeOf(SplitterNode)).call(this, model));

        _this._fixed = true;
        _this._attributes["type"] = SplitterNode.TYPE;
        model._addNode(_this);
        return _this;
    }

    _createClass(SplitterNode, [{
        key: "getWidth",
        value: function getWidth() {
            return this._model.getSplitterSize();
        }
    }, {
        key: "getHeight",
        value: function getHeight() {
            return this._model.getSplitterSize();
        }
    }]);

    return SplitterNode;
}(_Node3.default);

SplitterNode.TYPE = "splitter";

exports.default = SplitterNode;