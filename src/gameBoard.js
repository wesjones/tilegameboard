define('gameBoard', ['dispatcher', 'tile', 'getDistance', 'getAngle', 'getPointOnCircle'], function (dispatcher, tile, getDistance, getAngle, getPointOnCircle) {

    var events = {
        TILE_RENDER_CHANGE: 'tile-render-change',
        AFTER_KEEP_IN_BOUNDS: 'after-keep-in-bounds',
        BEFORE_RENDER: 'before-render',
        AFTER_RENDER: 'after-render',
        TOUCHING_ITEMS: 'touching-items'
    };

    function TileGameBoard(el, viewWidth, viewHeight, boardData, tileTypePath) {
        var self = this;
        self.events = events;
        var target;
        var viewOffset = {x:-1, y:-1};
        var tiles = [];
        var items = [];
        var viewEl = document.createElement('div');
            viewEl.classList.add('view');
            el.appendChild(viewEl);
        var vw = viewWidth + 2;
        var vh = viewHeight + 2;
        var padX = Math.floor(vw * 0.5);
        var padY = Math.floor(vh * 0.5);
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
            var oxp = (viewOffset.x - dataOffsetPoint.vx);
            var oyp = (viewOffset.y - dataOffsetPoint.vy);
            viewEl.style.transform = "translate(" + (oxp * tileSize) + "px, " + (oyp * tileSize) + "px)";
            updateItems(dataOffsetPoint);
            eachTile(renderTile, dataOffsetPoint);
            self.dispatch(events.AFTER_RENDER);
        }

        function createTiles() {
            eachTile(renderTile);
            tileSize = tiles[0][0].size();
            viewEl.style.width = vw * tileSize + 'px';
            viewEl.style.height = vh * tileSize + 'px';
            el.style.width = viewWidth * tileSize + 'px';
            el.style.height = viewHeight * tileSize + 'px';
        }

        //TODO: add items to a point on the grid.
        self.addItem = function(item, classes) {
            if (!item.el) {
                item.el = document.createElement('div');
            }
            if (classes) {
                for(var i = 0; i < classes.length; i += 1) {
                    item.el.classList.add(classes[i]);
                }
            }
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
    exports.create = function (el, viewWidth, viewHeight, boardData, tileTypePath) {
        return new TileGameBoard(el, viewWidth, viewHeight, boardData, tileTypePath);
    };
    exports.getDistance = getDistance;
    exports.getAngle = getAngle;
    exports.getPointOnCircle = getPointOnCircle;
    exports.flipAngle = function(radians) {
        return radians > Math.PI ? radians - Math.PI : radians + Math.PI;
    };
});