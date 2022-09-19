var map, mapFeatures, baseLayer, globalLayer, globalBoundaryLayer, globalLabelLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'hornafrica_polbnda_subnationa-2rkvd2';
var hoveredStateId = null;
function initMap() {
  console.log('Loading map...')
  map = new mapboxgl.Map({
    container: 'global-map',
    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
    center: [37, 6],
    minZoom: minZoom,
    zoom: zoomLevel,
    attributionControl: false
  });

  map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
     .addControl(new mapboxgl.AttributionControl(), 'bottom-right');

  map.on('load', function() {
    console.log('Map loaded')
    
    mapLoaded = true;
    if (dataLoaded==true) displayMap();
  });
}

function displayMap() {
  console.log('Display map');

  //remove loader and show vis
  $('.loader, #static-map').remove();
  $('#global-map, .map-legend').css('opacity', 1);

  //set initial indicator
  currentIndicator = {
    id: $('input[name="countryIndicators"]:checked').val(), 
    name: $('input[name="countryIndicators"]:checked').parent().text()
  };

  //init element events
  createEvents();

  //get bottommost layer
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.id==='Dashed bnd 1m') {
      baseLayer = layer.id;
      //break;
    }
    //if (layer.id==='Countries 6-8') console.log(layer)
  }

  //add map layers
  //country fills
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 1],
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1
    }
  }, baseLayer);
  globalLayer = 'country-fills';
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');

  //country boundaries
  map.addSource('country-lines', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-boundaries',
    'type': 'line',
    'source': 'country-lines',
    'filter': ['==', 'ADM_LEVEL', 1],
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, baseLayer);
  globalBoundaryLayer = 'country-boundaries';
  map.setLayoutProperty(globalBoundaryLayer, 'visibility', 'visible');

  //adm1 centroids
  map.addSource('country-centroids', {
    'url': 'mapbox://humdata.cywtvjt9',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-labels',
    'type': 'symbol',
    'source': 'country-centroids',
    'filter': ['==', 'ADM_LEVEL', 1],
    'source-layer': 'hornafrica_polbndp_subnationa-a7lq5r',
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.4
    },
    paint: {
      'text-color': '#888',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);
  globalLabelLayer = 'country-labels';
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');


  //subnational fills
  map.addSource('subnational-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-fills',
    'type': 'fill',
    'source': 'subnational-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1,
    }
  }, baseLayer);
  subnationalLayer = 'subnational-fills';
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');

  //subnational boundaries
  map.addSource('subnational-lines', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-boundaries',
    'type': 'line',
    'source': 'subnational-lines',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, baseLayer);
  subnationalBoundaryLayer = 'subnational-boundaries';
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');


  //subnational centroids
  map.addSource('subnational-centroids', {
    'url': 'mapbox://humdata.cywtvjt9',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-labels',
    'type': 'symbol',
    'source': 'subnational-centroids',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': 'hornafrica_polbndp_subnationa-a7lq5r',
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.4
    },
    paint: {
      'text-color': '#888',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  });
  subnationalLabelLayer = 'subnational-labels';
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');

  //water bodies
  map.addSource('waterbodies', {
    'url': 'mapbox://humdata.bo7vgo3j',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'waterbodies-layer',
    'type': 'fill',
    'source': 'waterbodies',
    'source-layer': 'hornafrica_waterbodies-8qylz8',
    'paint': {
      'fill-color': '#99daea'
    }
  }, subnationalLabelLayer);
  waterLayer = 'waterbodies-layer';
  map.setLayoutProperty(waterLayer, 'visibility', 'visible');


  mapFeatures = map.queryRenderedFeatures();

  loadRasters();

  //zoom into region
  var offset = 100;
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: offset, right: 0, bottom: offset, left: $('.key-figure-panel').outerWidth()},
    linear: true
  });


  //init global and country layers
  initGlobalLayer();
  initCountryLayer();

  //deeplink to country if parameter exists
  if (viewInitialized==true) deepLinkView();

  //create tooltip
  tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'map-tooltip'
  });
}


