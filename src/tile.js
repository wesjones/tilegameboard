define('tile', ['resolve'], function(resolve) {
    function addType(list, currentType, newType) {
        var index;
        if (currentType === newType) {
            return currentType;
        }
        if ((index = list.indexOf(currentType)) !== -1) {
            list.splice(index, 1);// remove class
            currentType = '';
        }
        if (list.indexOf(newType) === -1) {
            list.push(newType);
        }
        return newType || currentType;
    }

    function Tile(containerEl, x, y, typePath, dispatcher) {
        var el = document.createElement('div');
        var data = '';
        var classList = ['tile'];
        var res;

        this.el = el;
        this.data = function (d) {
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

        this.render = function (c, r) {
            var str = classList.join(' ');
            if (el.className !== str) {
                el.className = str;
                dispatcher.dispatch(dispatcher.events.TILE_RENDER_CHANGE, this, r, c);
            }
        };

        containerEl.appendChild(el);
        this.render();
        var s = this.size();
        el.style.left = x * s + 'px';
        el.style.top = y * s + 'px';
    }

    return {
        create: function(containerEl, x, y, typePath, dispatcher) {
            return new Tile(containerEl, x, y, typePath, dispatcher);
        }
    };
});