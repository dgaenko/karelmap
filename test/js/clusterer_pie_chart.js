ymaps.ready(function () {
    var myMap = new ymaps.Map('map', {
            center: [63.535154, 33.588625],
            zoom: 10
        }, {
            searchControlProvider: 'yandex#search'
        }
    ),
    clusterer = new ymaps.Clusterer({
        // Макет метки кластера pieChart.
        clusterIconLayout: 'default#pieChart',
        // Радиус диаграммы в пикселях.
        clusterIconPieChartRadius: 20,
        // Радиус центральной части макета.
        clusterIconPieChartCoreRadius: 9,
        // Ширина линий-разделителей секторов и внешней обводки диаграммы.
        clusterIconPieChartStrokeWidth: 3,
        // Определяет наличие поля balloon.
        hasBalloon: false
    }),
    // Значения цветов иконок.
    placemarkColors = [
        '#DB425A', '#4C4DA2', '#00DEAD', '#D73AD2',
        '#F8CC4D', '#F88D00', '#AC646C', '#548FB7'
    ],
    points = [
        [62.087946, 32.373323], [61.518858, 30.199490], [66.269772, 33.051628], [62.096717, 32.384980],
        [64.587372, 30.596592], [64.577610, 30.602865], [64.585815, 30.613788],
        [63.743704, 34.312618], [63.744346, 34.346235], [63.736107, 34.313301], [63.751735, 34.311575]
    ],
    geoObjects = [];

    ymaps.borders.load('RU').then(function (geojson) {
        console.log(geojson);
        this.regions = new ymaps.ObjectManager();

        let feature;
        for (let i in geojson.features) {
            feature = geojson.features[i];
            if (feature.properties.iso3166 == "RU-KR") {
                console.log(feature.properties.iso3166, feature.properties.name);
                feature.id = feature.properties.iso3166;
                feature.options = {
                    strokeColor: '#0074e8',
                    strokeOpacity: 0.8,
                    fillColor: '#0074e8',
                    fillOpacity: 0.4,
                    hintCloseTimeout: 0,
                    hintOpenTimeout: 0
                };
                this.regions.add(feature);
            }
        }
        myMap.geoObjects.add(this.regions);
    }, function (e) {
        console.log(e);
    });

    for (var i = 0, len = points.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(points[i], {}, {
            preset: 'islands#blueCircleIcon',
            iconColor: getRandomColor()
        });
    }

    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    myMap.setBounds(clusterer.getBounds(), {
        checkZoomRange: true
    });

    function getRandomColor() {
        return placemarkColors[Math.floor(Math.random() * placemarkColors.length)];
    }
});
