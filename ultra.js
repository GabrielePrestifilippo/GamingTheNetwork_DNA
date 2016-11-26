var wwd;
var placemark;
var lm;
var shopsLayer;
var answered = [];

var questions = [{
    title: "What is the 4G coverage of DNA over the whole Finland?",
    type: "multi",
    answers: ["44%", "98%", "80%"],
    corrected: 1,
    info: "DNA's 4G network reaches more than 98 per cent of the population in Finland, and will reach more than 99 per cent by the end of the year"
}, {
    title: "How many network subscription has DNA?",
    type: "multi",
    answers: ["3.7 million", "7.6 million", "2.4 million"],
    corrected: 0,
    info: "DNA Ltd has more than 3.7 million mobile communications and fixed network customer subscriptions. The Group also includes DNA Store, Finland’s largest retail chain selling mobile phones"
},
    {
        title: "How many DTV subscriptions has DNA?",
        type: "multi",
        answers: ["100,000", "200,000", "300,000"],
        corrected: 2,
        info: "More than 300,000 DNA TV subscriptions now! TV content both at home and on the move"
    },
    {
        title: "In how many municipalities is available DNA's 4G network?",
        type: "multi",
        answers: ["220", "244", "314"],
        corrected: 1,
        info: "More than 300,000 DNA TV subscriptions now! TV content both at home and on the move"
    },
    {
        title: "How many kilometers of fibre-optic cable has DNA?",
        type: "multi",
        answers: ["10,000", "15,000", "20,000"],
        corrected: 2,
        info: "DNA has more than 20,396  kilometres of fibre-optic cable"
    },
    {
        title: "What is the growth percentage of subscriptions from 2014 to 2015?",
        type: "multi",
        answers: ["1.3%", "4.5%", "23.9%"],
        corrected: 1,
        info: "Mobile communication subscription base grew by 113,000 (+4.5 per cent)"
    }];
requirejs([
        'js/LayerManager'],
    function (LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        wwd = new WorldWind.WorldWindow("canvasOne");
        wwd.navigator.lookAtLocation.latitude = 63.1065497266471;
        wwd.navigator.lookAtLocation.longitude = 25.42332884445398;
        wwd.navigator.range = 748440;
        wwd.navigator.tilt = 51.69;
        var layers = [

            {layer: new WorldWind.BingAerialLayer(null), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false},
            {
                layer: new WorldWind.DigitalGlobeTiledImageLayer("Dark map", "mapbox.dark", 'pk.eyJ1IjoiZ2Ficnk1MDEiLCJhIjoiY2l2dGdtcjAzMDAzbjJvcWRmN3E4d3k4MCJ9.ghyEXEojEXRXklFc4DWtDA'),
                enabled: true
            },
            {
                layer: new WorldWind.DigitalGlobeTiledImageLayer("LIgh map", "mapbox.light", 'pk.eyJ1IjoiZ2Ficnk1MDEiLCJhIjoiY2l2dGdtcjAzMDAzbjJvcWRmN3E4d3k4MCJ9.ghyEXEojEXRXklFc4DWtDA'),
                enabled: false
            },
            {
                layer: new WorldWind.AtmosphereLayer(), enabled: false
            }
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            layers[l].layer.detailControl = 0.8;
            wwd.addLayer(layers[l].layer);
        }

        //addPolygonExtrudedJson();
        add2g();

        add3g();
        add4g();
        addGeoTiff();
        //
        radioPlacemarks = new WorldWind.RenderableLayer("Radio");
        radioMeshLayer = new WorldWind.RenderableLayer();
        wwd.addLayer(radioPlacemarks);
        wwd.addLayer(radioMeshLayer);
        lm = new LayerManager(wwd);
        addShops();


        wwd.addEventListener("mousemove", handleMove);
        wwd.addEventListener("click", handlePick);


    });
