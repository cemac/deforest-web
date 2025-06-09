'use strict';

/** global variables: **/

/* map objects: */
var map = null;
var map_title = null;
/* site variables: */
var site_vars = {
  /* map element: */
  'el_content_map': document.getElementById('content_map'),
};

/* map mouse position overlay: */

L.Control.MousePosition = L.Control.extend({
  options: {
    position: 'bottomleft',
    separator: ', ',
    emptyString: 'lat: --, lon: --',
    lngFirst: false,
    numDigits: 3,
    lngFormatter: function(lon) {
      return 'lon:' + lon.toFixed(3)
    },
    latFormatter: function(lat) {
      return 'lat:' + lat.toFixed(3)
    },
    prefix: ''
  },

  onAdd: function (map) {
    this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
    L.DomEvent.disableClickPropagation(this._container);
    map.on('mousemove', this._onMouseMove, this);
    this._container.innerHTML=this.options.emptyString;
    return this._container;
  },

  onRemove: function (map) {
    map.off('mousemove', this._onMouseMove)
  },

  _onMouseMove: function (e) {
    var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
    var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
    var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
    var prefixAndValue = this.options.prefix + ' ' + value;
    this._container.innerHTML = prefixAndValue;
  }

});

L.Map.mergeOptions({
    positionControl: true
});

L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
    }
});

L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};

/** functions **/

/* map loading function: */
function load_map() {
  /* cartodb map tiles: */
  var layer_cartodb = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '',
      minZoom: 0,
      maxZoom: 12
    }
  );

  /* define map: */
  map = L.map('content_map', {
    zoom: 2,
    minZoom: 2,
    maxZoom: 12,
    layers: [],
    center: [0, 0],
    maxBounds: [
      [-75, -300],
      [75, 300]
    ],
    maxBoundsViscosity: 1.0,
    zoomControl: false,
    attributionControl: false
  });

  /* add layers to map: */
  map.addLayer(layer_cartodb);

  /* add zoom control: */
  var zoom_control = L.control.zoom();
  zoom_control.addTo(map);

  /* add map title: */
  map_title = L.control();
  map_title.onAdd = function(map) {
     this._div = L.DomUtil.create('div', 'map_control map_title');
     this.update();
     return this._div;
  };
  map_title.update = function(title) {
    if (title != undefined) {
      this._div.innerHTML = title;
    };
  };
  map_title.addTo(map);
  /* update map title: */
  var my_title = 'map title';
  map_title.update(my_title);

  /* add mouse pointer position: */
  L.control.mousePosition().addTo(map);

  /* add scale bar: */
  L.control.scale().addTo(map);

};

/** add listeners: **/

/* on page load: */
window.addEventListener('load', function() {
  /* load map: */
  load_map();
});
