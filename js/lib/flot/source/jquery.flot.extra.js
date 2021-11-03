/* Javascript flot charts plagin with extra elements drawing and touch support

 Copyright (c) 2013-2018 Yuri Dursin
 Licensed under the MIT license.

 Touch pan and zoom requires flot.navigate plugin
 Extra plugin supports configuration options:

 extra: {
    touch: true,            // touch pan, zoom and tap events enable (by default)
    color: color,           // default drawing color for lines
    fillColor: color,       // default filling color for markers
    lineWidth: 1,           // default line width
    lineWidthRect: 0,       // default line width for rect
    lineWidthMarker: 1,     // default line width for markers
    lineJoin: "round",      // default line join style
    cropByBounds: true,     // crop by plot bounds flag
    background: true,       // drawing rectangles at background
    transparent: 1,         // drawing rectangles with alpha channel on value < 1
    markerRadius: 3,        // default marker radius
    markerSymbol: 'circle', // default marker symbol
    shadowSize: 2,          // default shadow size for markers
    shadowBlur: 10,         // default shadow blur for lines
    shadowBlurText: 3,      // default shadow blur for text
    shadowColor: '#000',
    shadowColorText: '#666',
    textAlign: 'left',
    textBaseline: 'bottom',
    textColor: '#444',
    textFont: '14px arial',

    // array of rectangles, all parameters are optional
    rectangles: [{
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        color: color
        lineJoin: join,
        lineWidth: width,
    }],

    // array of vertical lines
    verticalLines: [{
        location: 55,
        color: color,
        lineWidth: width,
        shadowBlur: 10
    }],

     // array of horizontal lines
    horizontalLines: [{
        location: 100,
        color: color,
        lineWidth: width,
        shadowSize: 2
    }]

    // array of markers
    markers: [{
        x: 10,
        y: 10,
        symbol: function or reserved: 'circle', 'square', 'diamond', 'cross', 'triangle', 'triangle_down'
        radius: 3, 
        color: color,
        fillColor: color,
        lineWidth: width,
        shadowSize: 2,
        text: 'string'
    }]
 }

 Example usage:
    var plot = $.plot(parent, [[]], {
        extra:{
            rectangles: [{ left: (new Date(2013,8,26)).getTime(), right: (new Date(2013,8,27)).getTime() }],
            horizontalLines: [{ location: 120 }],
            verticalLines: [{ location: (new Date(2013,8,25)).getTime() }]
            markers: [{ x: (new Date(2018,5,1)).getTime(), y: 100, radius: 5, symbol: 'triangle', color: '#ff0000', fillColor: '#800000' }]
        }
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        }
    })
    plot.bind('plottap', function(event, ntap, ktap, pos) {
        if (ntap === 1 && ktap === 2) {
            // single click with two fingers
        }
    })
*/