function addShops() {
    shopsLayer = new WorldWind.RenderableLayer("Shops");
    var multiPointGeoJSON = new WorldWind.GeoJSONParser("js/shops.geojson");
    multiPointGeoJSON.load(changeAltitude, shapeConfigurationCallback, shopsLayer);
}
var shapeConfigurationCallback = function (geometry, properties) {
    var configuration = {};

    if (geometry.isPointType() || geometry.isMultiPointType()) {


        var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
        placemarkAttributes.imageScale = 0.2;

        placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = "images/placemark.png";
        placemarkAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0,
            WorldWind.OFFSET_FRACTION, 0);
        var highlightAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        highlightAttributes.imageScale = 0.3;
        configuration.highlightAttributes = highlightAttributes;

        configuration.attributes = placemarkAttributes;
        configuration.eyeDistanceScaling = true;
        configuration.eyeDistanceScalingThreshold = 1000;
        configuration.altitudeMode = WorldWind.RELATIVE_TO_GROUND;


        if (properties) {
            configuration.attributes.properties = properties
        }

    }

    else if (geometry.isPolygonType() || geometry.isMultiPolygonType()) {
        configuration.attributes = new WorldWind.ShapeAttributes(null);

        // Fill the polygon with a random pastel color.
        configuration.attributes.interiorColor = new WorldWind.Color(
            0.375 + 0.5 * Math.random(),
            0.375 + 0.5 * Math.random(),
            0.375 + 0.5 * Math.random(),
            0.1);
        // Paint the outline in a darker variant of the interior color.
        configuration.attributes.outlineColor = new WorldWind.Color(
            0.5 * configuration.attributes.interiorColor.red,
            0.5 * configuration.attributes.interiorColor.green,
            0.5 * configuration.attributes.interiorColor.blue,
            1.0);
    }

    return configuration;
};
var geotiffLayer;
function addGeoTiff() {
    var resourcesUrl = "images/heat.tif";
    var geotiffObject = new WorldWind.GeoTiffReader(resourcesUrl);

    var geoTiffImage = geotiffObject.readAsImage(function (canvas) {
        var surfaceGeoTiff = new WorldWind.SurfaceImage(
            geotiffObject.metadata.bbox,
            new WorldWind.ImageSource(canvas)
        );

        geotiffLayer = new WorldWind.RenderableLayer("Speed heatmap");
        geotiffLayer.addRenderable(surfaceGeoTiff);
        geotiffLayer.active = false;
        geotiffLayer.enabled = false;

        wwd.addLayer(geotiffLayer);
    });
}
var handleMove = function (o) {

    var x = o.clientX,
        y = o.clientY;

    var redrawRequired = highlightedItems.length > 0; // must redraw if we de-highlight previously picked items
    for (var h = 0; h < highlightedItems.length; h++) {
        highlightedItems[h].highlighted = false;
    }
    highlightedItems = [];
    var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
    if (pickList.objects.length > 0) {
        redrawRequired = true;
    }

    if (pickList.objects.length > 0) {
        for (var p = 0; p < pickList.objects.length; p++) {
            pickList.objects[p].userObject.highlighted = true;
            highlightedItems.push(pickList.objects[p].userObject);
        }
    }

    // Update the window if we changed anything.
    if (redrawRequired) {
        wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
    }
};
var handlePick = function (o) {
    var x = o.clientX,
        y = o.clientY;


    var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
    if (pickList.objects.length > 0) {
        for (var p = 0; p < pickList.objects.length; p++) {

            if (pickList.objects[p].userObject.attributes && pickList.objects[p].userObject.attributes.properties) {


                var place = pickList.objects[p].userObject.attributes.properties;
                if (answered.length < questions.length) {
                    triggerQuestion(place.Name);
                } else {
                    messageFunction("Sorry! No more questions are available at this time. Try again tomorrow!");

                    modelLayer.enabled = false;
                    shopsLayer.enabled = false;
                    geotiffLayer.enabled = false;
                    figures.enabled = false;
                    radioMeshLayer.enabled = false;
                    radioPlacemarkLayer.enabled = false;
                    radioPlacemarks.enabled = false;

                }
            }
        }
    }
};
function changeAltitude(layer) {
    layer.renderables.forEach(function (ren) {
        ren.position.altitude = 30000;
        ren.eyeDistanceScaling = true;
    });
    layer.enabled = false;
    wwd.addLayer(layer);
    lm.synchronizeLayerList()
}
var modelLayer;
function add3dModel() {
    modelLayer = new WorldWind.RenderableLayer("model");
    wwd.addLayer(modelLayer);

    var position = new WorldWind.Position(57.3, 19.3, 94500);
    var colladaLoader = new WorldWind.ColladaLoader(position);
    colladaLoader.init({dirPath: './'});
    colladaLoader.load('finlandModel.dae', function (scene) {

        modelLayer.addRenderable(scene);
        var scene = modelLayer.renderables[0];
        scene._scale = 350000;
        scene._xRotation = -3;
        scene._xTranslation = 0;
        scene._yRotation = 0;
        scene._yTranslation = 0;
        scene._zRotation = 8;
        scene._zTranslation = 0;
    });

}

