define('gameBoard', ['dispatcher', 'tile', 'getDistance', 'getAngle', 'getPointOnCircle'], function (dispatcher, tile, getDistance, getAngle, getPointOnCircle) {
    function GameBoard2d(el, viewWidth, viewHeight, boardData, tileTypePath) {
        var self = this;
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
                    tiles[x][y] = tiles[x][y] || tile.create(viewEl, x, y, tileTypePath);
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
                self.dispatch('after-keep-in-bounds', touchingTiles);
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
                return result;
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
                    var d = getDistance(point.x, point.y, pt.x, pt.y);
                    if (boardData[pt.y] && boardData[pt.y][pt.x]) {
                        pt.distance = d;
                        pt.tile = boardData[pt.y][pt.x];
                        result.push(pt);
                    }
                }
            }
            return result;
        }

        function render(targetX, targetY) {
            self.dispatch('before-render');
            var dataOffsetPoint = updateTarget();
            var ox = (viewOffset.x - dataOffsetPoint.vx) * tileSize;
            var oy = (viewOffset.y - dataOffsetPoint.vy) * tileSize;
            viewEl.style.transform = "translate(" + ox + "px, " + oy + "px)";
            eachTile(renderTile, dataOffsetPoint);
            self.dispatch('after-render');
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
        self.addItem = function(item, x, y) {
            items.push({x:x, y:y, item:item});
            viewEl.appendChild(item.el);
        };

        self.setTarget = function(point) {
            target = point;
        };

        self.render = render;

        dispatcher(this);

        createTiles();
    }

    exports.create = function (el, viewWidth, viewHeight, boardData, tileTypePath) {
        return new GameBoard2d(el, viewWidth, viewHeight, boardData, tileTypePath);
    };
    exports.getDistance = getDistance;
    exports.getAngle = getAngle;
    exports.getPointOnCircle = getPointOnCircle;
    exports.flipAngle = function(radians) {
        return radians > Math.PI ? radians - Math.PI : radians + Math.PI;
    };
});