(function ($) {
    var pan_count_motion = 10;
    var tap_tmout_touch = 300;
    var tap_tmout_untouch = 300;

    var symbols = {
        circle: function (ctx, x, y, radius, shadow) {
            ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
        },
        square: function (ctx, x, y, radius, shadow) {
            var size = radius * Math.sqrt(Math.PI) / 2;
            ctx.rect(x - size, y - size, size + size, size + size);
        },
        diamond: function (ctx, x, y, radius, shadow) {
            var size = radius * Math.sqrt(Math.PI / 2);
            ctx.moveTo(x - size, y);
            ctx.lineTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
        },
        cross: function (ctx, x, y, radius, shadow) {
            var size = radius * Math.sqrt(Math.PI) / 2;
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x - size, y + size);
            ctx.lineTo(x + size, y - size);
        },
        triangle: function (ctx, x, y, radius, shadow) {
            var size = radius * Math.sqrt(2 * Math.PI / Math.sin(Math.PI / 3));
            var height = size * Math.sin(Math.PI / 3);
            ctx.moveTo(x - size/2, y + height/2);
            ctx.lineTo(x + size/2, y + height/2);
            if (!shadow) {
                ctx.lineTo(x, y - height/2);
                ctx.lineTo(x - size/2, y + height/2);
            }
        },
        triangle_down: function(ctx, x, y, radius, shadow) {
            var size = radius * Math.sqrt(2 * Math.PI / Math.sin(Math.PI / 3));
            var height = size * Math.sin(Math.PI / 3);
            ctx.moveTo(x - size/2, y - height/2);
            ctx.lineTo(x + size/2, y - height/2);
            if (!shadow) {
                ctx.lineTo(x, y + height/2);
                ctx.lineTo(x - size/2, y - height/2);
            }
        }
    }

    function init(plot) {

        // draw extra rectangles
        function draw_rectangles(plot, ctx, extra, background) {
            var rectangles = extra.rectangles;
            if (!rectangles) return;            
            var width = plot.width(), height = plot.height();
            var rect, p1, p2, x, y, w, h, lineWidth, color;
            for (var i = 0, cnt = rectangles.length; i < cnt; i++) {
                rect = rectangles[i];
                if (Array.isArray(rect)) {
                    if (rect.length < 4) rect = { left: rect[0], right: rect[1], color: rect[2] }
                    else rect = { left: rect[0], top: rect[1], right: rect[2], bottom: rect[3], color: rect[4] }
                }

                // prepare coordinates
                p1 = plot.p2c({ x: rect.left, y: rect.top });
                p2 = plot.p2c({ x: rect.right, y: rect.bottom });
                if (typeof(p1.left) === 'undefined') p1.left = 0;
                if (typeof(p2.left) === 'undefined') p2.left = width;
                if (typeof(p1.top) === 'undefined') p1.top = 0;
                if (typeof(p2.top) === 'undefined') p2.top = height;
                x = Math.min(p1.left, p2.left);
                y = Math.min(p1.top, p2.top);
                w = Math.abs(p2.left - p1.left);
                h = Math.abs(p2.top - p1.top);

                // crop by plot bounds
                if (extra.cropByBounds) {
                    if (x + w <= 0 || x >= width) w = 0;
                    else {
                        if (x < 0) { w += x; x = 0; }
                        if (x + w > width) w = width - x;
                    }
                    if (y + h <= 0 || y >= height) h = 0;
                    else {
                        if (y < 0) { h += y; y = 0; }
                        if (y + h > height) h = height - y;
                    }
                }

                // draw rect
                if (w > 0 || h > 0) {
                    lineWidth = rect.lineWidth || extra.lineWidthRect;
                    color = rect.color || extra.color;
                    if (extra.transparent < 1) {
                        color = $.color.parse(color).scale('a', extra.transparent).toString();
                    }
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, w, h);
                    if (lineWidth > 0) {
                        color = rect.color || extra.color;
                        if (extra.transparent < 0.9) {
                            color = $.color.parse(color).scale('a', extra.transparent + 0.1).toString();
                        }
                        ctx.lineWidth = lineWidth;
                        ctx.lineJoin = rect.lineJoin || extra.lineJoin;
                        ctx.strokeStyle = color;
                        ctx.strokeRect(x, y, w, h);
                    }
                }
            }        
        }

        // draw extra vertical or horizontal lines
        function draw_lines(plot, ctx, extra, vertical, shadow) {
            var lines = vertical ? extra.verticalLines : extra.horizontalLines; 
            if (!lines) return;
            var axis = plot.getAxes()[vertical ? 'xaxis' : 'yaxis'];
            var len = vertical ? plot.height() : plot.width();
            var line, v, shadowSize;
            for (var i = 0, cnt = lines.length; i < cnt; i++) {
                line = lines[i];
                v = line.location;
                if (!(v >= axis.min && v <= axis.max)) continue;
                v = axis.p2c(v);

                if (shadow) {
                    shadowSize = line.shadowSize || extra.shadowSize;
                    if (!shadowSize) continue;
                    ctx.lineWidth = shadowSize;                    
                    ctx.strokeStyle = shadow < 2 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)';
                    v += shadow < 2 ? (shadowSize + shadowSize / 2) : (shadowSize / 2);
                }
                else {
                    ctx.strokeStyle = line.color || extra.color;
                    ctx.lineWidth = line.lineWidth || extra.lineWidth;                        
                    ctx.shadowBlur = line.shadowBlur || extra.shadowBlur;
                    ctx.shadowColor = line.shadowColor || extra.shadowColor;
                }
                
                ctx.beginPath();
                if (vertical) {
                    ctx.moveTo(v, 0);
                    ctx.lineTo(v, len);    
                }
                else {
                    ctx.moveTo(0, v);
                    ctx.lineTo(len, v);                        
                }
                ctx.stroke();
            }
        }

        // draw extra markers
        function draw_markers(plot, ctx, extra, shadow) {
            var markers = extra.markers;
            if (!markers) return;
            var axes = plot.getAxes(), axisx = axes.xaxis, axisy = axes.yaxis;
            var marker, x, y, symbol, radius, text, textAlign, textBaseline;
            var strokeStyle, lineWidth, shadowSize, offset = 0;
            for (var i = 0, cnt = markers.length; i < cnt; i++) {
                marker = markers[i];
                if (!(marker.x >= axisx.min && marker.x <= axisx.max && marker.y >= axisy.min && marker.y <= axisy.max)) continue;
                x = axisx.p2c(marker.x);
                y = axisy.p2c(marker.y);

                // prepare symbol
                symbol = marker.symbol || extra.markerSymbol;
                if (typeof(symbol) !== 'function') symbol = symbols[symbol];
                if (symbol) {
                    radius = marker.radius || extra.markerRadius;
                    lineWidth = marker.lineWidth || extra.lineWidthMarker;
                    shadowSize = marker.shadowSize || extra.shadowSize;
                    if (!shadow) strokeStyle = marker.color || extra.color;
                    else if (!shadowSize) symbol = undefined;
                    else if (shadow < 2) {
                        offset = shadowSize + shadowSize / 2;
                        strokeStyle = 'rgba(0,0,0,0.1)';
                    }
                    else {
                        offset = shadowSize / 2;
                        strokeStyle = 'rgba(0,0,0,0.2)';
                    }
                }

                // draw symbol
                if (symbol) {
                    ctx.beginPath();
                    ctx.shadowBlur = 0;
                    ctx.lineWidth = shadow ? shadowSize : lineWidth;
                    ctx.lineJoin = marker.lineJoin || extra.lineJoin;
                    ctx.strokeStyle = strokeStyle;
                    symbol(ctx, x, y + offset, radius, shadow);
                    ctx.closePath();
                    if (!shadow) {
                        ctx.fillStyle = marker.fillColor || extra.fillColor;
                        ctx.fill();                    
                    }
                    ctx.stroke();
                }

                // draw text
                if (shadow) continue;
                text = marker.text;
                if (typeof(text) === 'function') text = text.call(marker, plot);
                if (text) {
                    textAlign = marker.textAlign || extra.textAlign;
                    textBaseline = marker.textBaseline || extra.textBaseline;
                    if (symbol) {                        
                        if (textBaseline === 'bottom') y -= radius;
                        else if (textBaseline === 'top') y += radius;
                        if (textAlign === 'left') x += radius;
                        else if (textAlign === 'right') x -= radius;
                    }
                    ctx.textAlign = textAlign;
                    ctx.textBaseline = textBaseline;
                    ctx.fillStyle = marker.textColor || extra.textColor;
                    ctx.shadowColor = marker.shadowColor || extra.shadowColorText;
                    ctx.shadowBlur = marker.shadowBlur || extra.shadowBlurText;
                    ctx.font = marker.font || extra.textFont;
                    ctx.fillText(text.toString(), x, y);
                }
            }
        }

        // draw background elements
        function draw_background(plot, ctx) {
            var opt = plot.getOptions();
            var extra = opt.extra || {};
            if (!extra.background) return;
            var plotOffset = plot.getPlotOffset();
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);            
            draw_rectangles(plot, ctx, extra, true);
            ctx.restore();
        }

        // draw foreground elements
        function draw(plot, ctx) {
            var opt = plot.getOptions();
            var extra = opt.extra || {};
            if (!extra.rectangles && !extra.verticalLines && !extra.horizontalLines && !extra.markers) return;
            var plotOffset = plot.getPlotOffset();            
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw rectangles foreground
            if (!extra.background) {
                draw_rectangles(plot, ctx, extra, false);
            }

            // draw extra vertical and horizontal lines
            draw_lines(plot, ctx, extra, true, 0);
            draw_lines(plot, ctx, extra, false, 0);

            // draw extra markers
            if (extra.markers) {
                draw_markers(plot, ctx, extra, 1);
                draw_markers(plot, ctx, extra, 2);
                draw_markers(plot, ctx, extra, 0);
            }

            ctx.restore();
        }

        // extended version zoom from navigate plugin
        plot.zoom2 = function (args) {
            if (!args) args = {};
            var c = args.center,
                amountx = args.amountx, amounty = args.amounty,
                w = plot.width(), h = plot.height();

            if (!amountx && !amounty) amountx = amounty = args.amount || plot.getOptions().zoom.amount;
            if (!c) c = { left: w / 2, top: h / 2 };
                
            var xf = c.left / w,
                yf = c.top / h,
                minmax = {};
            
            if (amountx) minmax.x = {
                min: c.left - xf * w / amountx,
                max: c.left + (1 - xf) * w / amountx
            }
            if (amounty) minmax.y = {
                min: c.top - yf * h / amounty,
                max: c.top + (1 - yf) * h / amounty
            }

            $.each(plot.getAxes(), function(_, axis) {
                var axis_minmax = minmax[axis.direction];
                if (!axis_minmax) return;

                var opts = axis.options,
                    min = axis_minmax.min,
                    max = axis_minmax.max,
                    zr = opts.zoomRange,
                    pr = opts.panRange;

                if (zr === false) // no zooming on this axis
                    return;
                    
                min = axis.c2p(min);
                max = axis.c2p(max);
                if (min > max) {
                    // make sure min < max
                    var tmp = min;
                    min = max;
                    max = tmp;
                }

                //Check that we are in panRange
                if (pr) {
                    if (pr[0] != null && min < pr[0]) {
                        min = pr[0];
                    }
                    if (pr[1] != null && max > pr[1]) {
                        max = pr[1];
                    }
                }

                var range = max - min;
                if (zr &&
                    ((zr[0] != null && range < zr[0] && amount >1) ||
                     (zr[1] != null && range > zr[1] && amount <1)))
                    return;
            
                opts.min = min;
                opts.max = max;
            });
            
            plot.setupGrid();
            plot.draw();

            if (!args.preventEvent)
                plot.getPlaceholder().trigger('plotzoom', [ plot, args ]);
        }

        // process touch events
        var touch = {};
        function touch_clear() {
            if (touch.t) clearTimeout(touch.t)
            touch.p = touch.d = touch.t = touch.n = undefined;            
        }
        function touch_pan(p, tmout) {
            if (touch.p && !touch.t) touch.t = setTimeout(function() {
                touch.t = undefined;
                var ofsx = touch.p.left - p.left;
                var ofsy = touch.p.top - p.top;
                plot.pan({ left: ofsx, top: ofsy });
                touch.p = p;
                if (touch.n > 0) {
                    touch.n--;
                    var p2 = { left: p.left - ofsx*2/3, top: p.top - ofsy*2/3}
                    if (p2.left > 0 || p2.top > 0) touch_pan(p2, tmout);
                }
            }, tmout)
        }
        function touch_zoom(touches, tmout) {
            var ofs = plot.offset();
            var p = { left: (touches[0].pageX + touches[1].pageX) / 2 - ofs.left, top: (touches[0].pageY + touches[1].pageY) / 2 - ofs.top }
            var d = [ Math.abs(touches[1].pageX - touches[0].pageX), Math.abs(touches[1].pageY - touches[0].pageY) ];
            if (touch.d && !touch.t) touch.t = setTimeout(function() {
                var k = 2;
                plot.zoom2({
                    center: p,
                    amountx: (p.left + k*(d[0] - touch.d[0])) / p.left,
                    amounty: (p.top + k*(d[1] - touch.d[1])) / p.top
                })
                touch.d = d;
                touch.t = undefined;
            }, tmout)
        }
        function touch_tap(ntap, ktap, tap) {
            var ofs = plot.offset();
            var pos = plot.c2p({ left: tap.pageX - ofs.left, top: tap.pageY - ofs.top });
            plot.getPlaceholder().trigger('plottap', [ntap, ktap, pos]);          
        }
        function touch_start(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var touches = evt.originalEvent.touches;

            // clear previus pan and zoom
            touch_clear();
            
            // prepare pan
            if (pan.interactive && touches.length >= 1) {
                touch.p = { left: touches[0].pageX, top: touches[0].pageY }
            }

            // prepare zoom
            if (zoom.interactive && touches.length >= 2) {
                touch.d = [ Math.abs(touches[1].pageX - touches[0].pageX), Math.abs(touches[1].pageY - touches[0].pageY) ];
            }

            // prepare tap
            if (!touch.ttap) {
                touch.ktap = touches.length;
                touch.ntap = 1;
            }
            else if (touch.ktap !== undefined && touch.ktap < touches.length) {
                touch.ktap = touches.length;                
            }
            else {
                clearTimeout(touch.ttap);
                touch.ttap = undefined;
                touch.ktap = touches.length;                
                touch.ntap ++;
            }
            if (!touch.ttap) {
                touch.tap = touches[0];
                touch.ttap = setTimeout(function() { 
                    touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;
                }, tap_tmout_touch)
            }
        }
        function touch_move(evt) {
            evt.preventDefault();
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var tmout = 1000 / (pan.frameRate || 20);
            var touches = evt.originalEvent.touches;

            // process pan
            if (pan.interactive && touches.length === 1) {
                touch_pan({ left: touches[0].pageX, top: touches[0].pageY }, tmout)
            }

            // process zoom
            if (zoom.interactive && touches.length === 2) {
                touch_zoom(touches, tmout);
            }
        }
        function touch_end(evt) {
            evt.preventDefault();
            var touches = evt.originalEvent.touches;

            // update pan
            if (touch.p && touches.length >= 1) {
                touch.p = { left: touches[0].pageX, top: touches[0].pageY }
            }

            // set pan timeout actions
            if (touch.t) touch.n = pan_count_motion; 

            // check tap coordinates
            if (touch.ttap && touch.tap) {
                var changed = evt.originalEvent.changedTouches;
                for (var i = 0, len = changed.length; i < len; i++) {
                    var tap = changed[i];
                    if (tap.identifier !== touch.tap.identifier) continue;
                    var dx = Math.abs(tap.pageX - touch.tap.pageX);
                    var dy = Math.abs(tap.pageY - touch.tap.pageY);
                    if (dx > 2 || dy > 2) {
                        clearTimeout(touch.ttap);
                        touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;    
                    }
                    break;
                }
            }

            // process tap events
            if (touches.length === 0 && touch.ttap) {
                var ktap = touch.ktap;
                touch.ktap = undefined;
                clearTimeout(touch.ttap);
                touch.ttap = setTimeout(function() {
                    touch_tap(touch.ntap, ktap, touch.tap);
                    touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;    
                }, tap_tmout_untouch)
            }
        }

        // init hooks
        plot.hooks.drawBackground.push(draw_background);
        plot.hooks.drawOverlay.push(draw);
        plot.hooks.bindEvents.push(function(plot, eventHolder) {
            var opt = plot.getOptions();
            var extra = opt.extra || {};
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};    
            if (extra.touch && (pan.interactive || zoom.interactive)) {
                eventHolder
                .bind('touchstart', touch_start)
                .bind('touchmove', touch_move)
                .bind('touchend', touch_end)    
            }
        })
        plot.hooks.shutdown.push(function(plot, eventHolder) {
            eventHolder
            .unbind('touchstart', touch_start)
            .unbind('touchmove', touch_move)
            .unbind('touchend', touch_end)   
        })
    }

    $.plot.plugins.push({
        name: 'extra',
        version: '2.3',
        init: init,
        options: {
            extra: {
                touch: true,
                color: '#666',
                fillColor: '#fff',
                lineJoin: 'round',
                lineWidth: 1,
                lineWidthRect: 1,
                lineWidthMarker: 1,
                markerRadius: 3,
                markerSymbol: symbols.circle,
                shadowSize: 2,
                shadowBlur: 10,
                shadowBlurText: 3,
                shadowColor: '#000',
                shadowColorText: '#666',
                textAlign: 'left',
                textBaseline: 'bottom',
                textColor: '#444',
                textFont: '14px arial',
                cropByBounds: true,
                background: true,
                transparent: 0.5,
                rectangles: null,
                verticalLines: null,
                horizontalLines: null,
                markers: null
            }
        }
    })

})(jQuery);