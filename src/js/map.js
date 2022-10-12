var map, mapFeatures, baseLayer, globalLayer, globalBoundaryLayer, globalLabelLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'hornafrica_polbnda_subnationa-2rkvd2';
var hoveredStateId = null;


let ipcData = [
  // {
  //   iso: 'eth',
  //   data: 'Ethiopia_May_2021_merged.geojson'
  // },
  {
    iso: 'ken',
    data: 'kenya_ipc.geojson'
  },
  {
    iso: 'som',
    data: 'Somalia_Aug2022_Map_projected.geojson'
  }
];


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

  //get bottommost layer from basemap
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.id==='Dashed bnd 1m') {
      baseLayer = layer.id;
    }
    if (layer.id.startsWith('Countries')) {
      map.setLayoutProperty(layer.id, 'text-allow-overlap', true);
    }
  }

  //add map layers

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
  }, baseLayer);
  waterLayer = 'waterbodies-layer';
  map.setLayoutProperty(waterLayer, 'visibility', 'visible');

  //adm1 fills
  let subnationalSource = 'hornafrica_polbnda_subnationa-2rkvd2';
  let subnationalCentroidSource = 'hornafrica_polbndp_subnationa-a7lq5r';
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 1],
    'source-layer': subnationalSource,
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1
    }
  }, baseLayer);
  globalLayer = 'country-fills';
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');

  //adm1 boundaries
  map.addLayer({
    'id': 'country-boundaries',
    'type': 'line',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 1],
    'source-layer': subnationalSource,
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
    'source-layer': subnationalCentroidSource,
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right']
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': '#FFF',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);
  globalLabelLayer = 'country-labels';
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');

  //adm2 fills
  map.addLayer({
    'id': 'subnational-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalSource,
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1,
    }
  }, baseLayer);
  subnationalLayer = 'subnational-fills';
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');

  //adm2 boundaries
  map.addLayer({
    'id': 'subnational-boundaries',
    'type': 'line',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalSource,
    'paint': {
      'line-color': '#F2F2F2',
      'line-opacity': 1
    }
  }, baseLayer);
  subnationalBoundaryLayer = 'subnational-boundaries';
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');

  //adm2 centroids
  map.addLayer({
    'id': 'subnational-labels',
    'type': 'symbol',
    'source': 'country-centroids',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalCentroidSource,
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-padding': 8
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);
  subnationalLabelLayer = 'subnational-labels';
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');


  mapFeatures = map.queryRenderedFeatures();

  //load raster layers
  loadRasters();

  //init element events
  createEvents();

  //init global and country layers
  initGlobalLayer();
  initCountryLayer();

  //load special IPC layers
  ipcData.forEach(function(country) {
    loadIPCLayer(country);
  });

  //zoom into region
  zoomToRegion();

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

function loadIPCLayer(country) {
  map.addSource(`${country.iso}-ipc`, {
    type: 'geojson',
    data: `data/${country.data}`,
    generateId: true 
  });
  map.addLayer({
    id: `${country.iso}-ipc-layer`,
    type: 'fill',
    source: `${country.iso}-ipc`,
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'overall_phase_P'],
        1,
        '#CDFACD',
        2,
        '#FAE61C',
        3,
        '#E67800',
        4,
        '#C80100',
        5,
        '#640100'
      ]
    }
  }, baseLayer);

  map.addLayer({
    id: `${country.iso}-ipc-boundary-layer`,
    type: 'line',
    source: `${country.iso}-ipc`,
    paint: {
      'line-color': '#E0E0E0',
    }
  }, baseLayer);

  map.addLayer({
    id: `${country.iso}-ipc-label-layer`,
    type: 'symbol',
    source: `${country.iso}-ipc`,
    filter: ['==', ['geometry-type'], 'Polygon'],
    layout: {
      'text-field': ['get', 'area'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.4
    },
    paint: {
      'text-color': '#333',
      'text-halo-color': '#F2F2F2',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);

  map.on('mouseenter', `${country.iso}-ipc-layer`, onMouseEnter);
  map.on('mouseleave', `${country.iso}-ipc-layer`, onMouseLeave);
  map.on('mousemove', `${country.iso}-ipc-layer`, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    let prop = e.features[0].properties;
    let content = `<h2>${prop['area']}, ${prop['country']}</h2>`;
    let phase = transformIPC(prop['overall_phase_P']);
    let p3Pop = prop['p3_plus_P_population'];
    content += `${currentIndicator.name}: <div class="stat">${phase}</div>`;
    if (p3Pop!==undefined) {
      content += '<div class="table-display">';
      content += `<div class="table-row"><div>Population in IPC Phase 3+:</div><div>${shortenNumFormat(p3Pop)}</div></div>`;
      content += '</div>';
    }
    
    tooltip.setHTML(content);
    tooltip
      .addTo(map)
      .setLngLat(e.lngLat);
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
      updateCountrySource();
    }
  }
  //deep link to specific layer in global view
  if (location.indexOf('?layer=')>-1) {
    var layer = location.split('layer=')[1];
    if (layer=='idps') {
      window.history.replaceState(null, null, window.location.pathname);
    }
    else {
      var selected = $('.map-legend').find('input[data-layer="'+layer+'"]');
      selected.prop('checked', true);
      onLayerSelected(selected);
    }
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
    if (isCountryView()) {
      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
    else {
      resetMap();
      updateGlobalLayer(currentCountry.code);
    }

    //update country specific sources
    updateCountrySource();
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
    map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');
    updateGlobalLayer();

  }
  else {
    map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');
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
        left: -100,
        bottom: 0
    } :
    { 
      top: padding,//$('.tab-menubar').outerHeight() + padding
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

  //append country code to url
  window.history.replaceState(null, null, window.location.pathname + '?c='+currentCountry.code);
}


function updateCountrySource() {
  let country = (currentCountry.code=='') ? 'regional' : (currentCountry.code).toLowerCase();
  $('.map-legend .indicator').each(function(layer) {
    let div = $(this).find('.source-container');
    let indicator = $(this).find('input').val() + '+' + country;
    updateSource(div, indicator);
  });
}

function zoomToRegion() {
  var offset = 50;
  let mapPadding = (isMobile) ?
    {
        top: 0,
        right: -100,
        left: -100,
        bottom: 0
    } :
    { 
      top: offset,
      right: 0,
      bottom: offset,
      left: $('.key-figure-panel').outerWidth() - offset,
    };
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });
}

function resetMap() {
  //reset layers
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');
  map.setLayoutProperty(globalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');
  toggleIPCLayers(true);

  //reset disabled inputs
  disableInput('#affected+food+ipc+phase+type', false);

  //reset map legends
  $('.map-legend .indicator.country-only').hide();
  $('.legend-container').show();

  //reset download links
  $('.download-link').hide();
  $('.download-link.regional').show();

  //set default layer  
  var selected = $('.map-legend').find('input[data-layer="ipc_acute_food_insecurity_phase"]');
  selected.prop('checked', true);
  onLayerSelected(selected);

  //zoom to region
  zoomToRegion()
  map.once('moveend', initKeyFigures);

  //reset location
  window.history.replaceState(null, null, window.location.pathname);
}

function toggleIPCLayers(visible, currCountry) {
  ipcData.forEach(function(country) {
    let vis = (visible && (currCountry==undefined || currCountry.toLowerCase()==country.iso)) ? 'visible' : 'none';
    map.setLayoutProperty(`${country.iso}-ipc-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-boundary-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-label-layer`, 'visibility', vis);
  });

  //turn subnational labels off for ipc layer
  if (visible) {
    map.setLayoutProperty(globalLabelLayer, 'visibility', 'none');
    map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');
  }
}
