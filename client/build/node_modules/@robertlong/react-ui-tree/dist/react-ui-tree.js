'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UITree = function (_Component) {
  _inherits(UITree, _Component);

  function UITree(props) {
    _classCallCheck(this, UITree);

    var _this = _possibleConstructorReturn(this, (UITree.__proto__ || Object.getPrototypeOf(UITree)).call(this, props));

    _initialiseProps.call(_this);

    _this.state = _this.init(props);
    _this.treeEl = _react2.default.createRef();

    _this.startScrollHeight = null;
    _this.lastMousePos = { clientX: null, clientY: null };
    _this.scrollEnabled = false;
    _this.currentScrollSpeed = 0;
    _this.lastScrollTimestamp = null;
    return _this;
  }

  _createClass(UITree, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (!this._updated && this.state.dragging.id === null) {
        this.setState(this.init(nextProps));
      } else {
        this._updated = false;
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var tree = this.state.tree;
      var dragging = this.state.dragging;
      var draggingDom = this.getDraggingDom();

      return _react2.default.createElement(
        'div',
        { className: 'm-tree', ref: this.treeEl },
        draggingDom,
        _react2.default.createElement(_node2.default, {
          tree: tree,
          index: tree.getIndex(1),
          key: 1,
          paddingLeft: this.props.paddingLeft,
          onDragStart: this.props.draggable && this.dragStart,
          onCollapse: this.toggleCollapse,
          dragging: dragging && dragging.id
        })
      );
    }
  }]);

  return UITree;
}(_react.Component);

UITree.propTypes = {
  tree: _propTypes2.default.object.isRequired,
  paddingLeft: _propTypes2.default.number,
  scrollMargin: _propTypes2.default.number,
  scrollSpeed: _propTypes2.default.number,
  renderNode: _propTypes2.default.func.isRequired,
  draggable: _propTypes2.default.bool
};
UITree.defaultProps = {
  paddingLeft: 20,
  scrollMargin: 20,
  scrollSpeed: 200,
  draggable: true
};

