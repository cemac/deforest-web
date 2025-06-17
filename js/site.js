'use strict';


/** global variables: **/


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
  /* data details and storage: */
  'data_url': 'data',
  'data_areas': ['africa', 'americas', 'se_asia'],
  'data_types': ['adm1', 'adm2'],
  'data': {}
};
/* map objects: */
var map = null;
var map_title = null;
var map_color_map = null;
var map_data_groups = null;

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
  /* loop through data areas defined in site_vars: */
  for (var i = 0 ; i < site_vars['data_areas'].length ; i++) {
    /* this area: */
    var data_area = site_vars['data_areas'][i];
    /* data for this area: */
    site_vars['data'][data_area] = {};
    var area_data = site_vars['data'][data_area];
    /* loop through data types: */
    for (var j = 0 ; j < site_vars['data_types'].length ; j++) {
      /* this type: */
      var data_type = site_vars['data_types'][j];
      /* data for this area and type: */
      area_data[data_type] = {};
      var type_data = area_data[data_type];
      /* load data from json using fetch: */
      var type_file = site_vars['data_url'] + '/' +
                      data_area + '_' + data_type + '.json';
      await fetch(type_file, {'cache': 'no-cache'}).then(async function(data_req) {
        /* if successful: */
        if (data_req.status == 200) {
          /* store json information from request: */
          site_vars['data'][data_area][data_type] = await data_req.json();
        } else {
          /* log error: */
          console.log('* failed to load data from: ' + type_file);
        };
      });
    };
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
  /* define cartodb layer: */
  var layer_cartodb = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'subdomains': 'abcd',
      minZoom: 1,
      maxZoom: 10
    }
  );
  /* define openstreetmap layer: */
  var layer_osm = L.tileLayer(
    'https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      'attribution': '&copy; <a href="https://osm.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      minZoom: 1,
      maxZoom: 10
    }
  );
  /* all base tile layers: */
  var tile_layers = {
    'Carto': layer_cartodb,
    'Open Street Map': layer_osm
  };
  /* define map if not defined: */
  if (map == null) {
    map = L.map('content_map', {
      zoom: 2,
      minZoom: 2,
      maxZoom: 9,
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
    /* add base tile layer to map: */
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
    /* add base layer control: */
    L.control.layers(
      tile_layers,
      null,
      {'collapsed': true, 'position': 'topleft'}
    ).addTo(map);
    /* init layer groups for data types: */
    map_data_groups = {};
    var data_layers = {};
    /* loop through data types: */
    for (var i = 0 ; i < site_vars['data_types'].length ; i++) {
      /* this type: */
      var data_type = site_vars['data_types'][i];
      /* create layer group: */
      map_data_groups[data_type] = L.layerGroup([]);
      map_data_groups[data_type].title = data_type;
      data_layers[data_type] = map_data_groups[data_type];
      /* update map title when layer is added: */
      map_data_groups[data_type].on('add', (e) => {
        map_title.update(e.target.title);
      });
      /* loop through data areas defined in site_vars: */
      for (var j = 0 ; j < site_vars['data_areas'].length ; j++) {
        /* this area: */
        var data_area = site_vars['data_areas'][j];
        /* data for this area: */
        var area_data = site_vars['data'][data_area];
        /* data for this area and type: */
        var type_data = area_data[data_type];
        /* create polygons for this data type: */
        for (var k = 0 ; k < type_data.length ; k++) {
          /* ignore areas where dt value is not defined: */
          var poly_value = type_data[k]['dTnc'];
          if (poly_value == 'null') {
            continue;
          };
          /* ignore areas without sufficient pixel counts: */
          var poly_npix = type_data[k]['npix'];
          if ((poly_npix == 'null') || (parseInt(poly_npix) < 250)) {
            continue;
          };
          /* get required values for the area: */
          var poly_sd = type_data[k]['sd'];
          var poly_name = type_data[k]['name'];
          var poly_fc = type_data[k]['forest_cover_2020'];
          var poly_color = value_to_color(poly_value);
          var poly = L.polygon(type_data[k]['geometry'], {'color': poly_color, 'weight': 1, 'fillColor': poly_color, 'fillOpacity': 0.6});
          poly.bindTooltip(
            '<b>name:</b> ' + poly_name + '<br>' +
            '<b>npix:</b> ' + poly_npix + '<br>' +
            '<b>dTnc:</b> ' + poly_value.toFixed(3) + ' (+/- ' + poly_sd.toFixed(3) + ')<br>' +
            '<b>forest cover 2020:</b> ' + poly_fc.toFixed(3),
            {'sticky': true, 'offset': [3, -3]}
          );
          /* add polygon to layer group: */
          map_data_groups[data_type].addLayer(poly);
        };
      };
      /* if this is the first layer group, add to map: */
      if (i == 0) {
        map_data_groups[data_type].addTo(map);
      };
    };
    /* add data type control: */
    L.control.layers(
      data_layers,
      null,
      {'collapsed': true, 'position': 'topright'}
    ).addTo(map);
    /* add mouse pointer position: */
    L.control.mousePosition().addTo(map);
    /* add scale bar: */
    L.control.scale().addTo(map);
  };
  /* add colour map if not yet added: */
  if (map_color_map == null) {
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
  };
};


/** add listeners: **/


/* on page load: */
window.addEventListener('load', function() {
  /* load data: */
  load_data();
});
