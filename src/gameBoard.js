define('gameBoard', ['dispatcher', 'tile', 'getDistance', 'getAngle', 'getPointOnCircle', 'each', 'http', 'defer', 'matchAll'], function (dispatcher, tile, getDistance, getAngle, getPointOnCircle, each, http, defer, matchAll) {

    var events = {
        TILE_RENDER_CHANGE: 'tile-render-change',
        AFTER_KEEP_IN_BOUNDS: 'after-keep-in-bounds',
        BEFORE_RENDER: 'before-render',
        AFTER_RENDER: 'after-render',
        TOUCHING_ITEMS: 'touching-items',
        ERROR: 'error',
        READY: 'ready'
    };

    function TileGameBoard(el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath) {
        var self = this;
        self.events = events;
        var target;
        var viewOffset = {x:-1, y:-1};
        var tiles = [];
        var items = [];
        var viewEl = document.createElement('div');
            viewEl.classList.add('view');
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
//TODO: needs to be external so we can switch maps
        function load(boardDataOrUrl, entrance) {
            deferred = defer();
            // remove all items.
            while(items.length) {
                self.removeItem(items[0]);
            }
            self.addItem(target);
            if (typeof boardDataOrUrl === "string") {
                http.get({url: boardDataOrUrl, success: onLoadSuccess, error: onLoadFail});
            } else {
                onLoadSuccess({data: {boardData: boardDataOrUrl, entrance:entrance || 0}});
            }
        }

        function onLoadSuccess(response) {
            rawData = response.data;
            boardData = rawData.boardData;
            var myVW = viewWidth > rawData.visibleMaxWidth ? rawData.visibleMaxWidth : viewWidth;
            var myVH = viewHeight > rawData.visibleMaxHeight ? rawData.visibleMaxHeight : viewHeight;
            vw = myVW + 2;
            vh = myVH + 2;
            padX = Math.floor(vw * 0.5);
            padY = Math.floor(vh * 0.5);
            xlen = boardData[0].length;
            ylen = boardData.length;
//TODO: clear tiles so we can switch maps.
            viewEl.innerHTML = '';
            tiles.length = 0;
            // create tiles
            eachTile(renderTile);
            tileSize = tiles[0][0].size();
            viewEl.style.width = vw * tileSize + 'px';
            viewEl.style.height = vh * tileSize + 'px';
            el.style.width = myVW * tileSize + 'px';
            el.style.height = myVH * tileSize + 'px';

            deferred.resolve(boardData);
            deferred = null;

            // add items to the board.
            if (rawData.items) {
                each(rawData.items, self.addItem);
            }
            // if they don't specify a starting position that matches. then they get the first one
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
            var offPoint = {x:0, y:0}, xdif, ydif, ox = 0, oy = 0, rx, ry, vx, vy, result;
            if (target) {
                var touchingTiles = keepInBounds(target);
//TODO: need to send out items that are within half a unit.
                var evt = self.dispatch(events.AFTER_KEEP_IN_BOUNDS, touchingTiles);
                if (evt.defaultPrevented) {
                    // put them back to their previous position.
                    target.x = target.$px;
                    target.y = target.$py;
                }
                // after this point it is offsetting for the view.
                // logic changes for which square to be on should be done before this point
                rx = target.x % 1 || 0;
                ry = target.y % 1 || 0;
                offPoint.x = Math.floor(target.x) - padX;
                offPoint.y = Math.floor(target.y) - padY;
                xdif = offPoint.x + padX;
                ydif = offPoint.y + padY;
                if (xdif < padX) {
                    ox = -(padX - xdif) + 1;
                    vx = ox < 0 ? 0 : rx;
                } else if (offPoint.x + rx > xlen - padX*2){
                    ox = offPoint.x + padX*2 - xlen;
                    vx = 0;
                } else {
                    vx = rx;
                }
                if (ydif < padY) {
                    oy = -(padY - ydif) + 1;
                    vy = oy < 0 ? 0 : ry;
                } else if(offPoint.y + ry > ylen - padY*2) {
                    oy = offPoint.y + padY*2 - ylen;
                    vy = 0;
                } else {
                    vy = ry;
                }
                result = {
                    x:ox,
                    y:oy,
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
            // console.log(dop.x, dop.y, mx, my);
            var item, touchingItems = [];
            for(var i = 0; i < items.length; i += 1) {
                item = items[i];
                if (item === target) {
                    items.splice(i, 1);
                    i -= 1;
                } else {
                    // if not in view. hide it
                    item.el.style.left = (item.x - mx + padX) * tileSize + "px";
                    item.el.style.top = (item.y - my + padY) * tileSize + "px";
                    if (getDistance(item.x, item.y, target.x, target.y) < 0.9) {
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
            point.x = point.x > maxW ? maxW : (point.x < 0 ? 0 : point.x);
            point.y = point.y > maxH ? maxH : (point.y < 0 ? 0 : point.y);

            // now gather blocks around. If any of them we are not permitted to move to, then we must move them out of that space.
            var points = {};
            var fx = Math.floor(point.x);
            var fy = Math.floor(point.y);
            var cx = Math.ceil(point.x);
            var cy = Math.ceil(point.y);
            points[fx + ':' + fy] = {x:fx, y:fy};
            points[fx + ':' + cy] = {x:fx, y:cy};
            points[cx + ':' + fy] = {x:cx, y:fy};
            points[cx + ':' + cy] = {x:cx, y:cy};
            var result = [];
            for(var i in points) {
                if (points.hasOwnProperty(i)) {
                    var pt = points[i];
                    if (boardData[pt.y] && boardData[pt.y][pt.x] && getDistance(point.x, point.y, pt.x, pt.y) < 0.9) {
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
                var oxp = (viewOffset.x - dataOffsetPoint.vx);
                var oyp = (viewOffset.y - dataOffsetPoint.vy);
                viewEl.style.transform = "translate(" + (oxp * tileSize) + "px, " + (oyp * tileSize) + "px)";
                updateItems(dataOffsetPoint);
                eachTile(renderTile, dataOffsetPoint);
                self.dispatch(events.AFTER_RENDER);
            }
        }

        //TODO: add items to a point on the grid.
        self.addItem = function(item, classes) {
            if (deferred) {
                deferred.promise.then(function() {
                    self.addItem(item, classes);
                });
                return;
            }
            if (!classes || (classes && !(typeof classes === "string" || classes instanceof Array))) {
                classes = item.classes;
            }
            if (!item.el) {
                item.el = document.createElement('div');
            }
            if (classes) {
                if (classes.indexOf(' ') !== -1) {
                    classes = classes.split(' ');
                }
                for(var i = 0; i < classes.length; i += 1) {
                    if (classes[i]) {// in case they had double spaces in a class string that got split.
                        item.el.classList.add(classes[i]);
                    }
                }
            }
            item.el.style.position = 'absolute';
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
            return tiles;
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
            for(var i = 0; i < r2; i += 1) {
                tiles.push([]);
                for(var j = 0; j < r2; j += 1) {
                    var iy = i + ymin;
                    var ix = j + xmin;
                    tiles[i][j] = boardData[iy] && boardData[iy][ix];
                }
            }
            var itms = [];
            for(i = 0; i < items.length; i += 1) {
                var item = items[i];
                if (item.x >= xmin && item.x <= xmax && item.y >= ymin && item.y <= ymax) {
                    itms.push(item);
                }
            }
            return {tiles:tiles, items:itms};
        };

        self.render = render;

        dispatcher(this);

        self.load = load;
        load(boardDataOrUrl);
    }

    exports.events = events;
    exports.create = function (el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath) {
        return new TileGameBoard(el, viewWidth, viewHeight, boardDataOrUrl, tileTypePath);
    };
    exports.getDistance = getDistance;
    exports.getAngle = getAngle;
    exports.getPointOnCircle = getPointOnCircle;
    exports.flipAngle = function(radians) {
        return radians > Math.PI ? radians - Math.PI : radians + Math.PI;
    };
});