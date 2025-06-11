'use strict';

/** global variables: **/

/* map objects: */
var map = null;
var map_title = null;
var map_color_map = null;
/* site variables: */
var site_vars = {
  /* map element: */
  'el_content_map': document.getElementById('content_map'),
  /* colour map: */
  'color_map': {
    'min': -0.18,
    'max': 0.18,
    'decimals': 2,
    'colors': [
      '#3b4cc0', '#5a78e4', '#7b9ff9', '#9ebeff', '#c0d4f5', '#dddcdc',
      '#f2cbb7', '#f7ad90', '#ee8468', '#d65244', '#b40426'
    ]
  },
  /* data areas and files: */
  'data': {
    'africa': {
      'name': 'Africa',
      'adm1_file': 'data/africa_adm1.json',
      'adm1_data': null,
      'adm2_file': 'data/africa_adm2.json',
      'adm2_data': null
    },
    'americas': {
      'name': 'Americas',
      'adm1_file': 'data/americas_adm1.json',
      'adm1_data': null,
      'adm2_file': 'data/americas_adm2.json',
      'adm2_data': null
    },
    'se_asia': {
      'name': 'Southeast Asia',
      'adm1_file': 'data/se_asia_adm1.json',
      'adm1_data': null,
      'adm2_file': 'data/se_asia_adm2.json',
      'adm2_data': null
    },
  }
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

/* data loading function: */
async function load_data() {
  /* loop through data ares defined in site_vars: */
  for (var area in site_vars['data']) {
    /* data for this area: */
    var area_data = site_vars['data'][area];
    /* load data from json using fetch. adm1 data ... : */
    var adm1_file = area_data['adm1_file'];
    await fetch(adm1_file, {'cache': 'no-cache'}).then(async function(data_req) {
      /* if successful: */
      if (data_req.status == 200) {
        /* store json information from request: */
        area_data['adm1_data'] = await data_req.json();
      } else {
        /* log error: */
        console.log('* failed to load data from: ' + adm1_file);
      };
    });
    /* ... adm2 file: */
    var adm2_file = area_data['adm2_file'];
    await fetch(adm2_file, {'cache': 'no-cache'}).then(async function(data_req) {
      /* if successful: */
      if (data_req.status == 200) {
        /* store json information from request: */
        area_data['adm2_data'] = await data_req.json();
      } else {
        /* log error: */
        console.log('* failed to load data from: ' + adm2_file);
      };
    });
  };
  /* once data is loaded, load the map: */
  load_map();
};

/* function to convert value to color: */
function value_to_color(value) {
  /* get the colour map: */
  var color_map = site_vars['color_map'];
  /* get the colours and bounds for variable: */
  var data_min = color_map['min'];
  var data_max = color_map['max'];
  var data_colors = color_map['colors'];
  /* number of colours: */
  var color_count = data_colors.length;
  /* max index value: */
  var max_index = color_count - 1;
  /* work out increment for color values: */
  var color_inc = (data_max - data_min) / color_count;
  /* work out colour index for value: */
  var color_index = Math.floor((value - data_min) / color_inc);
  if (color_index < 0) {
    color_index = 0;
  };
  if (color_index > max_index) {
    color_index = max_index;
  };
  /* return the colour: */
  return data_colors[color_index];
};

/* function to draw color map data: */
function draw_color_map() {
  /* get the colour map: */
  var color_map = site_vars['color_map'];
  /* get the colours and bounds for variable: */
  var data_min = color_map['min'];
  var data_max = color_map['max'];
  var data_colors = color_map['colors'];
  var data_decimals = color_map['decimals'];
  /* number of colours: */
  var color_count = data_colors.length;
  /* work out increment for color values: */
  var color_inc = (data_max - data_min) / color_count;
  /* create html: */
  var color_map_html = '';
  for (var i = (color_count - 1); i > -1; i--) {
    var my_html = '<p>';
    my_html += '<span class="map_color_map_color" style="background: ' + data_colors[i] + ';"></span>';
    my_html += '<span class="map_color_map_value">';
    if (i == (color_count - 1)) {
      my_html += '&gt;= ' + (data_min + (i * color_inc)).toFixed(data_decimals);
    } else {
      if (i == 0) {
        my_html += '&lt; ';
      } else {
        my_html += (data_min + (i * color_inc)).toFixed(data_decimals) + ' &lt; ';
      };
      my_html += (data_min + ((i + 1) * color_inc)).toFixed(data_decimals);
    };
    my_html += '</span>';
    my_html += '</p>';
    color_map_html += my_html;
  };
  /* return the html: */
  return color_map_html;
};

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

  /* add africa adm1 polygons: */
  var africa_adm1 = site_vars['data']['africa']['adm1_data'];
  for (var i = 0 ; i < africa_adm1.length ; i ++) {
    var poly_value = africa_adm1[i]['dTnc_perforestloss_smooth_aw'];
    if (poly_value == 'null') {
      continue;
    };
    var poly_name = africa_adm1[i]['name'];
    var poly_fc = africa_adm1[i]['forest_cover_2020'];
    var poly_color = value_to_color(poly_value);
    var poly = L.polygon(africa_adm1[i]['geometry'], {'color': poly_color, 'weight': 1, 'fillColor': poly_color, 'fillOpacity': 0.6});
    poly.bindTooltip(
      '<b>name:</b> ' + poly_name + '<br>' +
      '<b>dTnc:</b> ' + poly_value.toFixed(3) + '<br>' +
      '<b>forest cover 2020:</b> ' + poly_fc.toFixed(3)
    );
    poly.addTo(map);
  };

  /* add americas adm1 polygons: */
  var americas_adm1 = site_vars['data']['americas']['adm1_data'];
  for (var i = 0 ; i < americas_adm1.length ; i ++) {
    var poly_value = americas_adm1[i]['dTnc_perforestloss_smooth_aw'];
    if (poly_value == 'null') {
      continue;
    };
    var poly_name = americas_adm1[i]['name'];
    var poly_fc = americas_adm1[i]['forest_cover_2020'];
    var poly_color = value_to_color(poly_value);
    var poly = L.polygon(americas_adm1[i]['geometry'], {'color': poly_color, 'weight': 1, 'fillColor': poly_color, 'fillOpacity': 0.6});
    poly.bindTooltip(
      '<b>name:</b> ' + poly_name + '<br>' +
      '<b>dTnc:</b> ' + poly_value.toFixed(3) + '<br>' +
      '<b>forest cover 2020:</b> ' + poly_fc.toFixed(3)
    );
    poly.addTo(map);
  };

  /* add se_asia adm1 polygons: */
  var se_asia_adm1 = site_vars['data']['se_asia']['adm1_data'];
  for (var i = 0 ; i < se_asia_adm1.length ; i ++) {
    var poly_value = se_asia_adm1[i]['dTnc_perforestloss_smooth_aw'];
    if (poly_value == 'null') {
      continue;
    };
    var poly_name = se_asia_adm1[i]['name'];
    var poly_fc = se_asia_adm1[i]['forest_cover_2020'];
    var poly_color = value_to_color(poly_value);
    var poly = L.polygon(se_asia_adm1[i]['geometry'], {'color': poly_color, 'weight': 1, 'fillColor': poly_color, 'fillOpacity': 0.6});
    poly.bindTooltip(
      '<b>name:</b> ' + poly_name + '<br>' +
      '<b>dTnc:</b> ' + poly_value.toFixed(3) + '<br>' +
      '<b>forest cover 2020:</b> ' + poly_fc.toFixed(3)
    );
    poly.addTo(map);
  };

  /* add colour map: */
  var color_map_src = draw_color_map();
  map_color_map = L.control({position: 'bottomright'});
  map_color_map.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'map_control map_color_map');
      this.update(color_map_src);
      return this._div;
  };
  map_color_map.update = function(color_map_html) {
    this._div.innerHTML = color_map_html;
  };
  map_color_map.addTo(map);

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
  var my_title = 'adm1';
  map_title.update(my_title);

  /* add mouse pointer position: */
  L.control.mousePosition().addTo(map);

  /* add scale bar: */
  L.control.scale().addTo(map);

};


/** add listeners: **/

/* on page load: */
window.addEventListener('load', function() {
  /* load data: */
  load_data();
});
