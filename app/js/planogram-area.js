/**
 * Created by Luis Blanco on 2/4/2017.
 */

// General Parameters for this app, used during initialization
var AllowTopLevel = false;
var CellSize = new go.Size(25, 25);

// These parameters need to be set before defining the templates.
var MINLENGTH = 200;  // this controls the minimum length of any swimlane
var MINBREADTH = 20;  // this controls the minimum breadth of any non-collapsed swimlane

    var $ = go.GraphObject.make;

    myDiagram =
        $(go.Diagram, "centerDiagram",
            {
                grid: $(go.Panel, "Grid",
                    { gridCellSize: CellSize },
                    $(go.Shape, "LineH", { stroke: "lightgray" }),
                    $(go.Shape, "LineV", { stroke: "lightgray" })
                ),
                // support grid snapping when dragging and when resizing
                "draggingTool.isGridSnapEnabled": true,
                "draggingTool.gridSnapCellSpot": go.Spot.Center,
                "resizingTool.isGridSnapEnabled": true,
                allowDrop: true,  // handle drag-and-drop from the Palette
                // For this sample, automatically show the state of the diagram's model on the page
                "ModelChanged": function(e) {
                    if (e.isTransactionFinished) {
                        document.getElementById("savedModel").textContent = myDiagram.model.toJson();
                    }
                },
                "animationManager.isEnabled": false,
                "undoManager.isEnabled": false
            });

    // Regular Nodes represent items to be put onto racks.
    // Nodes are currently resizable, but if that is not desired, just set resizable to false.
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
            {
                resizable: false,
                resizeObjectName: "SHAPE",
                // because the gridSnapCellSpot is Center, offset the Node's location
                locationSpot: new go.Spot(0, 0, CellSize.width / 2, CellSize.height / 2),
                // provide a visual warning about dropping anything onto an "item"
                mouseDragEnter: function(e, node) {
                    e.handled = true;
                    node.findObject("SHAPE").fill = "red";
                    highlightGroup(node.containingGroup, false);
                },
                mouseDragLeave: function(e, node) {
                    node.updateTargetBindings();
                },
                mouseDrop: function(e, node) {  // disallow dropping anything onto an "item"
                    node.diagram.currentTool.doCancel();
                }
            },
            // always save/load the point that is the top-left corner of the node, not the location
            new go.Binding("position", "pos", go.Point.parse).makeTwoWay(go.Point.stringify),
            // this is the primary thing people see
            $(go.Shape, "Rectangle",
                { name: "SHAPE",
                    fill: "white",
                    minSize: CellSize,
                    desiredSize: CellSize  // initially 1x1 cell
                },
                new go.Binding("fill", "color"),
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
            ),
            // with the textual key in the middle
            $(go.TextBlock,
                { alignment: go.Spot.Center, editable: true, isMultiline: false,
                    font: 'bold 16px arial, helvetica, sans-serif' },
                new go.Binding("text", "key", function (v) {
                    return v;
                })
            )
            ,
            $(go.Picture, {margin: 3, width: 100, height: 10, background: 'transparent'},
                new go.Binding('source')
            )
        );  // end Node

    // Groups represent racks where items (Nodes) can be placed.
    // Currently they are movable and resizable, but you can change that
    // if you want the racks to remain "fixed".
    // Groups provide feedback when the user drags nodes onto them.

    function highlightGroup(grp, show) {
        if (!grp) return;
        if (show) {  // check that the drop may really happen into the Group
            var tool = grp.diagram.toolManager.draggingTool;
            var map = tool.draggedParts || tool.copiedParts;  // this is a Map
            if (grp.canAddMembers(map.toKeySet())) {
                grp.isHighlighted = true;
                return;
            }
        }
        grp.isHighlighted = false;
    }

    var groupFill = "rgba(128,128,128,0.2)";
    var groupStroke = "gray";
    var dropFill = "rgba(128,255,255,0.2)";
    var dropStroke = "red";

    myDiagram.groupTemplate =
        $(go.Group,
            {
                layerName: "Background",
                resizable: false, // Do not allow racks to be resized.
                resizeObjectName: "SHAPE",
                // because the gridSnapCellSpot is Center, offset the Group's location
                locationSpot: new go.Spot(0, 0, CellSize.width/2, CellSize.height/2)
            },
            // always save/load the point that is the top-left corner of the node, not the location
            new go.Binding("position", "pos", go.Point.parse).makeTwoWay(go.Point.stringify),
            { // what to do when a drag-over or a drag-drop occurs on a Group
                mouseDragEnter: function(e, grp, prev) { highlightGroup(grp, true); },
                mouseDragLeave: function(e, grp, next) { highlightGroup(grp, false); },
                mouseDrop: function(e, grp) {
                    var ok = grp.addMembers(grp.diagram.selection, true);
                    if (!ok) grp.diagram.currentTool.doCancel();
                }
            },
            $(go.Shape, "Rectangle",  // the rectangular shape around the members
                { name: "SHAPE",
                    fill: groupFill,
                    stroke: groupStroke,
                    minSize: new go.Size(CellSize.width*2, CellSize.height*2)
                },
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                new go.Binding("fill", "isHighlighted", function(h) { return h ? dropFill : groupFill; }).ofObject(),
                new go.Binding("stroke", "isHighlighted", function(h) { return h ? dropStroke: groupStroke; }).ofObject())
        );

    // decide what kinds of Parts can be added to a Group
    myDiagram.commandHandler.memberValidation = function(grp, node) {
        if (grp instanceof go.Group && node instanceof go.Group) return false;  // cannot add Groups to Groups
        // but dropping a Group onto the background is always OK
        return true;
    };

    // what to do when a drag-drop occurs in the Diagram's background
    myDiagram.mouseDragOver = function(e) {
        if (!AllowTopLevel) {
            // but OK to drop a group anywhere
            if (!e.diagram.selection.all(function(p) { return p instanceof go.Group; })) {
                e.diagram.currentCursor = "not-allowed";
            }
        }
    };

    myDiagram.mouseDrop = function(e) {
        if (AllowTopLevel) {
            // when the selection is dropped in the diagram's background,
            // make sure the selected Parts no longer belong to any Group
            if (!e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true)) {
                e.diagram.currentTool.doCancel();
            }
        } else {
            // disallow dropping any regular nodes onto the background, but allow dropping "racks"
            if (!e.diagram.selection.all(function(p) { return p instanceof go.Group; })) {
                e.diagram.currentTool.doCancel();
            }
        }
    };

    var green = '#B2FF59';
    var blue = '#81D4FA';
    var yellow = '#FFEB3B';
    var crud = '#fff000';
    var crap = '#000fff';

    // start off with four "racks" that are positioned next to each other
    myDiagram.model = new go.GraphLinksModel([
        { key: "H1", isGroup: true, pos: "0 0", size: "400 200", color: crud},
        { key: "H1V1", isGroup: true, pos: "0 0", size: "100 200", group: "H1" },
        { key: "H1V2", isGroup: true, pos: "100 0", size: "100 200", group: "H1" },
        { key: "H1V3", isGroup: true, pos: "200 0", size: "100 200", group: "H1" },
        { key: "H1V4", isGroup: true, pos: "300 0", size: "100 200", group: "H1"  },
        { key: "H2", isGroup: true, pos: "410 0", size: "400 200", color: crap},
        { key: "H2V1", isGroup: true, pos: "410 0", size: "100 200", group: "H2" },
        { key: "H2V2", isGroup: true, pos: "510 0", size: "100 200", group: "H2" },
        { key: "H2V3", isGroup: true, pos: "610 0", size: "100 200", group: "H2" },
        { key: "H2V4", isGroup: true, pos: "710 0", size: "100 200", group: "H2" }
    ]);
    // this sample does not make use of any links

    // jQuery("#accordion").accordion({
    //     activate: function(event, ui) {
    //         leftPalette.requestUpdate();
    //         myPaletteTall.requestUpdate();
    //         myPaletteWide.requestUpdate();
    //         myPaletteBig.requestUpdate();
    //     }
    // });

    // initialize the first Palette
    leftPalette =
        $(go.Palette, "leftPalette",
            { // share the templates with the main Diagram
                nodeTemplate: myDiagram.nodeTemplate,
                groupTemplate: myDiagram.groupTemplate,
                layout: $(go.GridLayout)
            });



    // specify the contents of the Palette
    leftPalette.model = new go.GraphLinksModel([
        { key: "left", color: green, size: "100 25", type: "Left", source: "cat1.png" },
        { key: "right", color: blue, size: "100 25", type: "Right", source: "cat2.png" },
        { key: "both", color: yellow, size: "100 25", type: "Both", source: "cat3.png" }
    ]);

// This function is used to find a suitable ID when modifying/creating nodes.
// We used the counter combined with findNodeDataForKey to ensure uniqueness.
function getNextKey() {
    var key = nodeIdCounter;
    while (myDiagram.model.findNodeDataForKey(key.toString()) !== null) {
        key = nodeIdCounter -= 1;
    }
    return key.toString();
}