var _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.init = function (props) {
    var tree = new _tree2.default(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  };

  this.getDraggingDom = function () {
    var _state = _this2.state,
        tree = _state.tree,
        dragging = _state.dragging;


    if (dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return _react2.default.createElement(
        'div',
        { className: 'm-draggable', style: draggingStyles },
        _react2.default.createElement(_node2.default, {
          tree: tree,
          index: draggingIndex,
          paddingLeft: _this2.props.paddingLeft
        })
      );
    }

    return null;
  };

  this.dragStart = function (id, dom, e) {
    if (e.button !== 0 || id === 1) return;

    var _treeEl$current = _this2.treeEl.current,
        scrollHeight = _treeEl$current.scrollHeight,
        scrollTop = _treeEl$current.scrollTop;


    _this2.startScrollHeight = scrollHeight;

    _this2.setState({
      dragging: {
        id: id,
        w: dom.offsetWidth,
        h: dom.offsetHeight,
        ph: dom.parentNode.offsetHeight,
        x: dom.offsetLeft,
        y: dom.offsetTop
      },
      start: {
        x: dom.offsetLeft,
        y: dom.offsetTop,
        offsetX: e.clientX,
        offsetY: e.clientY + scrollTop
      }
    });

    window.addEventListener('mousemove', _this2.drag);
    window.addEventListener('mouseup', _this2.dragEnd);

    _this2.lastMousePos.clientX = e.clientX;
    _this2.lastMousePos.clientY = e.clientY;
    _this2.scrollEnabled = true;
    requestAnimationFrame(_this2.scroll);
  };

  this.scroll = function (timestamp) {
    if (!_this2.scrollEnabled) return;

    if (_this2.lastScrollTimestamp === null || _this2.currentScrollSpeed === 0) {
      _this2.lastScrollTimestamp = timestamp;
      requestAnimationFrame(_this2.scroll);
      return;
    }

    var delta = timestamp - _this2.lastScrollTimestamp;
    _this2.treeEl.current.scrollTop += _this2.currentScrollSpeed * delta / 1000;
    _this2.drag(_this2.lastMousePos);

    _this2.lastScrollTimestamp = timestamp;
    requestAnimationFrame(_this2.scroll);
  };

  this.drag = function (e) {
    if (e) {
      _this2.lastMousePos.clientX = e.clientX;
      _this2.lastMousePos.clientY = e.clientY;
    } else {
      e = _this2.lastMousePos;
    }
    var _e = e,
        clientX = _e.clientX,
        clientY = _e.clientY;


    var tree = _this2.state.tree;
    var dragging = _this2.state.dragging;
    var _props = _this2.props,
        paddingLeft = _props.paddingLeft,
        scrollMargin = _props.scrollMargin,
        scrollSpeed = _props.scrollSpeed;

    var newIndex = null;
    var index = tree.getIndex(dragging.id);

    if (index === undefined) return;

    var collapsed = index.node.collapsed;

    var _startX = _this2.state.start.x;
    var _startY = _this2.state.start.y;
    var _offsetX = _this2.state.start.offsetX;
    var _offsetY = _this2.state.start.offsetY;

    var _treeEl$current2 = _this2.treeEl.current,
        scrollTop = _treeEl$current2.scrollTop,
        clientHeight = _treeEl$current2.clientHeight;


    var pos = {
      x: _startX + clientX - _offsetX,
      y: Math.min(_this2.startScrollHeight - dragging.ph, _startY + clientY + scrollTop - _offsetY)
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    var diffX = dragging.x - paddingLeft / 2 - (index.left - 2) * paddingLeft;
    var diffY = dragging.y - dragging.h / 2 - (index.top - 2) * dragging.h;

    if (diffX < 0) {
      // left
      if (index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
      }
    } else if (diffX > paddingLeft) {
      // right
      if (index.prev) {
        var prevNode = tree.getIndex(index.prev).node;
        if (!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
        }
      }
    }

    if (newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (diffY < 0) {
      // up
      var above = tree.getNodeByTop(index.top - 1);
      newIndex = tree.move(index.id, above.id, 'before');
    } else if (diffY > dragging.h) {
      // down
      if (index.next) {
        var below = tree.getIndex(index.next);
        if (below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, 'prepend');
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
        }
      } else {
        var _below = tree.getNodeByTop(index.top + index.height);
        if (_below && _below.parent !== index.id) {
          if (_below.children && _below.children.length && !_below.node.collapsed) {
            newIndex = tree.move(index.id, _below.id, 'prepend');
          } else {
            newIndex = tree.move(index.id, _below.id, 'after');
          }
        }
      }
    }

    if (newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (dragging.y + dragging.ph > scrollTop + clientHeight - scrollMargin) {
      _this2.currentScrollSpeed = scrollSpeed;
    } else if (dragging.y < scrollTop + scrollMargin) {
      _this2.currentScrollSpeed = -scrollSpeed;
    } else {
      _this2.currentScrollSpeed = 0;
    }

    _this2.setState({
      tree: tree,
      dragging: dragging
    });
  };

  this.dragEnd = function () {
    var draggingId = _this2.state.dragging.id;

    _this2.setState({
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      },
      start: null
    });

    window.removeEventListener('mousemove', _this2.drag);
    window.removeEventListener('mouseup', _this2.dragEnd);

    _this2.lastMousePos.clientX = null;
    _this2.lastMousePos.clientY = null;
    _this2.scrollEnabled = false;

    var index = _this2.state.tree.getIndex(draggingId);

    if (index === undefined) return;

    var parent = _this2.state.tree.get(index.parent);

    _this2.change(_this2.state.tree, parent, index.node);
  };

  this.change = function (tree, parent, node) {
    _this2._updated = true;
    if (_this2.props.onChange) _this2.props.onChange(tree.obj, parent, node);
  };

  this.toggleCollapse = function (nodeId) {
    var tree = _this2.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    _this2.setState({
      tree: tree
    });

    _this2.change(tree, null, null);
  };
};

module.exports = UITree;