function triggerQuestion(name) {
    if (answered.indexOf(name) !== -1) {
        messageFunction("Sorry, you have already answered the question of " + name);
    } else {
        q = questions[answered.length];

        var content = `
<label> ` + q.title + `</label>
                <div class="radio">
              <label><input type="radio" name="0">` + q.answers[0] + `</label>
            </div>
            <div class="radio">
              <label><input type="radio" name="1">` + q.answers[1] + `</label>
            </div>
            <div class="radio">
              <label><input type="radio" name="2" >` + q.answers[2] + `</label>
            </div>`;

        question(name, "Question from " + name, content, q.corrected, reward);
    }

}
var msgDiv = document.getElementById("msg");

var cities = [[60.16199, 25.029782], [60.4650544, 22.27125], [62.8993141, 27.7356584], [65.050848, 25.4540071], [62.9079092, 27.8927913], [61.7195503, 27.1406162], [62.5855062, 29.7602274]];
var radioClick;
var radioPlacemarkLayer;

function reward(info, correct) {
    if (correct == 1) {
        messageFunction("Congratulations, your answer is correct! you can now place a new radio station.  " + info);
        radioClick = function (o) {

            var x = o.clientX,
                y = o.clientY;
            //var rectRadius = 50,
            //
            // pickRectangle = new WorldWind.Rectangle(pickPoint[0] - rectRadius, pickPoint[1] + rectRadius, 2 * rectRadius, 2 * rectRadius);

            //var pickList = wwd.pickShapesInRegion(pickRectangle);
            var pickPoint = wwd.canvasCoordinates(x, y);
            if (pickPoint) {
                var pickList = wwd.pick(pickPoint);
                for (var i = 0; i < pickList.objects.length; i++) {
                    if (pickList.objects[i].isTerrain) {
                        var position = pickList.objects[i].position;
                    }
                }
            }
            if (position) {


                var placemark,
                    placemarkAttributes = new WorldWind.PlacemarkAttributes(null),
                    placemarkAttributes,
                imageScale = 1;
                placemarkAttributes.imageOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 0.0);
                placemarkAttributes.imageColor = WorldWind.Color.WHITE;


                placemark = new WorldWind.Placemark(
                    position, true, null);
                placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
                placemarkAttributes.imageSource = "images/radio.png";
                placemarkAttributes.imageScale = 0.2;

                placemarkAttributes.eyeDistanceScaling = false;
                placemark.attributes = placemarkAttributes;
                placemark.position.altitude = 30000;
                radioPlacemarkLayer.addRenderable(placemark);

                radioPlacemarkLayer.displayName = "Radio";

                radioPlacemarks.addRenderable(placemark);


                addMesh(position);


                console.log("place" + x + y);
                if (radioClick) {
                    wwd.removeEventListener("click", radioClick);
                    radioClick = undefined;
                    $("#canvasOne").css("cursor", "auto");
                    if (radioPlacemarks.renderables.length > 2) {
                        getPositions()
                    }

                }
            }
        }
        ;


        wwd.addEventListener("click", radioClick);
        $("#canvasOne").css("cursor", "url('images/radio-cursor.png'), auto");


    }
    else {
        messageFunction("Sorry, your answer is not correct! " + info);
    }

}
function setCursorByID(id, cursorStyle) {
    var elem;
    if (document.getElementById &&
        (elem = document.getElementById(id))) {
        if (elem.style) elem.style.cursor = cursorStyle;
    }
}
var radioPlacemarks;
var radioMeshLayer;
var parserCompletionCallback = function (layer) {
    wwd.addLayer(layer);
};

