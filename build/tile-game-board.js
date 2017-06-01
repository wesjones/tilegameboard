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
    //! node_modules/hbjs/src/utils/ajax/http.js
    define("http", [ "extend" ], function(extend) {
        var serialize = function(obj) {
            var str = [];
            for (var p in obj) if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        };
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        function getRequestResult(that) {
            var headers = parseResponseHeaders(this.getAllResponseHeaders());
            var response = this.responseText.trim();
            var start;
            var end;
            if (response) {
                start = response[0];
                end = response[response.length - 1];
            }
            if (response && (start === "{" && end === "}") || start === "[" && end === "]") {
                response = response ? JSON.parse(response.replace(/\/\*.*?\*\//g, "")) : response;
            }
            return {
                data: response,
                request: {
                    method: that.method,
                    url: that.url,
                    data: that.data,
                    headers: that.headers
                },
                headers: headers,
                status: this.status
            };
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.data = options.data;
            that.headers = options.headers;
            that.timeout = options.timeout;
            that.ontimeout = options.ontimeout;
            that.async = options.async === undefined ? true : options.async;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.method === "GET" && that.data) {
                var concat = that.url.indexOf("?") > -1 ? "&" : "?";
                that.url += concat + serialize(that.data);
            } else {
                that.data = JSON.stringify(that.data);
            }
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    var result = getRequestResult.call(this, that), self = this;
                    function onLoad() {
                        if (self.status >= 200 && self.status < 400) {
                            that.success.call(self, result);
                        } else if (that.error !== undefined) {
                            that.error.call(self, result);
                        }
                    }
                    if (this.onloadInterceptor) {
                        this.onloadInterceptor(onLoad, result);
                    } else {
                        onLoad();
                    }
                };
            }
            if (that.timeout) {
                that.xhr.timeout = that.timeout;
                that.xhr.ontimeout = function() {
                    var result = getRequestResult.call(this, that);
                    if (that.ontimeout) {
                        that.ontimeout.call(this, result);
                    } else if (that.error) {
                        that.error.call(this, result);
                    }
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    var result = getRequestResult.call(this, that);
                    that.error.call(this, result);
                };
            }
            that.xhr.open(that.method, that.url, that.async);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.data);
            return that;
        };
        Request.prototype.setHeaders = function() {
            var that = this, headers = that.headers, key;
            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    that.xhr.setRequestHeader(key, headers[key]);
                }
            }
            return that;
        };
        function parseResponseHeaders(str) {
            var list = str.split("\n");
            var headers = {};
            var parts;
            var i = 0, len = list.length;
            while (i < len) {
                parts = list[i].split(": ");
                if (parts[0] && parts[1]) {
                    parts[0] = parts[0].split("-").join("").split("");
                    parts[0][0] = parts[0][0].toLowerCase();
                    headers[parts[0].join("")] = parts[1];
                }
                i += 1;
            }
            return headers;
        }
        function addDefaults(options, defaults) {
            return extend(options, defaults);
        }
        function handleInterceptor(options) {
            return !!(result.intercept && result.intercept(options, Request));
        }
        for (i = 0; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success, error) {
                    var options = {};
                    if (url === undefined) {
                        throw new Error("CORS: url must be defined");
                    }
                    if (typeof url === "object") {
                        options = url;
                    } else {
                        if (typeof success === "function") {
                            options.success = success;
                        }
                        if (typeof error === "function") {
                            options.error = error;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    addDefaults(options, result.defaults);
                    if (handleInterceptor(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.intercept = null;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    //! src/gameBoard.js
    define("gameBoard", [ "dispatcher", "tile", "getDistance", "getAngle", "getPointOnCircle", "each", "http", "defer", "matchAll" ], function(dispatcher, tile, getDistance, getAngle, getPointOnCircle, each, http, defer, matchAll) {
        var events = {
            TILE_RENDER_CHANGE: "tile-render-change",
            AFTER_KEEP_IN_BOUNDS: "after-keep-in-bounds",
            BEFORE_RENDER: "before-render",
            AFTER_RENDER: "after-render",
            TOUCHING_ITEMS: "touching-items",
            ERROR: "error",
            READY: "ready"
        };
        function TileGameBoard(el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath) {
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
            var vw;
            var vh;
            var padX;
            var padY;
            var boardData;
            var rawData;
            var xlen;
            var ylen;
            var tileSize;
            var deferred;
            function load(boardDataOrUrl, entrance) {
                deferred = defer();
                while (items.length) {
                    self.removeItem(items[0]);
                }
                self.addItem(target);
                if (typeof boardDataOrUrl === "string") {
                    http.get({
                        url: boardDataOrUrl,
                        success: onLoadSuccess,
                        error: onLoadFail
                    });
                } else {
                    onLoadSuccess({
                        data: {
                            boardData: boardDataOrUrl,
                            entrance: entrance || 0
                        }
                    });
                }
            }
            function onLoadSuccess(response) {
                rawData = response.data;
                boardData = rawData.boardData;
                var myVW = viewWidth > rawData.visibleMaxWidth ? rawData.visibleMaxWidth : viewWidth;
                var myVH = viewHeight > rawData.visibleMaxHeight ? rawData.visibleMaxHeight : viewHeight;
                vw = myVW + 2;
                vh = myVH + 2;
                padX = Math.floor(vw * .5);
                padY = Math.floor(vh * .5);
                xlen = boardData[0].length;
                ylen = boardData.length;
                for (var y = 0; y < boardData.length; y += 1) {
                    for (var x = 0; x < boardData[y].length; x += 1) {
                        boardData[y][x].y = y;
                        boardData[y][x].x = x;
                    }
                }
                viewEl.innerHTML = "";
                tiles.length = 0;
                eachTile(renderTile);
                tileSize = tiles[0][0].size();
                viewEl.style.width = vw * tileSize + "px";
                viewEl.style.height = vh * tileSize + "px";
                el.style.width = myVW * tileSize + "px";
                el.style.height = myVH * tileSize + "px";
                deferred.resolve(boardData);
                deferred = null;
                if (rawData.items) {
                    each(rawData.items, self.addItem);
                }
                rawData.entrance = rawData.entrance || 0;
                if (rawData.startingPositions.length) {
                    target.x = rawData.startingPositions[rawData.entrance].x;
                    target.y = rawData.startingPositions[rawData.entrance].y;
                }
                render();
                self.dispatch(events.READY);
            }
            function onLoadFail() {
                self.dispatch(events.ERROR, "Unable to load " + boardDataOrUrl);
            }
            function eachTile(fn, dataOffsetPoint) {
                for (var y = 0; y < vh; y += 1) {
                    tiles[y] = tiles[y] || [];
                    for (var x = 0; x < vw; x += 1) {
                        tiles[y][x] = tiles[y][x] || tile.create(viewEl, x, y, tileTypePath, self);
                        fn(tiles[y][x], x, y, dataOffsetPoint);
                    }
                }
            }
            function renderTile(tile, x, y, dataOffsetPoint) {
                if (target && dataOffsetPoint) {
                    var ox = Math.floor(target.x) - padX + x - dataOffsetPoint.x;
                    var oy = Math.floor(target.y) - padY + y - dataOffsetPoint.y;
                    tile.data(boardData[oy] && boardData[oy][ox]);
                    tile.render(ox, oy);
                }
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
                        if (getDistance(item.x, item.y, target.x, target.y) < .9) {
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
                        if (boardData[pt.y] && boardData[pt.y][pt.x] && getDistance(point.x, point.y, pt.x, pt.y) < .9) {
                            pt.tile = boardData[pt.y][pt.x];
                            result.push(pt);
                        }
                    }
                }
                return result;
            }
            function render() {
                if (!deferred) {
                    self.dispatch(events.BEFORE_RENDER);
                    var dataOffsetPoint = updateTarget();
                    var oxp = viewOffset.x - dataOffsetPoint.vx;
                    var oyp = viewOffset.y - dataOffsetPoint.vy;
                    viewEl.style.transform = "translate(" + oxp * tileSize + "px, " + oyp * tileSize + "px)";
                    updateItems(dataOffsetPoint);
                    eachTile(renderTile, dataOffsetPoint);
                    self.dispatch(events.AFTER_RENDER);
                }
            }
            self.addItem = function(item, classes) {
                if (deferred) {
                    deferred.promise.then(function() {
                        self.addItem(item, classes);
                    });
                    return;
                }
                if (!classes || classes && !(typeof classes === "string" || classes instanceof Array)) {
                    classes = item.classes;
                }
                if (!item.el) {
                    item.el = document.createElement("div");
                }
                if (classes) {
                    if (classes.indexOf(" ") !== -1) {
                        classes = classes.split(" ");
                    }
                    for (var i = 0; i < classes.length; i += 1) {
                        if (classes[i]) {
                            item.el.classList.add(classes[i]);
                        }
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
                target.el.style.zIndex = 1;
            };
            self.getAllTiles = function() {
                return boardData;
            };
            self.getAllItems = function() {
                return items;
            };
            self.getRawData = function() {
                return rawData;
            };
            self.getTiles = function(x, y, radius) {
                var r2 = radius * 2 + 1;
                var xmin = Math.floor(x - radius);
                var ymin = Math.floor(y - radius);
                var xmax = Math.ceil(x + radius);
                var ymax = Math.ceil(y + radius);
                var tiles = [];
                for (var i = 0; i < r2; i += 1) {
                    tiles.push([]);
                    for (var j = 0; j < r2; j += 1) {
                        var iy = i + ymin;
                        var ix = j + xmin;
                        tiles[i][j] = boardData[iy] && boardData[iy][ix];
                    }
                }
                var itms = [];
                for (i = 0; i < items.length; i += 1) {
                    var item = items[i];
                    if (item.x >= xmin && item.x <= xmax && item.y >= ymin && item.y <= ymax) {
                        itms.push(item);
                    }
                }
                return {
                    tiles: tiles,
                    items: itms
                };
            };
            self.render = render;
            dispatcher(this);
            self.load = load;
            load(boardDataOrUrl);
        }
        exports.events = events;
        exports.create = function(el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath) {
            return new TileGameBoard(el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath);
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
    //! node_modules/hbjs/src/utils/iterators/each.js
    define("each", function() {
        var regex = /([^\s,]+)/g;
        function getParamNames(fn) {
            var funStr = fn.toString();
            return funStr.slice(funStr.indexOf("(") + 1, funStr.indexOf(")")).match(regex);
        }
        function each(list) {
            var params, handler, done;
            if (typeof arguments[1] === "function") {
                handler = arguments[1];
                done = arguments[2];
            } else {
                params = arguments[1] === null || arguments[1] === undefined ? {} : arguments[1];
                handler = arguments[2];
                done = arguments[3];
            }
            if (!list) {
                if (done) {
                    done(undefined, list, params);
                }
                return;
            }
            var next;
            var index = 0;
            var returnVal;
            var paramNames = getParamNames(handler);
            var keys;
            var len;
            if (list.length === undefined) {
                keys = Object.keys(list);
                len = keys.length;
            }
            var iterate = function() {
                len = keys ? len : list.length;
                if (index < len) {
                    try {
                        if (params) {
                            returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, params, next);
                        } else {
                            returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, next);
                        }
                    } catch (e) {
                        if (done) {
                            done(e, list, params);
                        } else {
                            throw e;
                        }
                    }
                    if (returnVal !== undefined) {
                        iterate = null;
                        if (done) {
                            done(returnVal, list, params);
                            return;
                        }
                        return returnVal;
                    }
                    if (!next) {
                        index += 1;
                        iterate();
                    }
                } else if (typeof done === "function") {
                    iterate = null;
                    done(null, list, params);
                }
            };
            var now = Date.now();
            function iter(threshold) {
                var current;
                index += 1;
                if (threshold) {
                    current = Date.now();
                    if (current < now + threshold) {
                        current = Date.now();
                        iterate();
                        return;
                    }
                    now = current;
                }
                setTimeout(iterate, 0);
            }
            if (params) {
                if (paramNames && paramNames.length === 5) {
                    next = iter;
                }
            } else {
                if (paramNames && paramNames.length === 4) {
                    next = iter;
                }
            }
            var syncReturnVal = iterate();
            if (syncReturnVal !== undefined) {
                return syncReturnVal;
            }
            if (!done && params) {
                return params;
            }
        }
        return each;
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
    //! node_modules/hbjs/src/utils/data/extend.js
    define("extend", [ "isWindow", "apply", "toArray", "isArray", "isDate", "isRegExp" ], function(isWindow, apply, toArray, isArray, isDate, isRegExp) {
        var extend = function(target, source) {
            if (isWindow(source)) {
                throw Error("Can't extend! Making copies of Window instances is not supported.");
            }
            if (source === target) {
                return target;
            }
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            if (!target && source && typeof source === "object") {
                target = {};
            }
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (isDate(item[j])) {
                            target[j] = new Date(item[j].getTime());
                        } else if (isRegExp(item[j])) {
                            target[j] = new RegExp(item[j]);
                        } else if (j === "length" && target instanceof Array) {} else if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = apply(extend, options, [ target[j], item[j] ]);
                        } else if (isArray(item[j])) {
                            copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                            if (options && options.arrayAsObject) {
                                if (!target[j]) {
                                    target[j] = {
                                        length: copy.length
                                    };
                                }
                                if (target[j] instanceof Array) {
                                    target[j] = apply(extend, options, [ {}, target[j] ]);
                                }
                            } else {
                                target[j] = target[j] || [];
                            }
                            if (copy.length) {
                                target[j] = apply(extend, options, [ target[j], copy ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = apply(extend, options, [ [], target[j] ]);
                                }
                            }
                            target[j] = apply(extend, options, [ target[j] || {}, item[j] ]);
                        } else if (options.override !== false || target[j] === undefined) {
                            target[j] = item[j];
                        }
                    }
                }
                i += 1;
            }
            return target;
        };
        return extend;
    });
    //! node_modules/hbjs/src/utils/validators/isWindow.js
    define("isWindow", function() {
        var isWindow = function(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        return isWindow;
    });
    //! node_modules/hbjs/src/utils/formatters/toArray.js
    define("toArray", [ "isArguments", "isArray", "isUndefined" ], function(isArguments, isArray, isUndefined) {
        var toArray = function(value) {
            if (isArguments(value)) {
                return Array.prototype.slice.call(value, 0) || [];
            }
            try {
                if (isArray(value)) {
                    return value;
                }
                if (!isUndefined(value)) {
                    return [].concat(value);
                }
            } catch (e) {}
            return [];
        };
        return toArray;
    });
    //! node_modules/hbjs/src/utils/validators/isArguments.js
    define("isArguments", function() {
        var toString = function() {
            var value = [];
            for (var e in this) {
                if (this.hasOwnProperty(e)) {
                    value.push("" + e);
                }
            }
            return "[" + value.join(", ") + "]";
        };
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && (!value.callee || toString.call(value.callee) === "[object Function]");
            }
            return isArguments;
        };
        return isArguments;
    });
    //! node_modules/hbjs/src/utils/validators/isArray.js
    define("isArray", function() {
        Array.prototype.__isArray = true;
        Object.defineProperty(Array.prototype, "__isArray", {
            enumerable: false,
            writable: true
        });
        var isArray = function(val) {
            return val ? !!val.__isArray : false;
        };
        return isArray;
    });
    //! node_modules/hbjs/src/utils/validators/isDate.js
    define("isDate", function() {
        var isDate = function(val) {
            return val instanceof Date;
        };
        return isDate;
    });
    //! node_modules/hbjs/src/utils/validators/isRegExp.js
    define("isRegExp", function() {
        var isRegExp = function(value) {
            return Object.prototype.toString.call(value) === "[object RegExp]";
        };
        return isRegExp;
    });
    //! node_modules/hbjs/src/utils/async/defer.js
    define("defer", [ "hb.debug" ], function(debug) {
        var defer = function(undef) {
            var nextTick, isFunc = function(f) {
                return typeof f === "function";
            }, isArray = function(a) {
                return Array.isArray ? Array.isArray(a) : a instanceof Array;
            }, isObjOrFunc = function(o) {
                return !!(o && (typeof o).match(/function|object/));
            }, isNotVal = function(v) {
                return v === false || v === undef || v === null;
            }, slice = function(a, offset) {
                return [].slice.call(a, offset);
            }, undefStr = "undefined", tErr = typeof TypeError === undefStr ? Error : TypeError;
            if (typeof process !== undefStr && process.nextTick) {
                nextTick = process.nextTick;
            } else if (typeof MessageChannel !== undefStr) {
                var ntickChannel = new MessageChannel(), queue = [];
                ntickChannel.port1.onmessage = function() {
                    queue.length && queue.shift()();
                };
                nextTick = function(cb) {
                    queue.push(cb);
                    ntickChannel.port2.postMessage(0);
                };
            } else {
                nextTick = function(cb) {
                    setTimeout(cb, 0);
                };
            }
            function rethrow(e) {
                nextTick(function() {
                    throw e;
                });
            }
            function promise_success(fulfilled) {
                return this.then(fulfilled, undef);
            }
            function promise_error(failed) {
                return this.then(undef, failed);
            }
            function promise_apply(fulfilled, failed) {
                return this.then(function(a) {
                    return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [ a ]) : defer.onlyFuncs ? a : fulfilled;
                }, failed || undef);
            }
            function promise_ensure(cb) {
                function _cb() {
                    cb();
                }
                this.then(_cb, _cb);
                return this;
            }
            function promise_nodify(cb) {
                return this.then(function(a) {
                    return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0, 0, undefined) && a : [ undefined, a ]) : defer.onlyFuncs ? a : cb;
                }, function(e) {
                    return cb(e);
                });
            }
            function promise_rethrow(failed) {
                return this.then(undef, failed ? function(e) {
                    failed(e);
                    throw e;
                } : rethrow);
            }
            var defer = function(alwaysAsync) {
                var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn) {
                    fn();
                }, status = 0, pendings = [], value, _promise = {
                    then: function(fulfilled, failed) {
                        var d = defer();
                        pendings.push([ function(value) {
                            try {
                                if (isNotVal(fulfilled)) {
                                    d.resolve(value);
                                } else {
                                    var returnVal = isFunc(fulfilled) ? fulfilled(value) : defer.onlyFuncs ? value : fulfilled;
                                    if (returnVal === undefined) {
                                        returnVal = value;
                                    }
                                    d.resolve(returnVal);
                                }
                            } catch (e) {
                                d.reject(e);
                                debug.warn(e.stack || e.backtrace || e.stacktrace);
                            }
                        }, function(err) {
                            if (isNotVal(failed) || !isFunc(failed) && defer.onlyFuncs) {
                                d.reject(err);
                            }
                            if (failed) {
                                try {
                                    d.resolve(isFunc(failed) ? failed(err) : failed);
                                } catch (e) {
                                    d.reject(e);
                                }
                            }
                        } ]);
                        status !== 0 && alwaysAsyncFn(execCallbacks);
                        return d.promise;
                    },
                    success: promise_success,
                    error: promise_error,
                    otherwise: promise_error,
                    apply: promise_apply,
                    spread: promise_apply,
                    ensure: promise_ensure,
                    nodify: promise_nodify,
                    rethrow: promise_rethrow,
                    isPending: function() {
                        return !!(status === 0);
                    },
                    getStatus: function() {
                        return status;
                    }
                };
                _promise.toSource = _promise.toString = _promise.valueOf = function() {
                    return value === undef ? this : value;
                };
                function execCallbacks() {
                    if (status === 0) {
                        return;
                    }
                    var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
                    pendings = [];
                    for (;i < l; i++) {
                        (cb = cbs[i][cbIndex]) && cb(value);
                    }
                }
                function _resolve(val) {
                    var done = false;
                    function once(f) {
                        return function(x) {
                            if (done) {
                                return undefined;
                            } else {
                                done = true;
                                return f(x);
                            }
                        };
                    }
                    if (status) {
                        return this;
                    }
                    try {
                        var then = isObjOrFunc(val) && val.then;
                        if (isFunc(then)) {
                            if (val === _promise) {
                                throw new tErr("Promise can't resolve itself");
                            }
                            then.call(val, once(_resolve), once(_reject));
                            return this;
                        }
                    } catch (e) {
                        once(_reject)(e);
                        return this;
                    }
                    alwaysAsyncFn(function() {
                        value = val;
                        status = 1;
                        execCallbacks();
                    });
                    return this;
                }
                function _reject(Err) {
                    status || alwaysAsyncFn(function() {
                        try {
                            throw Err;
                        } catch (e) {
                            value = e;
                        }
                        status = -1;
                        execCallbacks();
                    });
                    return this;
                }
                return {
                    promise: _promise,
                    resolve: _resolve,
                    fulfill: _resolve,
                    reject: _reject
                };
            };
            defer.deferred = defer.defer = defer;
            defer.nextTick = nextTick;
            defer.alwaysAsync = true;
            defer.onlyFuncs = true;
            defer.resolved = defer.fulfilled = function(value) {
                return defer(true).resolve(value).promise;
            };
            defer.rejected = function(reason) {
                return defer(true).reject(reason).promise;
            };
            defer.wait = function(time) {
                var d = defer();
                setTimeout(d.resolve, time || 0);
                return d.promise;
            };
            defer.delay = function(fn, delay) {
                var d = defer();
                setTimeout(function() {
                    try {
                        d.resolve(fn.apply(null));
                    } catch (e) {
                        d.reject(e);
                    }
                }, delay || 0);
                return d.promise;
            };
            defer.promisify = function(promise) {
                if (promise && isFunc(promise.then)) {
                    return promise;
                }
                return defer.resolved(promise);
            };
            function multiPromiseResolver(callerArguments, returnPromises) {
                var promises = slice(callerArguments);
                if (promises.length === 1 && isArray(promises[0])) {
                    if (!promises[0].length) {
                        return defer.fulfilled([]);
                    }
                    promises = promises[0];
                }
                var args = [], d = defer(), c = promises.length;
                if (!c) {
                    d.resolve(args);
                } else {
                    var resolver = function(i) {
                        promises[i] = defer.promisify(promises[i]);
                        promises[i].then(function(v) {
                            if (!(i in args)) {
                                args[i] = returnPromises ? promises[i] : v;
                                --c || d.resolve(args);
                            }
                        }, function(e) {
                            if (!(i in args)) {
                                if (!returnPromises) {
                                    d.reject(e);
                                } else {
                                    args[i] = promises[i];
                                    --c || d.resolve(args);
                                }
                            }
                        });
                    };
                    for (var i = 0, l = c; i < l; i++) {
                        resolver(i);
                    }
                }
                return d.promise;
            }
            defer.all = function() {
                return multiPromiseResolver(arguments, false);
            };
            defer.resolveAll = function() {
                return multiPromiseResolver(arguments, true);
            };
            defer.nodeCapsule = function(subject, fn) {
                if (!fn) {
                    fn = subject;
                    subject = void 0;
                }
                return function() {
                    var d = defer(), args = slice(arguments);
                    args.push(function(err, res) {
                        err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
                    });
                    try {
                        fn.apply(subject, args);
                    } catch (e) {
                        d.reject(e);
                    }
                    return d.promise;
                };
            };
            return defer;
        }();
        return defer;
    });
    //! node_modules/hbjs/src/hb/debug/debug.js
    define("hb.debug", function() {
        var errors = {
            E0: "",
            E1: "",
            E2: "",
            E3: "",
            E4: "",
            E5: "",
            E6a: "",
            E6b: "",
            E7: "",
            E8: "",
            E9: "",
            E10: "",
            E11: "",
            E12: ""
        };
        var fn = function() {};
        var statItem = {
            clear: fn,
            next: fn,
            inc: fn,
            dec: fn
        };
        var db = {
            log: fn,
            info: fn,
            warn: fn,
            error: fn,
            stat: function() {
                return statItem;
            },
            getStats: fn,
            flushStats: fn
        };
        for (var i in errors) {
            errors[i] = i;
        }
        return {
            ignoreErrors: true,
            log: fn,
            info: fn,
            warn: fn,
            register: function() {
                return db;
            },
            liveStats: fn,
            getStats: fn,
            logStats: fn,
            stats: fn,
            errors: errors
        };
    });
    //! node_modules/hbjs/src/utils/iterators/matchAll.js
    define("matchAll", [ "isMatch" ], function(isMatch) {
        function matchAll(ary, filterObj) {
            var result = [];
            for (var i = 0; i < ary.length; i += 1) {
                if (isMatch(ary[i], filterObj)) {
                    result.push(ary[i]);
                }
            }
            return result;
        }
        return matchAll;
    });
    //! node_modules/hbjs/src/utils/validators/isMatch.js
    define("isMatch", [ "isRegExp", "isDate" ], function(isRegExp, isDate) {
        var primitive = [ "string", "number", "boolean" ];
        function isMatch(item, filterObj) {
            var itemType;
            if (item === filterObj) {
                return true;
            } else if (typeof filterObj === "object") {
                itemType = typeof item;
                if (primitive.indexOf(itemType) !== -1) {
                    if (isRegExp(filterObj) && !filterObj.test(item + "")) {
                        return false;
                    } else if (isDate(filterObj)) {
                        if (isDate(item) && filterObj.getTime() === item.getTime()) {
                            return true;
                        }
                        return false;
                    }
                }
                if (item instanceof Array && filterObj[0] !== undefined) {
                    for (var i = 0; i < item.length; i += 1) {
                        if (isMatch(item[i], filterObj[0])) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    for (var j in filterObj) {
                        if (filterObj.hasOwnProperty(j)) {
                            if (item[j] === undefined && !item.hasOwnProperty(j)) {
                                return false;
                            }
                            if (!isMatch(item[j], filterObj[j])) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            } else if (typeof filterObj === "function") {
                return !!filterObj(item);
            }
            return false;
        }
        return isMatch;
    });
    //! #################  YOUR CODE ENDS HERE  #################### //
    finalize();
    return global["tileBoard"];
})(this["tileBoard"] || {}, function() {
    return this;
}());