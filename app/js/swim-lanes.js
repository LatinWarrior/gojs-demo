/**
 * Created by Luis Blanco on 2/4/2017.
 */

var $ = go.GraphObject.make;  // for conciseness

myDiagram = $(go.Diagram, "centerDiagram", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true
});


var shape = new go.Shape('RoundedRectangle', new go.Binding('fill', 'color'), new go.Binding('figure', 'fig'));

var txt = new go.TextBlock();
txt.margin = 30;
txt.bind(new go.Binding('text', 'key', function (v) {
    return 'I say: ' + v;
}));

var template = new go.Node(go.Panel.Auto);

template.add(shape);
template.add(txt);


//myDiagram.nodeTemplate = template;

// define a simple Node template
myDiagram.nodeTemplate =
    $(go.Node, "Auto", //{ desiredSize: new go.Size(100, 50)}, // On Panel
        // the Shape will go around the TextBlock
        $(go.Shape, "Rectangle",
            { fill: 'gold', margin: 2},
            // Shape.fill is bound to Node.data.color
            new go.Binding("fill", "color"),
            new go.Binding('figure', 'fig')),
        $(go.TextBlock,
            { margin: 5 },  // some room around the text
            // TextBlock.text is bound to Node.data.key
            new go.Binding("text", "key", function (v) {
                return 'My key is \'' + v + '\'';
            }))
    );

myDiagram.allowDrop = true;

var leftPalette = $(go.Palette, "leftPalette");

leftPalette.nodeTemplate = $(go.Node,
    "Horizontal",
    $(go.Shape, { width: 35, height: 14, fill: 'white'},
        new go.Binding('fill', 'color')),
    $(go.Panel,
        'Vertical',
        {margin: 5, defaultAlignment: go.Spot.Left}
        // $(go.Panel,
        //     'Horizontal',
        //     $("SubCraphExpandedButton", {margin: new go.Margin(0, 3, 5, 0)}))
        ),
    $(go.TextBlock,
        new go.Binding('text', 'color')
    ));

// the list of data to show in the Palette
leftPalette.model.nodeDataArray = [
    { key: "C", color: "cyan" },
    { key: "LC", color: "lightcyan" },
    { key: "A", color: "aquamarine" },
    { key: "T", color: "turquoise" },
    { key: "PB", color: "powderblue" },
    { key: "LB", color: "lightblue" },
    { key: "LSB", color: "lightskyblue" },
    { key: "DSB", color: "deepskyblue" }
];

// create the model data that will be represented by Nodes and Links
myDiagram.model = new go.GraphLinksModel(
    [
        { key: "Alpha", color: "lightblue", fig: "Rectangle" },
        { key: "Beta", color: "orange", fig: 'Ellipse' },
        { key: "Gamma", color: "lightgreen", fig: "Rectangle" },
        { key: "Delta", color: "pink", fig: "Procedure" }
    ],
    [
        { from: "Alpha", to: "Beta" },
        { from: "Alpha", to: "Gamma" },
        { from: "Beta", to: "Beta" },
        { from: "Gamma", to: "Delta" },
        { from: "Delta", to: "Alpha" }
    ]);