function addMesh(position) {


    var altitude = 120500,
        numRadialPositions = 25,
        meshIndices = [],
        outlineIndices = [],
        texCoords = [],
        meshRadius = 2; // degrees

    // Create the mesh's positions, which are the center point of a circle followed by points on the circle.

    texCoords.push(new WorldWind.Vec2(0.5, 0.5));

    for (var angle = 0; angle < 360; angle += 360 / numRadialPositions) {
        var angleRadians = angle * WorldWind.Angle.DEGREES_TO_RADIANS,
            t = 0.5 * (1 + Math.sin(angleRadians)),
            s = 0.5 * (1 + Math.cos(angleRadians));
        texCoords.push(new WorldWind.Vec2(s, t));
    }

    for (var i = 1; i < numRadialPositions; i++) {
        meshIndices.push(0);
        meshIndices.push(i);
        meshIndices.push(i + 1);
    }
    meshIndices.push(0);
    meshIndices.push(numRadialPositions);
    meshIndices.push(1);


    var canvas = document.createElement("canvas"),
        ctx2d = canvas.getContext("2d"),
        size = 64, c = size / 2 - 0.5, innerRadius = 5, outerRadius = 20;
    canvas.width = size;
    canvas.height = size;
    var gradient = ctx2d.createRadialGradient(c, c, innerRadius, c, c, outerRadius);
    gradient.addColorStop(0, 'rgba(255, 0, 0,0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 0,0.3)');
    gradient.addColorStop(1, 'rgba(255, 0, 0,0.3)');
    ctx2d.fillStyle = gradient;
    ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
    ctx2d.fill();
    var meshPositions = []; // Use a new positions array.
    meshPositions.push(new WorldWind.Position(position.latitude, position.longitude, altitude)); // the mesh center
    for (angle = 0; angle < 360; angle += 360 / numRadialPositions) {
        angleRadians = angle * WorldWind.Angle.DEGREES_TO_RADIANS;
        lat = meshPositions[0].latitude + Math.sin(angleRadians) * meshRadius;
        lon = meshPositions[0].longitude + Math.cos(angleRadians) * meshRadius;

        meshPositions.push(new WorldWind.Position(lat, lon, altitude));
    }
    var meshAttributes = new WorldWind.ShapeAttributes(meshAttributes);
    meshAttributes.imageSource = new WorldWind.ImageSource(canvas);
    var mesh = new WorldWind.TriangleMesh(meshPositions, meshIndices, meshAttributes);
    mesh.textureCoordinates = texCoords;
    radioMeshLayer.addRenderable(mesh);
}

var g2coverageLayer;
var g3coverageLayer;
var g4coverageLayer
var finland3dLayer;
function add2g() {

    var polygonLayer = new WorldWind.RenderableLayer("Coverage 2G");
    var polygonGeoJSON = new WorldWind.GeoJSONParser(JSON.stringify(cov2G));
    polygonGeoJSON.load(parserCompletionCallback, shapeConfigurationCallback, polygonLayer);
    polygonLayer.active = true;
    var boundaries = [];
    polygonLayer.enabled = false;
    function addJson1(x) {
        boundaries[x] = [];
        cov2G.features[0].geometry.coordinates[x][0].forEach(function (coord) {
            boundaries[x].push(new WorldWind.Position(coord[1], coord[0], 3e4));
        });
    }

    for (var i = 0; i < cov2G.features[0].geometry.coordinates.length; i++) {
        addJson1(i);
    }
    g2coverageLayer = new WorldWind.RenderableLayer();
    g2coverageLayer.displayName = "3D";
    g2coverageLayer.multi = 1;

    var polygon = new WorldWind.Polygon(boundaries, null);
    polygon.altitudeMode = WorldWind.ABSOLUTE;
    polygon.extrude = true;

    var polygonAttributes = new WorldWind.ShapeAttributes(null);
    polygonAttributes.drawInterior = true;
    polygonAttributes.drawOutline = false;
    polygonAttributes.interiorColor = new WorldWind.Color(1, 0.3, 0.3, 0.85);
    polygonAttributes.drawVerticals = polygon.extrude;
    polygonAttributes.applyLighting = true;
    polygon.attributes = polygonAttributes;

    g2coverageLayer.addRenderable(polygon);
    g2coverageLayer.active = true;
    g2coverageLayer.enabled = false;
    g2coverageLayer.name = "2g";
    wwd.addLayer(g2coverageLayer);
}