function loadRasters() {
  //load pop density and chirps rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();

    //pop rasters
    var raster = countryCodeList[country_code].pop;
    if (raster!='') {
      map.addSource(id+'-pop-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+raster
      });

      map.addLayer(
        {
          id: id+'-popdensity',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+raster+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        globalBoundaryLayer
      );
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
    }

    //chirps rasters
    var chirpsRaster = countryCodeList[country_code].chirps;
    if (chirpsRaster!='') {
      map.addSource(id+'-chirps-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+chirpsRaster
      });

      map.addLayer(
        {
          id: id+'-chirps',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+chirpsRaster+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        globalBoundaryLayer
      );
      map.setLayoutProperty(id+'-chirps', 'visibility', 'none');
    }
  });
}

function deepLinkView() {
  var location = window.location.search;
  //deep link to country view
  if (location.indexOf('?c=')>-1) {
    var countryCode = location.split('c=')[1].toUpperCase();
    if (countryCodeList.hasOwnProperty(countryCode)) {    
      $('.country-select').val(countryCode);
      currentCountry.code = countryCode;
      currentCountry.name = d3.select('.country-select option:checked').text();

      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
  }
  //deep link to specific layer in global view
  if (location.indexOf('?layer=')>-1) {
    var layer = location.split('layer=')[1];
    var selected = $('.map-legend').find('input[data-layer="'+layer+'"]');
    selected.prop('checked', true);
    onLayerSelected(selected);
  }
}

function matchMapFeatures(country_code) {
  //loop through mapFeatures to find matches to currentCountry.code
  var selectedFeatures = [];
  mapFeatures.forEach(function(feature) {
    if (feature.sourceLayer==adm0SourceLayer && feature.properties.ISO3_CODE==currentCountry.code) {
      selectedFeatures.push(feature)
    }
  });
  return selectedFeatures;
}

function createEvents() {
  //country dropdown select event
  d3.select('.country-select').on('change',function(e) {
    currentCountry.code = d3.select('.country-select').node().value;
    currentCountry.name = d3.select('.country-select option:checked').text();
    if (currentCountry.code==='') {
      resetMap();
      updateGlobalLayer(currentCountry.code);
    }
    else {
      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
  });

  //map legend radio events
  $('input[type="radio"]').click(function(){
    var selected = $('input[name="countryIndicators"]:checked');
    onLayerSelected(selected);
  });

  //chart view trendseries select event
  // d3.select('.trendseries-select').on('change',function(e) {
  //   var selected = d3.select('.trendseries-select').node().value;
  //   updateTimeseries(selected);
  //   if (currentCountry.code!==undefined && selected!==undefined)
  //     vizTrack(`chart ${currentCountry.code} view`, selected);
  // });
}

function onLayerSelected(selected) {
  currentIndicator = {id: selected.val(), name: selected.parent().text()};
  selectLayer(selected);
  
  if (currentCountry.code=='') {
    updateGlobalLayer();
  }
  else {
    var selectedFeatures = matchMapFeatures(currentCountry.code);
    selectCountry(selectedFeatures);
  }
}


function selectLayer(layer) {
  //vizTrack(`main ${currentCountry.code} view`, currentIndicator.name);

  //reset any deep links
  let layerID = layer.attr('data-layer');
  let location = (layerID==undefined) ? window.location.pathname : window.location.pathname+'?layer='+layerID;
  window.history.replaceState(null, null, location);
}


function selectCountry(features) {
  let target = bbox.default(turfHelpers.featureCollection(features));
  let padding = 40;
  let mapPadding = (isMobile) ?
    {
        top: 0,
        right: -100,
        left: -200,
        bottom: 0
    } :
    { 
      top: $('.tab-menubar').outerHeight() + padding,
      right: $('.map-legend').outerWidth(),
      bottom: padding,
      left: $('.key-figure-panel').outerWidth() + padding,
    };
  map.fitBounds(target, {
    offset: [0, 0] ,
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });

  map.once('moveend', updateCountryLayer);
}




function resetMap() {
  //reset layers
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');
  map.setLayoutProperty(globalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');

  var offset = 100;
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: offset, right: 0, bottom: offset, left: $('.key-figure-panel').outerWidth()},
    linear: true
  });
  map.once('moveend', initKeyFigures);
}
