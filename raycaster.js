var caster = (function() {
    var map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    function degToRad(angle) {
        return angle * Math.PI / 180;
    }

    function radToDeg(angle) {
        return angle * 180 / Math.PI;
    }

    function capAngle(angle) {
        while (radToDeg(angle) >= 360) {
            angle -= degToRad(360);
        }
        while (radToDeg(angle) < 0) {
            angle += degToRad(360);
        }

        return angle;
    }

    var minimap = {
        canvas: undefined,
        ctx: undefined
    };

    var main = {
        canvas: undefined,
        ctx: undefined
    };

    var width = undefined;
    var height = undefined;
    var mapWidth = undefined;
    var mapHeight = undefined;
    var tilesize = undefined;

    var fov = undefined;
    var distanceToProjection = undefined;
    var columnAngle = undefined;

    var player = {
        pos: {
            x: undefined,
            y: undefined
        },
        angle: undefined
    };

    var keys = {};

    var renderMinimap = function(points) {
        minimap.ctx.clearRect(0, 0, width, height);
        var startX = player.pos.x - (width / tilesize) / 2;
        var endX = player.pos.x + (width / tilesize) / 2;

        var startY = player.pos.y - (height / tilesize) / 2;
        var endY = player.pos.y + (height / tilesize) / 2;

        //minimap.ctx.beginPath();
        for (var y = Math.floor(startY); y < Math.ceil(endY); y++) {
            for (var x = Math.floor(startX); x < Math.ceil(endX); x++) {
                var offsetX = x - startX;
                var offsetY = y - startY;

                if (map[y] === undefined || map[y][x] === undefined) {
                    continue;
                }

                if (map[y][x] === 0) {
                    continue;
                }

                minimap.ctx.strokeRect(offsetX * tilesize, offsetY * tilesize,
                    tilesize, tilesize);


            }
        }
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            minimap.ctx.fillRect((p.x - startX) * tilesize - 2, (p.y - startY) * tilesize - 2, 4, 4);
        }

        minimap.ctx.fillRect(width / 2 - 5, height / 2 - 5, 10, 10);

        var tmpLine = {
            x: 100,
            y: 0
        };
        var line = {};
        var angle = player.angle + fov / 2;
        line.x = Math.cos(angle) * tmpLine.x - Math.sin(angle) * tmpLine.y;
        line.y = Math.sin(angle) * tmpLine.x + Math.cos(angle) * tmpLine.y;

        minimap.ctx.beginPath();
        minimap.ctx.moveTo(width / 2, height / 2);
        minimap.ctx.lineTo(width / 2 + line.x, (height / 2 - line.y));
        minimap.ctx.stroke();

        angle = player.angle - fov / 2;
        line.x = Math.cos(angle) * tmpLine.x - Math.sin(angle) * tmpLine.y;
        line.y = Math.sin(angle) * tmpLine.x + Math.cos(angle) * tmpLine.y;

        minimap.ctx.beginPath();
        minimap.ctx.moveTo(width / 2, height / 2);
        minimap.ctx.lineTo(width / 2 + line.x, (height / 2 - line.y));
        minimap.ctx.stroke();
        minimap.ctx.closePath();
    };

    var getHorizontalIntersection = function(angle, iterations) {
        if (iterations === undefined) {
            iterations = 20;
        }

        var intersection = undefined;
        var a = {};
        var dY;
        var dX = 1 / Math.tan(angle);
        if (angle > 0 && angle <= degToRad(90)) {
            //console.log('right up')
            a.y = Math.floor(player.pos.y);
            dX = 1 / Math.tan(angle);
            dY = -1;
        } else if (angle > degToRad(90) && angle < degToRad(180)) {
            //console.log('left up')
            a.y = Math.floor(player.pos.y);
            dX = 1 / Math.tan(angle);
            dY = -1;
        } else if (angle > degToRad(180) && angle <= degToRad(270)) {
            //console.log('left down')
            a.y = Math.ceil(player.pos.y);
            dX = -1 / Math.tan(angle);
            dY = 1;
        } else if (angle > degToRad(270) && angle < 360) {
            //console.log('right down')
            a.y = Math.ceil(player.pos.y);
            dX = -1 / Math.tan(angle);
            dY = 1;
        } else {
            //alert('No Hangle found: ' + radToDeg(angle));
            return;
        }
        a.x = player.pos.x + (player.pos.y - a.y) / Math.tan(angle);
        //console.log(a);
        //points.push(a);

        for (var i = 0; i < iterations; i++) {
            var iCoordinate = {
                x: a.x + i * dX,
                y: a.y + i * dY
            };

            var gCoordinate = {
                x: Math.floor(iCoordinate.x),
                y: Math.floor(iCoordinate.y)
            };

            var topWall = false;
            var bottomWall = true;
            if (map[gCoordinate.y] !== undefined && map[gCoordinate.y][gCoordinate.x] !== undefined) {
                if (map[gCoordinate.y][gCoordinate.x] !== 0) {
                    topWall = true;
                    bottomWall = false;
                }
            }

            if (bottomWall) {
                gCoordinate.y -= 1;
            }

            //console.log('g:');
            //console.log(gCoordinate);

            if (map[gCoordinate.y] === undefined || map[gCoordinate.y][gCoordinate.x] === undefined) {
                continue;
            }
            //console.log(map[gCoordinate.y][gCoordinate.x]);
            if (map[gCoordinate.y][gCoordinate.x] === 0) {
                continue;
            }

            intersection = {
                x: iCoordinate.x,
                y: iCoordinate.y
            };
            intersection.type = map[gCoordinate.y][gCoordinate.x];
            intersection.offset = iCoordinate.x - gCoordinate.x;
            //console.log(hIntersection);
            break;
        }

        return intersection;
    };


    var getVerticalIntersection = function(angle, iterations) {
        if (iterations === undefined) {
            iterations = 20;
        }


        var intersection = undefined;
        var a = {};
        var dY;
        var dX;
        if (angle >= degToRad(0) && angle < degToRad(90)) {
            //console.log('right up');
            a.x = Math.ceil(player.pos.x);
            dX = 1;
            dY = -Math.tan(angle);
            //console.log(dY);
        } else if (angle > degToRad(270) && angle <= 360) {
            //console.log('right down');
            a.x = Math.ceil(player.pos.x);
            a.x = Math.ceil(player.pos.x);
            dX = 1;
            dY = -Math.tan(angle);
        } else if (angle > degToRad(90) && angle < degToRad(180)) {
            //alert('left');
            //console.log('left up');
            a.x = Math.floor(player.pos.x);
            dX = -1;
            dY = Math.tan(angle);
        } else if (angle > degToRad(180) && angle < degToRad(270)) {
            //console.log('left down');
            a.x = Math.floor(player.pos.x);
            dX = -1;
            dY = Math.tan(angle);
        } else {
            //alert('No Vangle found: ' + radToDeg(angle));
            return;
        }
        a.y = player.pos.y - (a.x - player.pos.x) * Math.tan(angle);
        //console.log(a);
        //points.push(a);

        for (var i = 0; i < iterations; i++) {
            var iCoordinate = {
                x: a.x + i * dX,
                y: a.y + i * dY
            };

            var gCoordinate = {
                x: Math.floor(iCoordinate.x),
                y: Math.floor(iCoordinate.y)
            };

            var leftWall = true;
            var rightWall = false;
            if (map[gCoordinate.y] !== undefined && map[gCoordinate.y][gCoordinate.x - 1] !== undefined) {
                if (map[gCoordinate.y][gCoordinate.x - 1] !== 0) {
                    rightWall = true;
                    leftWall = false;
                }
            }

            if (rightWall) {
                gCoordinate.x -= 1;
            }


            //console.log('g:');
            //console.log(gCoordinate);

            if (map[gCoordinate.y] === undefined || map[gCoordinate.y][gCoordinate.x] === undefined) {
                continue;
            }
            //console.log(map[gCoordinate.y][gCoordinate.x]);
            if (map[gCoordinate.y][gCoordinate.x] === 0) {
                continue;
            }

            intersection = {
                x: iCoordinate.x,
                y: iCoordinate.y
            };
            intersection.type = map[gCoordinate.y][gCoordinate.x];
            intersection.offset = iCoordinate.y - gCoordinate.y;
            //console.log(intersection);
            break;
        }

        return intersection;
    };

    var dt = 1 / 60;
    var frames = 0;
    var renderLoop = function() {
        if (keys[65]) {
            player.angle += degToRad(45) * dt;
            player.angle = capAngle(player.angle);
        }
        if (keys[68]) {
            player.angle -= degToRad(45) * dt;
            player.angle = capAngle(player.angle);
        }
        if (keys[83]) {
            player.pos.x -= 1 * Math.sin(player.angle + degToRad(90)) * dt;
            player.pos.y -= 1 * Math.cos(player.angle + degToRad(90)) * dt;
        }
        if (keys[87]) {
            player.pos.x += 1 * Math.sin(player.angle + degToRad(90)) * dt;
            player.pos.y += 1 * Math.cos(player.angle + degToRad(90)) * dt;
        }

        if (frames % 5 !== 0) {
            requestAnimationFrame(renderLoop);
            frames++;
            return;
        }

        main.ctx.clearRect(0, 0, width, height);

        var points = [];
        // Begin leftmost what the player can see.
        var angle = player.angle + fov / 2;
        angle = capAngle(angle);
        for (var x = 0; x < width; x++) {
            var hIntersection = undefined;
            var vIntersection = undefined;

            // Horizontal intersections
            // Find intersection with closest grid cell
            hIntersection = getHorizontalIntersection(angle);
            vIntersection = getVerticalIntersection(angle);

            if (hIntersection === undefined && vIntersection === undefined) {
                //alert('No intersection found');
                continue;
            }

            var hDist = Number.POSITIVE_INFINITY;
            var vDist = Number.POSITIVE_INFINITY;
            if (hIntersection !== undefined) {
                hDist = Math.sqrt(Math.pow(Math.abs(hIntersection.x - player.pos.x), 2) + Math.pow(Math.abs(hIntersection.y - player.pos.y), 2));
            }

            if (vIntersection !== undefined) {
                vDist = Math.sqrt(Math.pow(Math.abs(vIntersection.x - player.pos.x), 2) + Math.pow(Math.abs(vIntersection.y - player.pos.y), 2));
            }

            //console.log(hDist);
            //console.log(vDist);
            //console.log('--------');

            var intersection = undefined;
            var distance = undefined;
            if (hDist < vDist) {
                intersection = hIntersection;
                distance = hDist;
            } else if (vDist < hDist) {
                intersection = vIntersection;
                distance = vDist;
            } else {
                if (hIntersection !== undefined) {
                    intersection = hIntersection;
                    distance = hDist;
                } else {
                    intersection = vIntersection;
                    distance = vDist;
                }
            }


            points.push(intersection);
            //	    if(hIntersection !== undefined) {
            //		points.push(hIntersection);
            //	      }

            distance = distance * Math.cos(Math.abs(player.angle - angle));
            // Render
            //alert(distanceToProjection / tilesize);
            var pHeight = (1 / distance) * distanceToProjection;
            //alert(intersection.offset * tilesize);
            //var texColumn = texture.ctx.getImageData(intersection.offset * tilesize, 0, 1, tilesize);


            main.ctx.beginPath();
            main.ctx.moveTo(x, height / 2 - pHeight * tilesize / 2);
            main.ctx.lineTo(x, (height / 2 + pHeight * tilesize / 2));
            main.ctx.stroke();
            main.ctx.closePath();
            //main.ctx.putImageData(texColumn, x,0);

            angle -= columnAngle;
            angle = capAngle(angle);
            //break;
        }

        renderMinimap(points);

        frames++;
        requestAnimationFrame(renderLoop);
    };

    return {
        start: function() {
            width = 320;
            height = 200;

            minimap.canvas = document.getElementById('minimap-canvas');
            minimap.ctx = minimap.canvas.getContext('2d');
            minimap.canvas.width = width;
            minimap.canvas.height = height;

            main.canvas = document.getElementById('main-canvas');
            main.ctx = main.canvas.getContext('2d');
            main.canvas.width = width;
            main.canvas.height = height;

            mapWidth = map[0].length;
            mapHeight = map.length;
            tilesize = 32;
            fov = degToRad(document.getElementById('fov').value);
            distanceToProjection = (width / 2) / Math.tan(fov / 2) / tilesize;

            columnAngle = fov / width;

            player.pos = {
                x: 5.8,
                y: 13.9
            };
            player.angle = degToRad(90);

            window.onkeydown = function(e) {
                var code = e.which || e.keyCode;
                keys[code] = true;
            };

            window.onkeyup = function(e) {
                var code = e.which || e.keyCode;
                keys[code] = false;
            };

            document.getElementById('fov').onchange = function() {
                fov = degToRad(this.value);
                distanceToProjection = (width / 2) / Math.tan(fov / 2) / tilesize;
                columnAngle = fov / width;
            };

            requestAnimationFrame(renderLoop);
        }
    };
})();