function add3g() {

    var polygonLayer = new WorldWind.RenderableLayer("Coverage 3G");
    var polygonGeoJSON = new WorldWind.GeoJSONParser(JSON.stringify(cov3G));
    polygonGeoJSON.load(parserCompletionCallback, shapeConfigurationCallback, polygonLayer);
    polygonLayer.active = true;
    polygonLayer.enabled = false;
    var boundaries = [];

    function addJson1(x) {
        boundaries[x] = [];
        cov3G.features[0].geometry.coordinates[x][0].forEach(function (coord) {
            boundaries[x].push(new WorldWind.Position(coord[1], coord[0], 6e4));
        });
    }

    for (var i = 0; i < cov3G.features[0].geometry.coordinates.length; i++) {
        addJson1(i);
    }

    g3coverageLayer = new WorldWind.RenderableLayer();
    g3coverageLayer.displayName = "3D ";
    g3coverageLayer.multi = 1;
    var polygon = new WorldWind.Polygon(boundaries, null);
    polygon.altitudeMode = WorldWind.ABSOLUTE;
    polygon.extrude = true;

    var polygonAttributes = new WorldWind.ShapeAttributes(null);
    polygonAttributes.drawInterior = true;
    polygonAttributes.drawOutline = false;
    polygonAttributes.interiorColor = new WorldWind.Color(0.3, 1, 0.3, 0.85);
    polygonAttributes.drawVerticals = polygon.extrude;
    polygonAttributes.applyLighting = true;
    polygon.attributes = polygonAttributes;

    g3coverageLayer.addRenderable(polygon);
    g3coverageLayer.active = true;
    g3coverageLayer.enabled = false;
    wwd.addLayer(g3coverageLayer);
}

function add4g() {
    var polygonLayer = new WorldWind.RenderableLayer("Coverage 4G");
    var polygonGeoJSON = new WorldWind.GeoJSONParser(JSON.stringify(cov4G));
    polygonGeoJSON.load(parserCompletionCallback, shapeConfigurationCallback, polygonLayer);
    polygonLayer.active = true;
    polygonLayer.enabled = false;

    var boundaries = [];

    function addJson1(x) {
        boundaries[x] = [];
        cov4G.features[0].geometry.coordinates[x][0].forEach(function (coord) {
            boundaries[x].push(new WorldWind.Position(coord[1], coord[0], 9e4));
        });
    }

    for (var i = 0; i < cov4G.features[0].geometry.coordinates.length; i++) {
        addJson1(i);
    }
    g4coverageLayer = new WorldWind.RenderableLayer();
    g4coverageLayer.displayName = "3D  ";
    g4coverageLayer.multi = true;
    var polygon = new WorldWind.Polygon(boundaries, null);
    polygon.altitudeMode = WorldWind.ABSOLUTE;
    polygon.extrude = true;

    var polygonAttributes = new WorldWind.ShapeAttributes(null);
    polygonAttributes.drawInterior = true;
    polygonAttributes.drawOutline = false;
    polygonAttributes.interiorColor = new WorldWind.Color(0.3, 0.3, 1, 0.85);
    polygonAttributes.drawVerticals = polygon.extrude;
    polygonAttributes.applyLighting = true;
    polygon.attributes = polygonAttributes;

    g4coverageLayer.addRenderable(polygon);
    g4coverageLayer.active = true;
    g4coverageLayer.enabled = false;
    wwd.addLayer(g4coverageLayer);
}

function addPolygonExtrudedJson() {
    // Polygon test
    //var polygonLayer = new WorldWind.RenderableLayer("3D Finland");
    //var polygonGeoJSON = new WorldWind.GeoJSONParser(JSON.stringify(finlandJson));
    //polygonGeoJSON.load(parserCompletionCallback, shapeConfigurationCallback, polygonLayer);


    var boundaries = [];

    function addJson(x) {
        boundaries[x] = [];
        finlandJson.features[0].geometry.coordinates[x][0].forEach(function (coord) {
            boundaries[x].push(new WorldWind.Position(coord[1], coord[0], 3e4));

        });
    }

    for (var i = 0; i < finlandJson.features[0].geometry.coordinates.length; i++) {
        addJson(i);
    }
    finland3dLayer = new WorldWind.RenderableLayer();
    finland3dLayer.displayName = "3D Finland";

    var polygon = new WorldWind.Polygon(boundaries, null);
    polygon.altitudeMode = WorldWind.ABSOLUTE;
    polygon.extrude = true;

    var polygonAttributes = new WorldWind.ShapeAttributes(null);
    polygonAttributes.drawInterior = true;
    polygonAttributes.drawOutline = false;
    polygonAttributes.interiorColor = new WorldWind.Color(0.6, 0.4, 1, 0.8);
    polygonAttributes.drawVerticals = polygon.extrude;
    polygonAttributes.applyLighting = true;
    polygon.attributes = polygonAttributes;
    var highlightAttributes = new WorldWind.ShapeAttributes(polygonAttributes);
    highlightAttributes.outlineColor = WorldWind.Color.RED;
    polygon.highlightAttributes = highlightAttributes;

    finland3dLayer.addRenderable(polygon);
    finland3dLayer.active = true;
    finland3dLayer.enabled = false;
    // polygonLayer.active=true;
    wwd.addLayer(finland3dLayer);
}

