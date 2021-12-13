const map = {

    debug: false,
    ani_time: 200,

    myMap: null,
    clusterer: null,
    center: [63.83908350210848, 34.41274809002659],
    fillColor: "#0074e8",
    zoom: 6,
    single_zoom: 16,

    dd: function () {
        if (this.debug) {
            for (let i = 0; i < arguments.length; i++) {
                console.log(arguments[i]);
            }
        }
    },

    init: function () {
        this.dd("init");
        this.debug = app.debug;
        ymaps.ready(function () {
            const mapid = $(window).width() > 1023 ? "map" : "mobile_map";
            map.myMap = new ymaps.Map(mapid, {
                center: map.center,
                zoom: map.zoom,
                controls: ['rulerControl', 'zoomControl', 'geolocationControl', 'typeSelector']
            }, {
                searchControlProvider: 'yandex#search'
            });
            //map.showKarelRegion();
            map.createClusterer();
            app.loadObjectsList();
            $(".ymaps-2-1-79-gototech").hide();
        });
    },

    showKarelRegion: function () {
        this.dd("showKarelRegion");
        ymaps.borders.load('RU').then(function (geojson) {
            let regions = new ymaps.ObjectManager();

            let feature;
            for (let i in geojson.features) {
                feature = geojson.features[i];
                if (feature.properties.iso3166 == "RU-KR") {
                    feature.id = feature.properties.iso3166;
                    feature.options = {
                        strokeColor: '#0074e8',
                        strokeOpacity: 0.8,
                        fillColor: map.fillColor,
                        fillOpacity: 0.25,
                        hintCloseTimeout: 0,
                        hintOpenTimeout: 0,
                        interactivityModel: 'default#transparent',
                    };
                    regions.add(feature);
                }
            }
            map.myMap.geoObjects.add(regions);
        }, function (e) {
            console.log(e);
        });
    },

    showRayon: function (regionName) {
        const fullname = regionName + ", Республика Карелия";
        this.dd("showRayon fullname:" + fullname);
        if (!fullname) {
            this.showKarelRegion();
            this.myMap.setZoom(10, { duration: map.ani_time });
            return;
        }
        const url = "http://nominatim.openstreetmap.org/search";
        $.getJSON(url, { q: fullname, format: "json", polygon_geojson: 1 })
            .then(function (data) {
                map.dd(data);
                $.each(data, function(ix, place) {
                    if (place.osm_type === "relation") {
                        const coords = map.osmRegionConvert(place.geojson.coordinates[0]);
                        const p = new ymaps.Polygon(coords, {}, {
                            fillColor: map.fillColor,
                            fillOpacity: 0.25,
                            interactivityModel: 'default#transparent',
                            strokeColor: '#0074e8',
                            strokeOpacity: 0.8,
                            strokeWidth: 1
                        });
                        map.myMap.geoObjects.add(p);
                    }
                });
                //map.adjustMapBounds();
                //map.myMap.setBounds(map.myMap.geoObjects.getBounds(), { checkZoomRange: true });
            }, function (err) {
                console.log(err);
            });
    },

    osmRegionConvert: function (coordinates) {
        let res = [];
        for (let i = 0; i < coordinates.length; i++) {
            res.push([
                coordinates[i][1], coordinates[i][0]
            ])
        }
        return [res];
    },

    createClusterer: function () {
        this.clusterer = new ymaps.Clusterer({
            clusterIconLayout: 'default#pieChart',
            clusterIconPieChartRadius: 20,
            clusterIconPieChartCoreRadius: 9,
            clusterIconPieChartStrokeWidth: 3,
            hasBalloon: false
        });
    },

    clear: function () {
        this.clusterer.removeAll();
        this.myMap.geoObjects.removeAll();
    },

    adjustMapBounds:function () {
        if (this.myMap.geoObjects.getLength()) {
            this.myMap.setBounds(this.myMap.geoObjects.getBounds(), { checkZoomRange: true, duration: map.ani_time });
        }
    },

    removeDoubles: function (objects) {
        let ids = [];
        let res = [];
        objects.forEach(function (val) {
           if ($.inArray(val.id, ids) < 0) {
               res.push(val);
               ids.push(val.id);
           }
        });
        return res;
    },

    showMarkers: function (objects, callback) {
        this.dd("showMarkers", objects);
        this.clear();
        if (!objects || !objects.length) {
            //this.myMap.setCenter(this.center, this.zoom);
            return this.adjustMapBounds();
        }
        let geoObjects = [];
        let coords = [];
        objects = this.removeDoubles(objects);
        for (let i = 0, len = objects.length; i < len; i++) {
            coords = objects[i].map_coordinates.split(",");
            geoObjects[i] = new ymaps.Placemark(coords, {
                //hintContent: objects[i].name
            }, {
                preset: 'islands#blueCircleIcon',
                iconColor: objects[i].color
            });
            geoObjects[i].obj_id = objects[i].id;
            geoObjects[i].color = objects[i].color;
            geoObjects[i].events.add('click', function (e) {
                let target = e.get('target');
                app.color = target.color;
                app.showObjectInfo(target.obj_id);
            });
        }
        this.clusterer.add(geoObjects);
        this.myMap.geoObjects.add(this.clusterer);
        if (objects.length > 1) {
            this.adjustMapBounds();
        } else {
            coords = objects[0].map_coordinates.split(",");
            this.myMap.setCenter(coords, map.single_zoom);
        }
        if (callback) callback();
    },

}

$(function (){
    map.init();
});
