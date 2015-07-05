(function ($) {
    "use strict";

    var CONSTANTS = {
        canvasId: "jspaint-canvas",
        canvasContainerId: "jspaint-paint-area",
        activeToolCursorClass: "working-with-tools",
        maintoolsClass: "main-tool",
        basicColors:
          [
            { hex: '00FFFF', name: "Aqua" },
            { hex: '000000', name: "Black" },
            { hex: '0000FF', name: "Blue" },
            { hex: 'FF00FF', name: "Fuchsia" },
            { hex: '808080', name: "Gray" },
            { hex: '008000', name: "Green" },
            { hex: '00FF00', name: "Lime" },
            { hex: '800000', name: "Maroon" },
            { hex: '000080', name: "Navy" },
            { hex: '808000', name: "Olive" },
            { hex: '800080', name: "Purple" },
            { hex: 'FF0000', name: "Red" },
            { hex: 'C0C0C0', name: "Silver" },
            { hex: '008080', name: "Teal" },
            { hex: 'FFFFFF', name: "White" },
            { hex: 'FFFF00', name: "Yellow" },
          ],
        Events: {
            mousemove: 'mousemove',
            mouseclick: 'click'
        }
    };

    var
    size = window.location.toString().split('?')[1].split('=')[1],
    sizeX = size.split('x')[0],
    sizeY = size.split('x')[1],
    jspaint = null,
    selectedAlternativeColor = '',
    selectedPrimaryColor = '',
    resetCanvasColor = 'white',
    context = null;

    var Actions = {
        Mouse: {
            getX: function (options) {
                var event = options.event,
                    relativeTo = options.relativeTo,
                    X = event.pageX - relativeTo.offset().left;

                return X;
            },
            getY: function (options) {
                var event = options.event,
                    relativeTo = options.relativeTo,
                    Y = event.pageY - relativeTo.offset().top;

                return Y;
            }
        }
    };

    $(function () {
        var CANVASAPI = {
            fillCirc: function (x, y, radius) {
                context.beginPath();
                context.arc(x, y, radius, 0, 2 * Math.PI, false);
                context.fill();
            },
            fillSquare: function (x, y, side) {
                context.fillRect(x, y, side, side);
            }
        };
        var Color = {
            generateBasicColorPalette: function (options) {
                var IContainBasicColors = options.appendHere || '.BasicColorPalette',
                    div1 = $('<div></div>'),
                    div2 = $('<div></div>'),
                    row = div1,
                    hex = null,
                    color = null,
                    colors = options.basicColors || CONSTANTS.basicColors,
                    len = colors.length,
                    i = 0;

                for (i = 0; i < len; i++) {
                    row = i < len / 2 ? div1 : div2;
                    hex = '#' + colors[i].hex;
                    color = $('<div></div>')
                                .addClass('color')
                                .attr('id', 'Color-Hex-' + hex)
                                .css('background-color', hex);
                    color.appendTo(row);
                }
                div1.appendTo(IContainBasicColors);
                div2.appendTo(IContainBasicColors);
            }
        };
        var Tools = {
            SpeedDot: {
                CONSTANTS: {
                    id: 'SpeedDotTool', selectionId: '#SpeedDotTool', class: 'main-tool'
                },
                VARIABLES: {
                    radius: 4
                },
                start: function (options) {
                    var event = options.event || CONSTANTS.Events.mousemove,
                        canvasId = '#' + (options.canvasId || CONSTANTS.canvasId),
                        mouseOptions = null,
                        X = null,
                        Y = null,
                        R = null;

                    $(canvasId).on(event, function (e) {
                        mouseOptions = { event: e, relativeTo: $(this) };
                        X = Actions.Mouse.getX(mouseOptions);
                        Y = Actions.Mouse.getY(mouseOptions);
                        R = Tools.SpeedDot.VARIABLES.radius;
                        CANVASAPI.fillCirc(X, Y, R);
                    });
                },
                stop: function (options) {
                    var event = options.event || CONSTANTS.Events.mousemove,
                        canvasId = '#' + (options.canvasId || CONSTANTS.canvasId);
                    $(canvasId).off(event);
                },
                ContextMenu: {
                    activate: function (options) {
                        var VARS = Tools.SpeedDot.VARIABLES;
                        function initialSlider() {
                            return $('<input id="radiusSpeedDot" type="range" min="1" max="50" step="1" title="radius for speed dot tool" />');
                        }
                        function addSliderForRadius(options) {
                            var div = $('<div></div>').attr('id', options.id).addClass('menu-item');
                            var slider = initialSlider()
                                .attr('value', VARS.radius)
                                .on('mouseover', function () {
                                    $(this).attr('title', $(this).val());
                                })
                                .on('input', function () {
                                    VARS.radius = $(this).val();
                                });

                            slider.appendTo(div);
                            div.appendTo($(options.containerSelectionCriterion));
                        }
                        addSliderForRadius(options);
                    },
                    deactivate: function (options) {
                        function removeSliderForRadius(options) {
                            $('#' + options.id).remove();
                        }
                        removeSliderForRadius(options);
                    },
                    getOptions: function () {
                        return {
                            tool: this,
                            id: 'SpeedDotContextMenu',
                            containerSelectionCriterion: '.contextual-tool-bar'
                        };
                    }
                },
                Events: {
                    register: function (options) {
                        var toolId = options.toolId || CONSTANTS.Tools.SpeedDot.selectionId,
                            tool = $(toolId),
                            contextMenu = Tools.SpeedDot.ContextMenu;

                        options.tool = tool;

                        tool.funcToggle('click',
                          function () {
                              activateTool(options);
                              contextMenu.activate(contextMenu.getOptions());
                              activeTool = tool;
                          },
                          function () {
                              activeTool = null;
                              deactivateTool(options);
                              contextMenu.deactivate(contextMenu.getOptions());
                          }
                        );
                    }
                }
            },
            Square: {
                CONSTANTS: {
                    id: 'SquareTool', selectionId: '#SquareTool', class: 'main-tool'
                },
                VARIABLES: {
                    side: 10
                },
                start: function (options) {
                    var event = options.event || CONSTANTS.Events.mouseclick,
                                canvasId = '#' + (options.canvasId || CONSTANTS.canvasId),
                                mouseOptions = null,
                                X = null,
                                Y = null,
                                side = null;

                    $(canvasId).on(event, function (e) {
                        mouseOptions = { event: e, relativeTo: $(this) };
                        X = Actions.Mouse.getX(mouseOptions);
                        Y = Actions.Mouse.getY(mouseOptions);
                        side = Tools.Square.VARIABLES.side;
                        CANVASAPI.fillSquare(X, Y, side);
                    });
                },
                stop: function (options) {
                    var event = options.event || CONSTANTS.Events.mouseclick,
                                canvasId = '#' + (options.canvasId || CONSTANTS.canvasId);
                    $(canvasId).off(event);
                },
                ContextMenu: {
                    activate: function (options) {
                        function initialSlider() {
                            return $('<input id="sideSquare" type="range" min="1" max="200" step="1" title="side length for square tool" />');
                        }
                        function addSliderForSide(options) {
                            var div = $('<div></div>').attr('id', options.id).addClass('menu-item');
                            var slider = initialSlider()
                                .attr('value', Tools.Square.VARIABLES.side)
                                .on('mouseover', function () {
                                    $(this).attr('title', $(this).val());
                                })
                                .on('input', function () {
                                    Tools.Square.VARIABLES.side = $(this).val();
                                });

                            slider.appendTo(div);
                            div.appendTo($(options.containerSelectionCriterion));
                        }
                        addSliderForSide(options);
                    },
                    deactivate: function (options) {
                        function removeSliderForSide(options) {
                            $('#' + options.id).remove();
                        }
                        removeSliderForSide(options);
                    },
                    getOptions: function () {
                        return {
                            tool: this,
                            id: 'SquareToolContextMenu',
                            containerSelectionCriterion: '.contextual-tool-bar'
                        };
                    }
                },
                Events: {
                    register: function (options) {
                        var toolId = options.toolId || CONSTANTS.Tools.Square.selectionId,
                            tool = $(toolId),
                            contextMenu = Tools.Square.ContextMenu;

                        options.tool = tool;

                        tool.funcToggle('click',
                            function () {
                                activateTool(options);
                                contextMenu.activate(contextMenu.getOptions());
                                activeTool = tool;
                            },
                            function () {
                                activeTool = null;
                                contextMenu.deactivate(contextMenu.getOptions());
                                deactivateTool(options);
                            }
                        );
                    }
                }
            },
            Disc: {
                CONSTANTS: {
                    id: 'DiscTool', selectionId: '#DiscTool', class: 'main-tool'
                },
                VARIABLES: { radius: 10 },
                start: function (options) {
                    var event = options.event || CONSTANTS.Events.mouseclick,
                        canvasId = '#' + (options.canvasId || CONSTANTS.canvasId),
                        mouseOptions = null,
                        X = null,
                        Y = null,
                        radius = null;

                    $(canvasId).on(event, function (e) {
                        mouseOptions = { event: e, relativeTo: $(this) };
                        X = Actions.Mouse.getX(mouseOptions);
                        Y = Actions.Mouse.getY(mouseOptions);
                        radius = Tools.Disc.VARIABLES.radius;
                        CANVASAPI.fillCirc(X, Y, radius);
                    });
                },
                stop: function (options) {
                    var event = options.event || CONSTANTS.Events.mouseclick,
                        canvasId = '#' + (options.canvasId || CONSTANTS.canvasId);

                    $(canvasId).off(event);
                },
                ContextMenu: {
                    activate: function (options) {
                        function initialSlider() {
                            return $('<input id="radiusDisc" type="range" min="1" max="200" step="1" title="radius for disc tool." />');
                        }
                        function addSliderForRadius(options) {
                            var div = $('<div></div>').attr('id', options.id).addClass('menu-item');
                            var slider = initialSlider()
                                .attr('value', Tools.Disc.VARIABLES.radius)
                                .on('mouseover', function () {
                                    $(this).attr('title', $(this).val());
                                })
                                .on('input', function () {
                                    Tools.Disc.VARIABLES.radius = $(this).val();
                                });

                            slider.appendTo(div);
                            div.appendTo($(options.containerSelectionCriterion));
                        }
                        addSliderForRadius(options);
                    },
                    deactivate: function (options) {
                        function removeSliderForRadius(options) {
                            $('#' + options.id).remove();
                        }
                        removeSliderForRadius(options);
                    },
                    getOptions: function () {
                        return {
                            tool: this,
                            id: 'DiscContextMenu',
                            containerSelectionCriterion: '.contextual-tool-bar'
                        };
                    }
                },
                Events: {
                    register: function (options) {
                        var toolId = options.toolId || CONSTANTS.Tools.Disc.selectionId,
                                     tool = $(toolId),
                                     contextMenu = Tools.Disc.ContextMenu;

                        options.tool = tool;

                        tool.funcToggle('click',
                          function () {
                              activateTool(options);
                              contextMenu.activate(contextMenu.getOptions());
                              activeTool = tool;
                          },
                          function () {
                              activeTool = null;
                              deactivateTool(options);
                              contextMenu.deactivate(contextMenu.getOptions());
                          }
                        );
                    }
                }
            },
            Pencil: {
                CONSTANTS: {
                    id: "PencilTool", selectionId: '#PencilTool', class: 'main-tool'
                },
                VARIABLES: {
                    width: 2,
                    height: 2,
                    LastPoint: { X: -1, Y: -1 }
                },
                start: function (options) {
                    var event = options.event || CONSTANTS.Events.mousemove,
                    canvasId = '#' + (options.canvasId || CONSTANTS.canvasId),
                    mouseOptions = null,
                    X = null,
                    Y = null,
                    width = null,
                    last = null;

                    function setLastPoint(X, Y) {
                        Tools.Pencil.VARIABLES.LastPoint.X = X;
                        Tools.Pencil.VARIABLES.LastPoint.Y = Y;
                    }
                    function getLastPoint() {
                        return {
                            X: Tools.Pencil.VARIABLES.LastPoint.X,
                            Y: Tools.Pencil.VARIABLES.LastPoint.Y
                        };
                    }
                    function drawLineSegmentFromLastPoint(options) {
                        var context = options.context,
                            last = options.last,
                            current = options.current,
                            width = options.width;

                        context.beginPath();
                        context.moveTo(last.X, last.Y);
                        context.lineTo(current.X, current.Y);
                        context.lineWidth = width;
                        context.strokeStyle = selectedPrimaryColor;
                        context.stroke();
                    }
                    $(canvasId).on(event, function (e) {
                        mouseOptions = { event: e, relativeTo: $(this) };
                        if (e.buttons !== undefined) {
                            if (e.buttons === 1) {
                                X = Actions.Mouse.getX(mouseOptions);
                                Y = Actions.Mouse.getY(mouseOptions);
                                width = Tools.Pencil.VARIABLES.width;
                                last = getLastPoint();
                                if (last.X != -1) {
                                    drawLineSegmentFromLastPoint({
                                        context: context,
                                        last: last,
                                        current: { X: X, Y: Y },
                                        width: width
                                    });
                                }
                                CANVASAPI.fillCirc(X, Y, width / 2);
                                setLastPoint(X, Y);
                            } else {
                                Tools.Pencil.VARIABLES.LastPoint.X = -1;
                                Tools.Pencil.VARIABLES.LastPoint.Y = -1;
                            }
                        }
                    });
                },
                stop: function (options) {
                    var event = options.event || CONSTANTS.Events.mousemove,
                    canvasId = '#' + (options.canvasId || CONSTANTS.canvasId);
                    Tools.Pencil.VARIABLES.LastPoint.X = -1;
                    Tools.Pencil.VARIABLES.LastPoint.Y = -1;
                    $(canvasId).off(event);
                },
                ContextMenu: {
                    activate: function (options) {
                        function initialSlider() {
                            return $('<input id="radiusDisc" type="range" min="1" max="100" step="1" title="width for pencil tool." />');
                        }
                        function addSliderForLineWidth(options) {
                            var div = $('<div></div>').attr('id', options.id).addClass('menu-item');
                            var slider = initialSlider()
                                .attr('value', Tools.Pencil.VARIABLES.width)
                                .on('mouseover', function () {
                                    $(this).attr('title', $(this).val());
                                })
                                .on('input', function () {
                                    Tools.Pencil.VARIABLES.width = $(this).val();
                                });

                            slider.appendTo(div);
                            div.appendTo($(options.containerSelectionCriterion));
                        }
                        addSliderForLineWidth(options);
                    },
                    deactivate: function (options) {
                        function removeSliderForLineWidth(options) {
                            $('#' + options.id).remove();
                        }
                        removeSliderForLineWidth(options);
                    },
                    getOptions: function () {
                        return {
                            tool: this,
                            id: 'PencilContextMenu',
                            containerSelectionCriterion: '.contextual-tool-bar'
                        };
                    }
                },
                Events: {
                    register: function (options) {
                        var toolId = options.toolId || Tools.Pencil.CONSTANTS.selectionId,
                            tool = $(toolId),
                            contextMenu = Tools.Pencil.ContextMenu;

                        options.tool = tool;

                        tool.funcToggle('click',
                          function () {
                              activateTool(options);
                              contextMenu.activate(contextMenu.getOptions());
                              activeTool = $(this);
                          },
                          function () {
                              activeTool = null;
                              deactivateTool(options);
                              contextMenu.deactivate(contextMenu.getOptions());
                          }
                        );
                    }
                }
            }
        };

        var
        initializeCanvas = function (options) {
            var canvas = $('<canvas/>', { id: options.canvasId })
                .prop({ 'width': options.width, 'height': options.height })
                .appendTo('#' + options.canvasContainerId);
            return canvas[0];
        },

        initializeContext = function (options) {
            var sizeX = options.sizeX || 600,
                sizeY = options.sizeY || 400,
                width = sizeX - 2,
                height = sizeY - 2,
                canvas = null;

            options.width = width;
            options.height = height;
            canvas = initializeCanvas(options);
            return canvas.getContext('2d');
        },

      generateHexColorStringFromThisElementsId = function (element) {
          return '#' + element.attr('id').split('#')[1];
      },

      activateTool = function (options, start) {
          if (activeTool !== null) {
              activeTool.trigger('click');
          }
          $(options.tool).toggleClass('active-tool');
          options.start(options);
      },

      deactivateTool = function (options, stop) {
          $(options.tool).toggleClass('active-tool');
          options.stop(options);
      },

      activeTool = null,

      registerColorEvents = function () {
          $('.color')
          .on('click', function () {
              selectedPrimaryColor = context.fillStyle = generateHexColorStringFromThisElementsId($(this));
          })
          .on('contextmenu', function () {
              selectedAlternativeColor = generateHexColorStringFromThisElementsId($(this));
          });
      },

      registerAllColorsPickerEvents = function (options) {
          $('#' + options.containerId + ' #' + options.toolId).on('input', function () {
              selectedPrimaryColor = context.fillStyle = $(this).val();
          });
      },

      registerSaveImageEvents = function (options) {
          $('#' + options.toolId).on('click', function () {
              window.open($('#' + CONSTANTS.canvasId)[0].toDataURL("image/png"), "_blank");
          });
      },
      registerResetCanvasEvents = function (options) {
          $('#' + options.toolId).on('click', function () {
              var canvas = $('#' + CONSTANTS.canvasId)[0];
              var canvasHeight = canvas.height;
              var canvasWidth = canvas.width;
              var context = canvas.getContext('2d');
              context.save();
              context.transform(1, 0, 0, 1, 0, 0);
              context.fillStyle = resetCanvasColor;
              context.fillRect(0, 0, canvasWidth, canvasHeight);
              context.restore();
          });
      },

      registerEvents = function () {
          registerColorEvents();
          Tools.Pencil.Events.register({
              toolId: Tools.Pencil.CONSTANTS.selectionId,
              event: CONSTANTS.Events.mousemove,
              canvasId: CONSTANTS.canvasId,
              start: Tools.Pencil.start,
              stop: Tools.Pencil.stop
          });
          Tools.Disc.Events.register({
              toolId: Tools.Disc.CONSTANTS.selectionId,
              event: CONSTANTS.Events.mouseclick,
              canvasId: CONSTANTS.canvasId,
              start: Tools.Disc.start,
              stop: Tools.Disc.stop
          });
          Tools.SpeedDot.Events.register({
              toolId: Tools.SpeedDot.CONSTANTS.selectionId,
              event: CONSTANTS.Events.mousemove,
              canvasId: CONSTANTS.canvasId,
              start: Tools.SpeedDot.start,
              stop: Tools.SpeedDot.stop
          });
          Tools.Square.Events.register({
              toolId: Tools.Square.CONSTANTS.selectionId,
              containerId: 'jspaint-tools',
              event: CONSTANTS.Events.mouseclick,
              canvasId: CONSTANTS.canvasId,
              start: Tools.Square.start,
              stop: Tools.Square.stop
          });
          registerAllColorsPickerEvents({ toolId: 'allColorsPicker', containerId: 'HTML5ColorPicker' });
          registerSaveImageEvents({ toolId: 'save-as-image', containerId: 'SaveImageButton' });
          registerResetCanvasEvents({ toolId: 'reset-canvas', containerId: 'ResetCanvas' });
      },

      mustAssignDimensionsToCanvasContainer = function () {
          $('#jspaint-paint-area').css({ width: sizeX, height: sizeY });
      },

      initializeTopTakerWidget = function () {
          $('.top-taker').TopTaker({ 'theme': 'dark' });
      },

      init = function () {
          mustAssignDimensionsToCanvasContainer();
          context = initializeContext({ sizeX: sizeX, sizeY: sizeY, canvasId: CONSTANTS.canvasId, canvasContainerId: CONSTANTS.canvasContainerId });
          initializeTopTakerWidget();
          Color.generateBasicColorPalette({ appendHere: '.BasicColorPalette', basicColors: CONSTANTS.basicColors });
          registerEvents();
          $('#PencilTool').trigger('click');
      };
        init();
    });
})(jQuery);