var highlightedItems = [];
function messageFunction(text, button, callbackFun) {
    if (!button) {
        button = "Ok";
    }
    vex.dialog.buttons.YES.text = button;
    vex.dialog.alert({
        message: text,
        afterClose: function (value) {
            if (callbackFun) {
                callbackFun(value);
            }
        }
    })

}
function question(placeName, messageShow, content, answer, callback) {
    vex.dialog.buttons.YES.text = "Send";
    vex.dialog.open({
        message: messageShow,
        input: [
            content

        ].join(''),
        callback: function (data) {
            if (!data) {
                return console.log('Cancelled')
            }
            var info = questions[answered.length].info;
            answered.push(placeName);

            if (data[answer]) {
                callback(info, 1);
            } else {
                callback(info, 0);
            }

        }
    });

}
function getRandomCity() {
    var seed = Math.floor(Math.random() * (6 + 1));
    var coord = cities[seed];
    coord[0] += Math.random() * (0.5 - -0.5) - 0.5;
    coord[1] += Math.random() * (0.5 - -0.5) - 0.5;
    return [coord[0], coord[1]];
}
$("#startTest").click(function () {

    $("#infoMsg").append('<h3>Speed test in progress. Please wait...</h3>');
    $("#infoMsg").show();

    $(".containerLoader").show();

    // SomApi.startTest();
    // SOM5835be0327e2b
//    SomApi.account = "SOM524dca9d0aae6";
    // SomApi.domainName = "localhost";
    // SomApi.config.sustainTime = 1; //faster
    // SomApi.onTestCompleted = onTestCompleted;

    setTimeout(function () {
        onTestCompleted(Math.round(Math.random(10) * 5000) / 100);
        $(".containerLoader").hide();
        $("#rating").show();
        $("#rating").prepend("Rate our network");
    }, 3000);
});

$("#startGame").click(function () {
    messageFunction("Hello! Welcome to the game of DNA. If you complete the game you will obtain a special prize from DNA!", "next", function () {
        messageFunction("Mikko lives in Helsinki and his girlfriend is in Inari, he would like to call her but " +
            "there is no network connecting them. Your task is to create a network to connect Mikko and his girlfriend", "next", function () {
            messageFunction("To connect the two you need to place some radio stations in the country. But to obtain a new radio station you have to answer" +
                " some questions from the local DNA reseller. Select a reseller, answer the question and if the answer is correct you can place a new radio", "Let's start!", function () {
                add3dModel();
                shopsLayer.enabled = true;
                geotiffLayer.enabled = false;
                g2coverageLayer.enabled = false;
                g3coverageLayer.enabled = false;
                g4coverageLayer.enabled = false;
                if (!radioPlacemarkLayer) {
                    radioPlacemarkLayer = new WorldWind.RenderableLayer();
                    wwd.addLayer(radioPlacemarkLayer);
                }

                addFigures();
                wwd.redraw();
            });
        });
    });
});
function getPositions() {
    var pos = [];
    radioPlacemarks.renderables.forEach(function (ren) {
        pos.push([ren.position.latitude, ren.position.longitude]);
    });

    var source = [60.192059, 24.945831];
    var end = [68.9060, 27.0289];
    pos.push(source);
    pos.push(end);
    var allDistances = [];
    var size = pos.length;
    var index = 0;
    pos.forEach(function (current, x) {
        allDistances[x] = {};
        pos.forEach(function (inside, y) {
            var dist = getDistanceFromLatLonInKm(current[0], current[1], inside[0], inside[1]);
            if (dist < 10000) {
                allDistances[x][y] = 1;
            } else {
                allDistances[x][y] = 0;
            }
        });

    });


    var connected = checkConnection(allDistances, size);
    if (connected) {
        messageFunction("Congratulations! You connected Mikko with the girlfriend. You WON a 5% discount on your next purchase with the code: ULTRAHACK27");
        modelLayer.enabled = false;
        shopsLayer.enabled = false;
        geotiffLayer.enabled = false;
        figures.enabled = false;
        radioMeshLayer.enabled = false;
        radioPlacemarkLayer.enabled = false;
        radioPlacemarks.enabled = false;
    }
};

