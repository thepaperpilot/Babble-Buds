"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _TabSetNode = require("../model/TabSetNode.js");

var _TabSetNode2 = _interopRequireDefault(_TabSetNode);

var _Actions = require("../model/Actions.js");

var _Actions2 = _interopRequireDefault(_Actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Tab = function (_React$Component) {
    _inherits(Tab, _React$Component);

    function Tab(props) {
        _classCallCheck(this, Tab);

        var _this = _possibleConstructorReturn(this, (Tab.__proto__ || Object.getPrototypeOf(Tab)).call(this, props));

        _this.state = { renderComponent: props.selected };
        return _this;
    }

    _createClass(Tab, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            //console.log("mount " + this.props.node.getName());
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            //console.log("unmount " + this.props.node.getName());
        }
    }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(newProps) {
            if (!this.state.renderComponent && newProps.selected) {
                // load on demand
                //console.log("load on demand: " + this.props.node.getName());
                this.setState({ renderComponent: true });
            }
        }
    }, {
        key: "onMouseDown",
        value: function onMouseDown(event) {
            var parent = this.props.node.getParent();
            if (parent.getType() == _TabSetNode2.default.TYPE) {
                if (!parent.isActive()) {
                    this.props.layout.doAction(_Actions2.default.setActiveTabset(parent.getId()));
                }
            }
        }
    }, {
        key: "render",
        value: function render() {
            var node = this.props.node;
            var style = node._styleWithPosition({
                display: this.props.selected ? "block" : "none"
            });

            if (this.props.node.getParent().isMaximized()) {
                style.zIndex = 100;
            }

            var child = null;
            if (this.state.renderComponent) {
                child = this.props.factory(node);
            }

            return _react2.default.createElement(
                "div",
                { className: "flexlayout__tab",
                    onMouseDown: this.onMouseDown.bind(this),
                    onTouchStart: this.onMouseDown.bind(this),
                    style: style },
                child
            );
        }
    }]);

    return Tab;
}(_react2.default.Component);

exports.default = Tab;