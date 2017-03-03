(function(exports, global) {
    global["tileBoard"] = exports;
    var define, internal, finalize = function() {};
    (function() {
        var get, defined, pending, definitions, initDefinition, $cachelyToken = "~", $depsRequiredByDefinitionToken = ".";
        get = Function[$cachelyToken] = Function[$cachelyToken] || function(name) {
            if (!get[name]) {
                get[name] = {};
            }
            return get[name];
        };
        definitions = get("c");
        defined = get("d");
        pending = get("p");
        initDefinition = function(name) {
            if (defined[name]) {
                return;
            }
            var args = arguments;
            var val = args[1];
            if (typeof val === "function") {
                defined[name] = val();
            } else {
                definitions[name] = args[2];
                definitions[name][$depsRequiredByDefinitionToken] = val;
            }
        };
        define = internal = function() {
            initDefinition.apply(null, arguments);
        };
        resolve = function(name, fn) {
            pending[name] = true;
            var deps = fn[$depsRequiredByDefinitionToken];
            var args = [];
            var i, len;
            var dependencyName;
            if (deps) {
                len = deps.length;
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    if (definitions[dependencyName]) {
                        if (!pending.hasOwnProperty(dependencyName)) {
                            resolve(dependencyName, definitions[dependencyName]);
                        }
                        resolve(dependencyName, definitions[dependencyName]);
                        delete definitions[dependencyName];
                    }
                }
            }
            if (!defined.hasOwnProperty(name)) {
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    args.push(defined.hasOwnProperty(dependencyName) && defined[dependencyName]);
                }
                defined[name] = fn.apply(null, args);
            }
            delete pending[name];
        };
        finalize = function() {
            for (var name in definitions) {
                resolve(name, definitions[name]);
            }
        };
        return define;
    })();
    //! ################# YOUR CODE STARTS HERE #################### //
    //! src/tile.js
    define("tile", [ "resolve" ], function(resolve) {
        function addType(list, currentType, newType) {
            var index;
            if (currentType === newType) {
                return currentType;
            }
            if ((index = list.indexOf(currentType)) !== -1) {
                list.splice(index, 1);
                currentType = "";
            }
            if (list.indexOf(newType) === -1) {
                list.push(newType);
            }
            return newType || currentType;
        }
        function Tile(containerEl, x, y, typePath, dispatcher) {
            var el = document.createElement("div");
            var data = "";
            var classList = [ "tile" ];
            var res;
            this.el = el;
            this.data = function(d) {
                if (d !== undefined) {
                    var r = resolve(d);
                    addType(classList, data && res.get(typePath), r.get(typePath));
                    data = d;
                    res = r;
                }
                return data;
            };
            this.size = function() {
                return el.offsetWidth;
            };
            this.render = function(c, r) {
                var str = classList.join(" ");
                if (el.className !== str) {
                    el.className = str;
                    dispatcher.dispatch(dispatcher.events.TILE_RENDER_CHANGE, this, r, c);
                }
            };
            containerEl.appendChild(el);
            this.render();
            var s = this.size();
            el.style.left = x * s + "px";
            el.style.top = y * s + "px";
        }
        return {
            create: function(containerEl, x, y, typePath, dispatcher) {
                return new Tile(containerEl, x, y, typePath, dispatcher);
            }
        };
    });
    //! src/gameBoard.js
    define("gameBoard", [ "dispatcher", "tile", "getDistance", "getAngle", "getPointOnCircle" ], function(dispatcher, tile, getDistance, getAngle, getPointOnCircle) {
        var events = {
            TILE_RENDER_CHANGE: "tile-render-change",
            AFTER_KEEP_IN_BOUNDS: "after-keep-in-bounds",
            BEFORE_RENDER: "before-render",
            AFTER_RENDER: "after-render",
            TOUCHING_ITEMS: "touching-items"
        };
        function TileGameBoard(el, viewWidth, viewHeight, boardData, tileTypePath) {
            var self = this;
            self.events = events;
            var target;
            var viewOffset = {
                x: -1,
                y: -1
            };
            var tiles = [];
            var items = [];
            var viewEl = document.createElement("div");
            viewEl.classList.add("view");
            el.appendChild(viewEl);
            var vw = viewWidth + 2;
            var vh = viewHeight + 2;
            var padX = Math.floor(vw * .5);
            var padY = Math.floor(vh * .5);
            var xlen = boardData[0].length;
            var ylen = boardData.length;
            var tileSize;
            function eachTile(fn, dataOffsetPoint) {
                for (var x = 0; x < vw; x += 1) {
                    tiles[x] = tiles[x] || [];
                    for (var y = 0; y < vh; y += 1) {
                        tiles[x][y] = tiles[x][y] || tile.create(viewEl, x, y, tileTypePath, self);
                        fn(tiles[x][y], x, y, dataOffsetPoint);
                    }
                }
            }
            function renderTile(tile, x, y, dataOffsetPoint) {
                if (target) {
                    var ox = Math.floor(target.x) - padX + x - dataOffsetPoint.x;
                    var oy = Math.floor(target.y) - padY + y - dataOffsetPoint.y;
                    tile.data(boardData[oy] && boardData[oy][ox]);
                }
                tile.render(ox, oy);
            }
            function updateTarget() {
                var offPoint = {
                    x: 0,
                    y: 0
                }, xdif, ydif, ox = 0, oy = 0, rx, ry, vx, vy, result;
                if (target) {
                    var touchingTiles = keepInBounds(target);
                    var evt = self.dispatch(events.AFTER_KEEP_IN_BOUNDS, touchingTiles);
                    if (evt.defaultPrevented) {
                        target.x = target.$px;
                        target.y = target.$py;
                    }
                    rx = target.x % 1 || 0;
                    ry = target.y % 1 || 0;
                    offPoint.x = Math.floor(target.x) - padX;
                    offPoint.y = Math.floor(target.y) - padY;
                    xdif = offPoint.x + padX;
                    ydif = offPoint.y + padY;
                    if (xdif < padX) {
                        ox = -(padX - xdif) + 1;
                        vx = ox < 0 ? 0 : rx;
                    } else if (offPoint.x + rx > xlen - padX * 2) {
                        ox = offPoint.x + padX * 2 - xlen;
                        vx = 0;
                    } else {
                        vx = rx;
                    }
                    if (ydif < padY) {
                        oy = -(padY - ydif) + 1;
                        vy = oy < 0 ? 0 : ry;
                    } else if (offPoint.y + ry > ylen - padY * 2) {
                        oy = offPoint.y + padY * 2 - ylen;
                        vy = 0;
                    } else {
                        vy = ry;
                    }
                    result = {
                        x: ox,
                        y: oy,
                        vx: vx,
                        vy: vy
                    };
                    target.el.style.left = (padX + ox + rx) * tileSize + "px";
                    target.el.style.top = (padY + oy + ry) * tileSize + "px";
                    target.$px = target.x;
                    target.$py = target.y;
                    return result;
                }
            }
            function updateItems(dop) {
                var mx = Math.floor(target.x) - dop.x;
                var my = Math.floor(target.y) - dop.y;
                var item, touchingItems = [];
                for (var i = 0; i < items.length; i += 1) {
                    item = items[i];
                    if (item === target) {
                        items.splice(i, 1);
                        i -= 1;
                    } else {
                        item.el.style.left = (item.x - mx + padX) * tileSize + "px";
                        item.el.style.top = (item.y - my + padY) * tileSize + "px";
                        if (getDistance(item.x, item.y, target.x, target.y) < 1) {
                            touchingItems.push(item);
                        }
                    }
                }
                if (touchingItems.length) {
                    self.dispatch(events.TOUCHING_ITEMS, touchingItems);
                }
            }
            function keepInBounds(point) {
                var maxW = boardData[0].length - 1, maxH = boardData.length - 1;
                point.x = point.x > maxW ? maxW : point.x < 0 ? 0 : point.x;
                point.y = point.y > maxH ? maxH : point.y < 0 ? 0 : point.y;
                var points = {};
                var fx = Math.floor(point.x);
                var fy = Math.floor(point.y);
                var cx = Math.ceil(point.x);
                var cy = Math.ceil(point.y);
                points[fx + ":" + fy] = {
                    x: fx,
                    y: fy
                };
                points[fx + ":" + cy] = {
                    x: fx,
                    y: cy
                };
                points[cx + ":" + fy] = {
                    x: cx,
                    y: fy
                };
                points[cx + ":" + cy] = {
                    x: cx,
                    y: cy
                };
                var result = [];
                for (var i in points) {
                    if (points.hasOwnProperty(i)) {
                        var pt = points[i];
                        if (boardData[pt.y] && boardData[pt.y][pt.x]) {
                            pt.tile = boardData[pt.y][pt.x];
                            result.push(pt);
                        }
                    }
                }
                return result;
            }
            function render() {
                self.dispatch(events.BEFORE_RENDER);
                var dataOffsetPoint = updateTarget();
                var oxp = viewOffset.x - dataOffsetPoint.vx;
                var oyp = viewOffset.y - dataOffsetPoint.vy;
                viewEl.style.transform = "translate(" + oxp * tileSize + "px, " + oyp * tileSize + "px)";
                updateItems(dataOffsetPoint);
                eachTile(renderTile, dataOffsetPoint);
                self.dispatch(events.AFTER_RENDER);
            }
            function createTiles() {
                eachTile(renderTile);
                tileSize = tiles[0][0].size();
                viewEl.style.width = vw * tileSize + "px";
                viewEl.style.height = vh * tileSize + "px";
                el.style.width = viewWidth * tileSize + "px";
                el.style.height = viewHeight * tileSize + "px";
            }
            self.addItem = function(item, classes) {
                if (!item.el) {
                    item.el = document.createElement("div");
                }
                if (classes) {
                    for (var i = 0; i < classes.length; i += 1) {
                        item.el.classList.add(classes[i]);
                    }
                }
                item.el.style.position = "absolute";
                items.push(item);
                viewEl.appendChild(item.el);
            };
            self.removeItem = function(item) {
                var index = items.indexOf(item);
                if (index !== -1) {
                    viewEl.removeChild(items[index].el);
                    items.splice(index, 1);
                }
            };
            self.setTarget = function(point) {
                target = point;
            };
            self.render = render;
            dispatcher(this);
            createTiles();
        }
        exports.events = events;
        exports.create = function(el, viewWidth, viewHeight, boardData, tileTypePath) {
            return new TileGameBoard(el, viewWidth, viewHeight, boardData, tileTypePath);
        };
        exports.getDistance = getDistance;
        exports.getAngle = getAngle;
        exports.getPointOnCircle = getPointOnCircle;
        exports.flipAngle = function(radians) {
            return radians > Math.PI ? radians - Math.PI : radians + Math.PI;
        };
    });
    //! node_modules/hbjs/src/utils/data/apply.js
    define("apply", [ "isFunction" ], function(isFunction) {
        return function(func, scope, args) {
            if (!isFunction(func)) {
                return;
            }
            args = args || [];
            switch (args.length) {
              case 0:
                return func.call(scope);

              case 1:
                return func.call(scope, args[0]);

              case 2:
                return func.call(scope, args[0], args[1]);

              case 3:
                return func.call(scope, args[0], args[1], args[2]);

              case 4:
                return func.call(scope, args[0], args[1], args[2], args[3]);

              case 5:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4]);

              case 6:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4], args[5]);
            }
            return func.apply(scope, args);
        };
    });
    //! node_modules/hbjs/src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
    });
    //! node_modules/hbjs/src/utils/async/dispatcher-event.js
    define("dispatcherEvent", function() {
        function Event(type) {
            this.type = type;
            this.defaultPrevented = false;
            this.propagationStopped = false;
            this.immediatePropagationStopped = false;
        }
        Event.prototype.preventDefault = function() {
            this.defaultPrevented = true;
        };
        Event.prototype.stopPropagation = function() {
            this.propagationStopped = true;
        };
        Event.prototype.stopImmediatePropagation = function() {
            this.immediatePropagationStopped = true;
        };
        Event.prototype.toString = function() {
            return this.type;
        };
        return Event;
    });
    //! node_modules/hbjs/src/utils/async/dispatcher.js
    define("dispatcher", [ "apply", "isFunction", "dispatcherEvent" ], function(apply, isFunction, Event) {
        function validateEvent(e) {
            if (!e) {
                throw Error("event cannot be undefined");
            }
        }
        var dispatcher = function(target, scope, map) {
            if (target && target.on && target.on.dispatcher) {
                return target;
            }
            target = target || {};
            var listeners = {};
            function getIndexOfListener(event, callback) {
                var list = listeners[event];
                if (list) {
                    for (var i = 0; i < list.length; i += 1) {
                        if (list[i].cb === callback) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            function off(event, callback) {
                validateEvent(event);
                var index = getIndexOfListener(event, callback), list = listeners[event];
                if (index !== -1) {
                    list.splice(index, 1);
                }
            }
            function on(event, callback, priority) {
                if (isFunction(callback)) {
                    validateEvent(event);
                    listeners[event] = listeners[event] || [];
                    listeners[event].push({
                        cb: callback,
                        priority: priority !== undefined ? priority : 10
                    });
                    listeners[event].sort(prioritySort);
                    return function() {
                        off(event, callback);
                    };
                }
            }
            on.dispatcher = true;
            function once(event, callback, priority) {
                if (isFunction(callback)) {
                    validateEvent(event);
                    function fn() {
                        off(event, fn);
                        apply(callback, scope || target, arguments);
                    }
                    return on(event, fn, priority);
                }
            }
            function prioritySort(a, b) {
                return a.priority - b.priority;
            }
            function mapListeners(item, number, list) {
                list[number] = item.cb;
            }
            function getListeners(event, strict) {
                validateEvent(event);
                var list, a = "*";
                if (event || strict) {
                    list = [];
                    if (listeners[a]) {
                        list = listeners[a].concat(list);
                    }
                    if (listeners[event]) {
                        list = listeners[event].concat(list);
                    }
                    list.map(mapListeners);
                    return list;
                }
                return listeners;
            }
            function removeAllListeners() {
                listeners = {};
            }
            function fire(callback, args) {
                return callback && apply(callback, target, args);
            }
            function dispatch(event) {
                validateEvent(event);
                var list = getListeners(event, true), len = list.length, i, event = typeof event === "object" ? event : new Event(event);
                if (len) {
                    arguments[0] = event;
                    for (i = 0; i < len; i += 1) {
                        if (!event.immediatePropagationStopped) {
                            fire(list[i], arguments);
                        }
                    }
                }
                return event;
            }
            if (scope && map) {
                target.on = scope[map.on] && scope[map.on].bind(scope);
                target.off = scope[map.off] && scope[map.off].bind(scope);
                target.once = scope[map.once] && scope[map.once].bind(scope);
                target.dispatch = target.fire = scope[map.dispatch].bind(scope);
            } else {
                target.on = on;
                target.off = off;
                target.once = once;
                target.dispatch = target.fire = dispatch;
            }
            target.getListeners = getListeners;
            target.removeAllListeners = removeAllListeners;
            return target;
        };
        return dispatcher;
    });
    //! node_modules/hbjs/src/utils/data/resolve.js
    define("resolve", [ "isUndefined" ], function(isUndefined) {
        var aryIndexRx = /\[(.*?)\]/g;
        function pathToArray(path, delimiter) {
            if (path instanceof Array) {
                return path;
            }
            delimiter = delimiter || ".";
            path = path || "";
            path = path.replace(aryIndexRx, delimiter + "$1");
            return path.split(delimiter);
        }
        function Resolve(data) {
            this.data = data || {};
        }
        var proto = Resolve.prototype;
        proto.get = function(path, delimiter) {
            var arr = pathToArray(path, delimiter), space = "", i = 0, len = arr.length;
            var data = this.data;
            while (data && i < len) {
                space = arr[i];
                data = data[space];
                if (data === undefined) {
                    break;
                }
                i += 1;
            }
            return data;
        };
        proto.set = function(path, value, delimiter) {
            if (isUndefined(path)) {
                throw new Error('Resolve requires "path"');
            }
            var arr = pathToArray(path, delimiter), space = "", i = 0, len = arr.length - 1;
            var data = this.data;
            while (i < len) {
                space = arr[i];
                if (data[space] === undefined) {
                    data = data[space] = {};
                } else {
                    data = data[space];
                }
                i += 1;
            }
            if (arr.length > 0) {
                data[arr.pop()] = value;
            }
            return this.data;
        };
        proto.default = function(path, value, delimiter) {
            if (isUndefined(this.get(path, delimiter))) {
                this.set(path, value, delimiter);
            }
        };
        proto.clear = function() {
            var d = this.data;
            for (var e in d) {
                if (d.hasOwnProperty(e)) {
                    delete d[e];
                }
            }
        };
        proto.path = function(path) {
            return this.set(path, {});
        };
        var resolve = function(data) {
            return new Resolve(data);
        };
        return resolve;
    });
    //! node_modules/hbjs/src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
    });
    //! node_modules/hbjs/src/utils/geom/getDistance.js
    define("getDistance", function() {
        return function getDistance(x1, y1, x2, y2) {
            return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
        };
    });
    //! node_modules/hbjs/src/utils/geom/getAngle.js
    define("getAngle", function() {
        return function getAngle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        };
    });
    //! node_modules/hbjs/src/utils/geom/getPointOnCircle.js
    define("getPointOnCircle", function() {
        return function getPointOnCircle(cx, cy, r, a) {
            return {
                x: cx + r * Math.cos(a),
                y: cy + r * Math.sin(a)
            };
        };
    });
    //! #################  YOUR CODE ENDS HERE  #################### //
    finalize();
    return global["tileBoard"];
})(this["tileBoard"] || {}, function() {
    return this;
}());