function checkConnection(allDistances, size) {

    var todo = [];
    var done = [];
    var index = 0;
    todo.push(allDistances[0]);
    while (todo.length > 0) {
        var rem = todo.shift()
        done.push(rem);
        for (var x in rem) {
            if (rem[x] == 1 && (Number(x) == size - 1)) {
                return true
            } else if (!arrayContains(todo, allDistances[x])) {
                todo.push(allDistances[x]);
            }
        }
        index++;
        if (index > 200) {
            return false;
        }
    }
    return false;
}

function arrayContains(a, b) {
    var answer = false;
    a.forEach(function (elem) {

        if (areEqual(elem, b)) {
            answer = true;
        }
    })
    return answer;
}
function areEqual(a, b) {
    if (JSON.stringify(a) == JSON.stringify(b)) {
        return true
    } else {
        return false;
    }
}
var figures;
function addFigures() {
    figures = new WorldWind.RenderableLayer("Radio");
    wwd.addLayer(figures);
    var placemark,
        placemarkAttributes = new WorldWind.PlacemarkAttributes(null),

        placemarkLayer = new WorldWind.RenderableLayer();

    placemarkAttributes.imageScale = 1;
    placemarkAttributes.imageOffset = new WorldWind.Offset(
        WorldWind.OFFSET_FRACTION, 0.5,
        WorldWind.OFFSET_FRACTION, 0.0);
    placemarkAttributes.imageColor = WorldWind.Color.WHITE;


    placemark = new WorldWind.Placemark(
        new WorldWind.Position(60.192059, 24.945831), true, null);
    placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
    placemarkAttributes.imageSource = "images/boy.png";
    placemarkAttributes.imageScale = 0.5;
    placemarkAttributes.eyeDistanceScaling = false;
    placemark.attributes = placemarkAttributes;
    placemark.position.altitude = 30000;
    placemarkLayer.addRenderable(placemark);
    placemarkLayer.displayName = "Mikko";

    figures.addRenderable(placemark);


    placemark = new WorldWind.Placemark(
        new WorldWind.Position(68.9060, 27.0288), true, null);
    placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
    placemarkAttributes.imageSource = "images/girl.png";
    placemarkAttributes.imageScale = 0.5;
    placemarkAttributes.eyeDistanceScaling = false;
    placemark.attributes = placemarkAttributes;
    placemark.position.altitude = 30000;
    placemarkLayer.addRenderable(placemark);
    placemarkLayer.displayName = "Girl";

    figures.addRenderable(placemark);

}
var test;

function onTestCompleted(testResult) {
    // testResult.download
    $("#infoMsg").html('<h3>You scored:</h3>' + testResult + " mbps");
    geotiffLayer.active = true;
    geotiffLayer.enabled = true;
    lm.synchronizeLayerList();

    var position = getRandomCity();
    var placemark,
        placemarkAttributes = new WorldWind.PlacemarkAttributes(null);


    placemarkAttributes.imageScale = 1;
    placemarkAttributes.imageOffset = new WorldWind.Offset(
        WorldWind.OFFSET_FRACTION, 0.5,
        WorldWind.OFFSET_FRACTION, 0.0);
    placemarkAttributes.imageColor = WorldWind.Color.WHITE;


    placemark = new WorldWind.Placemark(
        new WorldWind.Position(position[0], position[1]), true, null);
    placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
    placemarkAttributes.imageSource = "images/flag.png";
    placemarkAttributes.imageScale = 0.1;
    placemark.label = "You scored: " + testResult + " mbps";
    placemarkAttributes.eyeDistanceScaling = false;
    placemark.attributes = placemarkAttributes;
    placemark.position.altitude = 0;
    geotiffLayer.removeRenderable(geotiffLayer.renderables[1]);
    geotiffLayer.addRenderable(placemark);


    if (!test) {
        test = new WorldWind.RenderableLayer("My speed");
    }
    test.removeAllRenderables()
    test.enabled = true;
    test.active = true;
    test.addRenderable(placemark);


}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}
