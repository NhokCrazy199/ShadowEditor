(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Shadow = {})));
}(this, (function (exports) { 'use strict';

	var ID = -1;

	/**
	 * 所有SVG控件基类
	 * @author tengge / https://github.com/tengge1
	 * @param {*} options 选项
	 */
	function SvgControl(options = {}) {
	    this.parent = options.parent || document.body;
	    this.id = options.id || this.constructor.name + ID--;
	    this.scope = options.scope || 'global';

	    this.data = options.data || null; // 自定义数据，例如：{ name: '小米', age: 20 }

	    // 添加引用
	    SVG.add(this.id, this, this.scope);
	}

	/**
	 * 定义控件属性
	 */
	Object.defineProperties(SvgControl.prototype, {
	    /**
	     * 控件id（必须在options中设置，而且设置后无法改变）
	     */
	    id: {
	        get: function () {
	            return this._id;
	        },
	        set: function (id) {
	            if (this._id != null) {
	                console.warn(`SvgControl: It is not allowed to assign new value to id.`);
	            }
	            this._id = id;
	        }
	    },

	    /**
	     * 控件id作用域（必须在options中设置，而且设置后无法改变）
	     */
	    scope: {
	        get: function () {
	            return this._scope;
	        },
	        set: function (scope) {
	            if (this._scope != null) {
	                console.warn(`SvgControl: It is not allowed to assign new value to scope.`);
	            }
	            this._scope = scope;
	        }
	    }
	});

	/**
	 * 渲染SVG控件
	 */
	SvgControl.prototype.render = function () {

	};

	/**
	 * 清除该控件内部所有内容。
	 * 该控件仍然可以通过UI.get获取，可以通过render函数重写渲染该控件。
	 */
	SvgControl.prototype.clear = function () {
	    // 移除所有子项引用
	    (function remove(items) {
	        if (items == null || items.length === 0) {
	            return;
	        }

	        items.forEach((n) => {
	            if (n.id) {
	                SVG.remove(n.id, n.scope == null ? 'global' : n.scope);
	            }
	            remove(n.children);
	        });
	    })(this.children);

	    this.children.length = 0;

	    // 清空dom
	    if (this.dom) {
	        this.parent.removeChild(this.dom);
	        this.dom = null;
	    }

	    // TODO: 未清除绑定在dom上的事件
	};

	/**
	 * 彻底摧毁该控件，并删除在UI中的引用。
	 */
	SvgControl.prototype.destroy = function () {
	    this.clear();
	    if (this.id) {
	        SVG.remove(this.id, this.scope == null ? 'global' : this.scope);
	    }
	};

	/**
	 * SVG容器
	 * @author tengge / https://github.com/tengge1
	 * @param {*} options 
	 */
	function SvgContainer(options = {}) {
	    SvgControl.call(this, options);

	    this.children = options.children || [];
	}

	SvgContainer.prototype = Object.create(SvgControl.prototype);
	SvgContainer.prototype.constructor = SvgContainer;

	SvgContainer.prototype.add = function (obj) {
	    if (!(obj instanceof SvgControl)) {
	        throw 'SvgContainer: obj is not an instance of SvgControl.';
	    }
	    this.children.push(obj);
	};

	SvgContainer.prototype.remove = function (obj) {
	    var index = this.children.indexOf(obj);
	    if (index > -1) {
	        this.children.splice(index, 1);
	    }
	};

	SvgContainer.prototype.render = function () {
	    this.children.forEach(n => {
	        var obj = SVG.create(n);
	        obj.parent = this.parent;
	        obj.render();
	    });
	};

	/**
	 * SVG文档
	 * @author tengge / https://github.com/tengge1
	 * @param {*} options 
	 */
	function SvgDom(options = {}) {
	    SvgContainer.call(this, options);

	    this.style = options.style || null;
	}

	SvgDom.prototype = Object.create(SvgContainer.prototype);
	SvgDom.prototype.constructor = SvgDom;

	SvgDom.prototype.render = function () {
	    this.dom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

	    if (this.style) {
	        Object.assign(this.dom.style, this.style);
	    }

	    this.children.forEach(n => {
	        var obj = SVG.create(n);
	        obj.parent = this.dom;
	        obj.render();
	    });

	    this.parent.appendChild(this.dom);
	};

	/**
	 * SVG类
	 * @author tengge / https://github.com/tengge1
	 */
	function SVGCls() {
	    this.xtypes = {};
	    this.objects = {};
	}

	/**
	 * 添加xtype
	 * @param {*} name xtype字符串
	 * @param {*} cls xtype对应类
	 */
	SVGCls.prototype.addXType = function (name, cls) {
	    if (this.xtypes[name] === undefined) {
	        this.xtypes[name] = cls;
	    } else {
	        console.warn(`SVGCls: xtype named ${name} has already been added.`);
	    }
	};

	/**
	 * 删除xtype
	 * @param {*} name xtype字符串
	 */
	SVGCls.prototype.removeXType = function (name) {
	    if (this.xtypes[name] !== undefined) {
	        delete this.xtypes[name];
	    } else {
	        console.warn(`SVGCls: xtype named ${name} is not defined.`);
	    }
	};

	/**
	 * 获取xtype
	 * @param {*} name xtype字符串
	 */
	SVGCls.prototype.getXType = function (name) {
	    if (this.xtypes[name] === undefined) {
	        console.warn(`SVGCls: xtype named ${name} is not defined.`);
	    }
	    return this.xtypes[name];
	};

	/**
	 * 添加一个对象到缓存
	 * @param {*} id 对象id
	 * @param {*} obj 对象
	 * @param {*} scope 对象作用域（默认为global）
	 */
	SVGCls.prototype.add = function (id, obj, scope = "global") {
	    var key = `${scope}:${id}`;
	    if (this.objects[key] !== undefined) {
	        console.warn(`SVGCls: object named ${id} has already been added.`);
	    }
	    this.objects[key] = obj;
	};

	/**
	 * 从缓存中移除一个对象
	 * @param {*} id 对象id
	 * @param {*} scope 对象作用域（默认为global）
	 */
	SVGCls.prototype.remove = function (id, scope = 'global') {
	    var key = `${scope}:${id}`;
	    if (this.objects[key] != undefined) {
	        delete this.objects[key];
	    } else {
	        console.warn(`SVGCls: object named ${id} is not defined.`);
	    }
	};

	/**
	 * 从缓存中获取一个对象
	 * @param {*} id 控件id
	 * @param {*} scope 对象作用域（默认为global）
	 */
	SVGCls.prototype.get = function (id, scope = 'global') {
	    var key = `${scope}:${id}`;
	    // 经常需要通过该方法判断是否已经注册某个元素，所以不能产生警告。
	    // if (this.objects[key] === undefined) {
	    //     console.warn(`SVGCls: object named ${id} is not defined.`);
	    // }
	    return this.objects[key];
	};

	/**
	 * 通过json配置创建UI实例，并自动将包含id的控件添加到缓存
	 * @param {*} config xtype配置
	 */
	SVGCls.prototype.create = function (config) {
	    if (config instanceof SvgControl) { // config是SvgControl实例
	        return config;
	    }

	    // config是json配置
	    if (config == null || config.xtype == null) {
	        throw 'SVGCls: config is undefined.';
	    }

	    if (config.xtype === undefined) {
	        throw 'SVGCls: config.xtype is undefined.';
	    }

	    var cls = this.xtypes[config.xtype];
	    if (cls == null) {
	        throw `SVGCls: xtype named ${config.xtype} is undefined.`;
	    }

	    return new cls(config);
	};

	/**
	 * SVGCls
	 */
	const SVG$1 = new SVGCls();

	// 添加所有SVG控件
	Object.assign(SVG$1, {
	    SvgControl: SvgControl,
	    SvgContainer: SvgContainer,
	    SvgDom: SvgDom,
	});

	// 添加所有SVG控件的XType
	SVG$1.addXType('svgcontrol', SvgControl);
	SVG$1.addXType('svgcontainer', SvgContainer);
	SVG$1.addXType('svgdom', SvgDom);

	window.SVG = SVG$1;

	exports.SVG = SVG$1;

	Object.defineProperty(exports, '__esModule', { value: true });

})));