import Container from './Container';
import XType from './XType';

/**
 * Div元素
 * @param {*} options 
 */
function Div(options) {
    Container.call(this, options);
    options = options || {};

    this.id = options.id || null;
    this.html = options.html || null;
    this.cls = options.cls || null;
    this.style = options.style || null;

    this.onClick = options.onClick || null;
};

Div.prototype = Object.create(Container.prototype);
Div.prototype.constructor = Div;

Div.prototype.render = function () {
    this.dom = document.createElement('div');

    if (this.id) {
        this.dom.id = this.id;
    }

    if (this.cls) {
        this.dom.className = this.cls;
    }

    if (this.style) {
        this.dom.style = this.style;
    }

    this.parent.appendChild(this.dom);

    if (this.onClick) {
        this.dom.onclick = this.onClick.bind(this);
    }

    var _this = this;

    if (this.html) {
        this.dom.innerHTML = this.html;
    } else {
        this.children.forEach(function (n) {
            var obj = XType.create(n);
            obj.parent = _this.dom;
            obj.render();
        });
    }
};

XType.add('div', Div);

export default Div;