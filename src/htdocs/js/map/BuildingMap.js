/* global L, MOUNT_PATH */
'use strict';


var Xhr = require('util/Xhr');

// Leaflet plugins
require('leaflet-fullscreen');
require('leaflet.label');
require('map/MousePosition');
require('map/RestoreMap');

// Factories for creating map layers
require('map/DarkLayer');
require('map/GreyscaleLayer');
require('map/SatelliteLayer');
require('map/BuildingsLayer');
require('map/TerrainLayer');


/*
 * Factory for Leaflet map instance
 */
var BuildingMap = function (options) {
  var _initialize,
      _this,

      _buildings,
      _el,
      _map,

      _getMapLayers,
      _finishMapInit,
      _initMap,
      _loadBuildingsLayer;

  _this = {};


  _initialize = function (options) {
    options = options || {};
    _el = options.el || document.createElement('div');

    // Create Leaflet map immediately so it can be passed to _loadBuildingsLayer()
    _map = _initMap();

    // Load buildings layer which calls _finishMapInit() when finished
    _loadBuildingsLayer(_map);
  };

  /**
   * Get all map layers that will be displayed on map
   *
   * @return layers {Object}
   *     {
   *       baseLayers: {Object}
   *       overlays: {Object}
   *       defaults: {Array}
   *     }
   */
  _getMapLayers = function () {
    var dark,
        greyscale,
        layers,
        name,
        satellite,
        terrain;

    dark = L.darkLayer();
    greyscale = L.greyscaleLayer();
    satellite = L.satelliteLayer();
    terrain = L.terrainLayer();

    layers = {};
    layers.baseLayers = {
      'Terrain': terrain,
      'Satellite': satellite,
      'Greyscale': greyscale,
      'Dark': dark
    };
    layers.overlays = {};
    layers.defaults = [terrain, _buildings];

    // Add buildings to overlays / defaults
    Object.keys(_buildings.layers).forEach(function(key) {
      name = _buildings.names[key] + ' (' + _buildings.count[key] + ')';
      layers.overlays[name] = _buildings.layers[key];
      layers.defaults.push(_buildings.layers[key]);
    });

    return layers;
  };

  /**
   * Finish Leaflet map init - separated out from initMap so we can call oms
   *   library with leaflet map instance before Buildings layer is created
   */
  _finishMapInit = function () {
    var layers;

    // Get all layers and add default layers to map
    layers = _getMapLayers();
    layers.defaults.forEach(function(layer) {
      _map.addLayer(layer);
    });

    // Set intial map extent to contain buildings overlay
    _map.fitBounds(_buildings.getBounds());

    // Add controllers
    L.control.fullscreen({ pseudoFullscreen: true }).addTo(_map);
    L.control.layers(layers.baseLayers, layers.overlays).addTo(_map);
    L.control.mousePosition().addTo(_map);
    L.control.scale().addTo(_map);

    // Remember user's map settings (selected layers, map extent)
    _map.restoreMap({
      baseLayers: layers.baseLayers,
      id: 'main',
      overlays: layers.overlays
    });
  };

  /**
   * Create Leaflet map instance
   */
  _initMap = function () {
    var map;

    map = L.map(_el, {
      scrollWheelZoom: false
    });

    return map;
  };

  /**
   * Load buildings layer from geojson data via ajax
   */
  _loadBuildingsLayer = function (map) {
    Xhr.ajax({
      url: MOUNT_PATH + '/_getBuildings.json.php',
      success: function (data) {
        _buildings = L.buildingsLayer({
          data: data,
          map: map
        });
        _finishMapInit();
      },
      error: function (status) {
        console.log(status);
      }
    });
  };
  

  _initialize(options);
  options = null;
  return _this;
};


module.exports = BuildingMap;
