'use strict';


/** global variables: **/


/* site variables: */
var site_vars = {
  /* map element: */
  'el_content_map': document.getElementById('content_map'),
  /* colour map: */
  'color_map': {
    'min': -2.45,
    'max': 2.45,
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
  'data': {},
  /* default data type: */
  'type_default': 'adm1',
  /* current data type: */
  'type_current': null,
  /* default deforestation percentage (1.0 = 100%): */
  'deforest_default': 1.0,
  /* current deforestation percentage: */
  'deforest_current': null,
  /* minimum npix value for area to be included: */
  'min_npix': 250,
  /* elements for slider: */
  'slider_el': document.getElementById('content_slider_slider'),
  'slider_value_el': document.getElementById('content_slider_value'),
  /* language settings: */
  'language': null,
  'map_language': null,
  'text_url': 'text',
  'text': {}
};
/* map objects: */
var map = null;
var map_title = null;
var map_color_map = null;
var map_data_groups = null;
var map_state = null;

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
    var lng = this.options.lngFormatter ?
      this.options.lngFormatter(e.latlng.lng) :
      L.Util.formatNum(e.latlng.lng, this.options.numDigits);
    var lat = this.options.latFormatter ?
      this.options.latFormatter(e.latlng.lat) :
      L.Util.formatNum(e.latlng.lat, this.options.numDigits);
    var value = this.options.lngFirst ?
      lng + this.options.separator + lat :
      lat + this.options.separator + lng;
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
      await fetch(type_file, {'cache': 'no-cache'}).then(
        async function(data_req) {
          /* if successful: */
          if (data_req.status == 200) {
            /* store json information from request: */
            site_vars['data'][data_area][data_type] = await data_req.json();
          } else {
            /* log error: */
            console.log('* failed to load data from: ' + type_file);
          };
        }
      );
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
  /* get selected language and text: */
  var text_language = site_vars['language'];
  var language_text = site_vars['text'][text_language];
  /* get the colours and bounds for variable: */
  var data_title = language_text['color_map_title'];
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
  /* add title: */
  color_map_html += '<p class="map_color_map_title">' + data_title + '</p>';
  for (var i = (color_count - 1); i > -1; i--) {
    var my_html = '<p>';
    my_html += '<span class="map_color_map_color" style="background: ' +
               data_colors[i] + ';"></span>';
    my_html += '<span class="map_color_map_value">';
    if (i == (color_count - 1)) {
      my_html += '&gt;= ' + (data_min + (i * color_inc)).toFixed(data_decimals);
    } else {
      if (i == 0) {
        my_html += '&lt; ';
      } else {
        my_html += (data_min + (i * color_inc)).toFixed(data_decimals) +
                   ' &lt; ';
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

/* function to load slider: */
function load_slider() {
  /* elements for slider: */
  var slider_el = site_vars['slider_el'];
  var slider_value_el = site_vars['slider_value_el'];
  /* current deforest value: */
  var slider_value = parseFloat(site_vars['deforest_current']);
  /* if no current value, use default value: */
  if ((isNaN(slider_value)) || (slider_value == null) ||
      (slider_value == undefined)) {
    slider_value = parseFloat(site_vars['deforest_default'])
  }
  /* set the value: */
  slider_value_el.innerHTML = (slider_value * 100).toFixed(0) + ' %';
  /* if the slider does not exist ... : */
  if (slider_el.noUiSlider == undefined){
    /* create slider: */
    noUiSlider.create(slider_el, {
      'start': [slider_value],
      'range': {
        'min': [0.1],
        'max': [1.0]
      },
      'step': 0.05,
      'tooltips': false
    });
    /* add change listener: */
    slider_el.noUiSlider.on('change', function() {
      /* get slider value: */
      var my_value = parseFloat(slider_el.noUiSlider.get());
      /* update map: */
      load_map(my_value);
      /* set / display the value: */
      slider_value_el.innerHTML = (my_value * 100).toFixed(0) + ' %';
    });
    /* add slide listener: */
    slider_el.noUiSlider.on('slide', function() {
      /* get slider value: */
      var my_value = parseFloat(slider_el.noUiSlider.get());
      /* set / display the value: */
      slider_value_el.innerHTML = (my_value * 100).toFixed(0) + ' %';
    });
 };
};

/* mouseover event handler function: */
function mouseover_handler(e) {
  e.stopPropagation();
  e.preventDefault();
};

/* map loading function: */
function load_map(deforest_percent) {
  /* get selected language and text: */
  var text_language = site_vars['language'];
  var language_text = site_vars['text'][text_language];
  /* current language of map text: */
  var map_language = site_vars['map_language'];
  /* check deforest_percent value. if undefined, use default value: */
  if ((deforest_percent == null) || (deforest_percent == undefined)) {
    deforest_percent = site_vars['deforest_current'];
    if ((isNaN(deforest_percent)) || (deforest_percent == null) ||
        (deforest_percent == undefined)) {
      deforest_percent = site_vars['deforest_default'];
    };
  };
  /* check deforest_percent value. if same as current,
     and language has not changed do nothing: */
  if ((deforest_percent == site_vars['deforest_current']) &&
      (map_language == text_language)) {
    return;
  };
  /* if language has changed, need to re-draw map: */
  if ((map != null) && (map_language != text_language)) {
    map.remove();
    map = null;
    map_color_map = null;
  };
  /* define cartodb layer: */
  var layer_cartodb = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      'attribution': '&copy; ' +
                     '<a href="https://www.openstreetmap.org/copyright" ' +
                     'target="_blank">OpenStreetMap</a>, &copy; ' +
                     '<a href="https://carto.com/attributions" ' +
                     'target="_blank">CARTO</a>',
      'subdomains': 'abcd',
      minZoom: 2,
      maxZoom: 10,
      noWrap: true
    }
  );
  /* define openstreetmap layer: */
  var layer_osm = L.tileLayer(
    'https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      'attribution': '&copy; ' +
                     '<a href="https://osm.org/copyright" target="_blank">' +
                     'OpenStreetMap contributors</a>',
      minZoom: 2,
      maxZoom: 10,
      noWrap: true
    }
  );
  /* define sentinel-2 layer: */
  var host_s2 = 'https://tiles.maps.eox.at';
  var tiles_s2 = 's2cloudless-2023_3857';
  var layer_s2 = L.tileLayer(
    host_s2 + '/wmts/1.0.0/' + tiles_s2 + '/default/g/{z}/{y}/{x}.jpg', {
      'attribution': '<a href="https://s2maps.eu/" target="_blank">' +
                     'Sentinel-2 cloudless</a>',
      minZoom: 2,
      maxZoom: 10,
      noWrap: true
    }
  );
  /* all base tile layers: */
  var tile_layers = {
    'Carto': layer_cartodb,
    'Open Street Map': layer_osm,
    'Sentinel-2': layer_s2
  };
  /* define map if not defined: */
  if (map == null) {
    map = L.map('content_map', {
      zoom: 3,
      minZoom: 3,
      maxZoom: 9,
      layers: [],
      center: [0, 0],
      maxBounds: [
        [-75, -180],
        [75, 180]
      ],
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: true
    });
    /* remove prefix from attribution control: */
    var map_atrr_control = map.attributionControl;
    map_atrr_control.setPrefix(false);
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
    var control_layers = L.control.layers(
      tile_layers,
      null,
      {'collapsed': true, 'position': 'topleft'}
    ).addTo(map);
    /* update layer control icon: */
    var control_layers_container = control_layers.getContainer();
    control_layers_container.title = 'Select base map';
    var control_layers_childs = control_layers_container.children;
    /* loop through control child elements ... : */
    for (var i = 0 ; i < control_layers_childs.length ; i++) {
      /* find the toggle element, and adjust icon (background image): */
      var this_child = control_layers_childs[i];
      if (this_child.className == 'leaflet-control-layers-toggle') {
        this_child.style.backgroundImage =
          'url(./img/controls/tile_layers.png)';
      };
    };
    /* init layer groups for data types: */
    map_data_groups = {};
    var data_layers = {};
    /* get current data type: */
    var data_type_current = site_vars['type_current'];
    if ((data_type_current == null) || (data_type_current == undefined)) {
      data_type_current = site_vars['type_default'];
    }
    /* loop through data types: */
    for (var i = 0 ; i < site_vars['data_types'].length ; i++) {
      /* this type + label: */
      var data_type = site_vars['data_types'][i];
      var data_type_label = language_text['data_type_labels'][data_type];
      /* create layer group: */
      map_data_groups[data_type_label] = L.layerGroup([]);
      map_data_groups[data_type_label].title = data_type_label;
      map_data_groups[data_type_label].type = data_type;
      data_layers[data_type_label] = map_data_groups[data_type_label];
      /* update map title and store current type when layer is added: */
      map_data_groups[data_type_label].on('add', (e) => {
        map_title.update(e.target.title);
        site_vars['type_current'] = e.target.type;
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
          var poly_dtnc = type_data[k]['dTnc'];
          if (poly_dtnc == 'null') {
            continue;
          };
          /* ignore areas without sufficient pixel counts: */
          var poly_npix = type_data[k]['npix'];
          if ((poly_npix == 'null') ||
              (parseInt(poly_npix) < site_vars['min_npix'])) {
            continue;
          };
          /* get required values for the area: */
          var poly_name = type_data[k]['name'];
          var poly_sd = type_data[k]['sd'];
          var poly_fc = type_data[k]['forest_cover_2020'];
          /* calculate temperature difference value: */
          var poly_dt = deforest_percent * poly_dtnc * poly_fc;
          var poly_color = value_to_color(poly_dt);
          var poly = L.polygon(type_data[k]['geometry'], {
            'color': poly_color,
            'weight': 1,
            'fillColor': poly_color,
            'fillOpacity': 0.6
          });
          /* add required properties to poly: */
          poly.dtnc = poly_dtnc;
          poly.fc = poly_fc;
          /* add tooltip: */
          poly.tooltip = '<b>Region:</b> ' + poly_name + '<br>' +
                         '<b>' + language_text['poly_points'] + ':</b> ' +
                         poly_npix + '<br>' +
                         '<b>' + language_text['poly_dt'] + ':</b> XDTX<br>' +
                         '<b>' + language_text['poly_dtnc'] + ':</b> ' +
                         poly_dtnc.toFixed(3) + ' (+/- ' + poly_sd.toFixed(3) +
                         ')<br>' +
                         '<b>' + language_text['poly_fc'] + ':</b> ' + poly_fc.toFixed(3);
          var poly_tooltip = L.tooltip({
            'content': poly.tooltip.replace('XDTX', poly_dt.toFixed(3)),
            'sticky': true,
            'offset': [3, -3],
            'className': 'leaflet-tooltip-local'
          });
          poly.bindTooltip(poly_tooltip);
          /* add polygon to layer group: */
          map_data_groups[data_type_label].addLayer(poly);
        };
      };
      /* if this is the current data type, add to map: */
      if (data_type == data_type_current) {
        map_data_groups[data_type_label].addTo(map);
      };
    };
    /* add data type control: */
    var control_types = L.control.layers(
      data_layers,
      null,
      {'collapsed': true, 'position': 'topright'}
    ).addTo(map);
    /* update type control icon: */
    var control_types_container = control_types.getContainer();
    control_types_container.title = "Select data type";
    var control_types_childs = control_types_container.children;
    /* loop through control child elements ... : */
    for (var i = 0 ; i < control_types_childs.length ; i++) {
      /* find the toggle element, and adjust icon (background image): */
      var this_child = control_types_childs[i];
      if (this_child.className == 'leaflet-control-layers-toggle') {
        this_child.style.backgroundImage =
          'url(./img/controls/type_layers.png)';
      };
    };
    /* add mouse pointer position: */
    L.control.mousePosition().addTo(map);
    /* add scale bar: */
    L.control.scale().addTo(map);
    /* and load the slider: */
    load_slider();
  /* else, map is defined, so need to redraw polygons: */
  } else {
    /* loop through data type groups: */
    for (var data_group_name in map_data_groups) {
      /* this data group: */
      var map_data_group = map_data_groups[data_group_name];
      /* loop through polygons in data group: */
      map_data_group.eachLayer(function(l) {
        /* calculate updated dt value and colour: */
        var poly_dt = deforest_percent * l.dtnc * l.fc;
        var poly_color = value_to_color(poly_dt);
        /* update polygon style and tooltip: */
        l.setStyle({'color': poly_color, 'fillColor': poly_color})
        l.bindTooltip(l.tooltip.replace('XDTX', poly_dt.toFixed(3)), {
          'sticky': true,
          'offset': [3, -3],
          'className': 'leaflet-tooltip-local'
        });
      });
    };
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
  /* disable mouseover events while zooming or moving: */
  map.on('zoomstart', function() {
    document.addEventListener('mouseover', mouseover_handler, true);
  });
  map.on('movestart', function() {
    document.addEventListener('mouseover', mouseover_handler, true);
  });
  map.on('zoomend', function() {
    document.removeEventListener('mouseover', mouseover_handler, true);
    map_state = [map.getCenter(), map.getZoom()];
  });
  map.on('moveend', function() {
    document.removeEventListener('mouseover', mouseover_handler, true);
    map_state = [map.getCenter(), map.getZoom()];
  });
  /* set map view, if possible: */
  if ((map_state != null) && (map_state != undefined)) {
    map.setView(map_state[0], map_state[1]);
  };
  /* store current deforestation percentage value: */
  site_vars['deforest_current'] = deforest_percent;
  /* store current language of map text: */
  site_vars['map_language'] = text_language;
};

/* text loading function: */
async function load_text(text_language) {
  /* set language first. if not defined ... : */
  if ((text_language == null) ||
      (text_language == undefined)) {
    /* try to detect from browser: */
    var browser_language = navigator.language;
    /* check for portugese: */
    if (browser_language.search(/^pt/) == 0) {
      text_language = 'pt';
    /* else, use english: */
    } else {
      text_language = 'en';
    };
  /* use english, unless portugese specified ... :*/
  } else if (text_language != 'pt') {
      text_language = 'en';
  };
  /* set site language: */
  site_vars['language'] = text_language;
  /* load text: */
  var language_file = site_vars['text_url'] + '/' +
                      text_language + '.json';
  await fetch(language_file, {'cache': 'no-cache'}).then(
    async function(text_req) {
      /* if successful: */
      if (text_req.status == 200) {
        /* store json information from request: */
        site_vars['text'][text_language] = await text_req.json();
      } else {
        /* log error: */
        console.log('* failed to load text from: ' + language_file);
        site_vars['text'][text_language] = null;
      };
    }
  );
  /* if text load was successful ... : */
  if (site_vars['text'][text_language] != null) {
    /* text for this language: */
    var language_text = site_vars['text'][text_language];
    /* update html elemnts. title: */
    document.title = language_text['title'];
    var el_title_a = document.getElementById('title_a');
    el_title_a.innerHTML = language_text['title'];
    /* slider label: */
    var el_content_slider_title = document.getElementById('content_slider_title');
    el_content_slider_title.innerHTML = language_text['slider_title'];
    /* text: */
    var el_content_text = document.getElementById('content_text');
    el_content_text.innerHTML = language_text['text'];
  };
  /* underline active language link: */
  var language_links = document.getElementsByClassName('language_link');
  for (var i = 0 ; i < language_links.length ; i++) {
    var language_link = language_links[i];
    language_link.style.textDecoration = 'none';
  };
  var language_link_active = document.getElementById('language_link_' + text_language);
  language_link_active.style.textDecoration = 'underline';
  /* then load the data: */
  load_data();
};


/** add listeners: **/


/* on page load: */
window.addEventListener('load', function() {
  /* load text: */
  load_text();
});
