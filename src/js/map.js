var map, mapFeatures, globalLayer, globalBoundaryLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'hornafrica_polbnda_int_uncs-9e96cy';
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

  //get layers
  const layers = map.getStyle().layers;
  let labelLayer;
  for (const layer of layers) {
    if (layer.id==='Countries 2-4') {
      labelLayer = layer.id;
      break;
    }
  }

  //add map layers
  //country fills
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.4p7qgaya',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'source-layer': 'hornafrica_polbnda_int_uncs-9e96cy',
    'paint': {
      'fill-color': '#f1f1ee',
      'fill-opacity': 1
    }
  }, labelLayer);
  globalLayer = 'country-fills';

  //country boundaries
  map.addSource('country-lines', {
    'url': 'mapbox://humdata.d6fpfzk8',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-boundaries',
    'type': 'line',
    'source': 'country-lines',
    'source-layer': 'hornafrica_polbndl_int_uncs-8iaq93',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  });
  globalBoundaryLayer = 'country-boundaries';


  //subnational fills
  map.addSource('subnational-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-fills',
    'type': 'fill',
    'source': 'subnational-polygons',
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'fill-color': '#f1f1ee',
      'fill-opacity': 1,
    }
  });
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
    'source-layer': 'hornafrica_polbnda_subnationa-2rkvd2',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  });
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
    'source-layer': 'hornafrica_polbndp_subnationa-a7lq5r',
    'layout': {
      'text-field': ['get', 'ADM1_REF'],
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

  mapFeatures = map.queryRenderedFeatures();

  //load pop density rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();
    var raster = countryCodeList[country_code];
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
        labelLayer
      );
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
    }
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
    // var menuItem = $('.menu-indicators').find('li[data-layer="'+layer+'"]');
    // menuItem = (menuItem.length<1) ? $('.menu-indicators').find('li[data-layer="covid-19_cases_and_deaths"]') : menuItem;
    // selectLayer(menuItem);
  }
}

function selectLayer(layer) {
  currentIndicator = {id: layer.val(), name: layer.parent().text()};
  updateGlobalLayer();
  //vizTrack(`main ${currentCountry.code} view`, currentCountryIndicator.name);

//   //reset any deep links
//   let layerID = layer.attr('data-layer');
//   let location = (layerID==undefined) ? window.location.pathname : window.location.pathname+'?layer='+layerID;
//   window.history.replaceState(null, null, location);
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
  //map legend radio events
  $('input[type="radio"]').click(function(){
    var selected = $('input[name="countryIndicators"]:checked');
    selectLayer(selected);
  });

  //chart view trendseries select event
  d3.select('.trendseries-select').on('change',function(e) {
    var selected = d3.select('.trendseries-select').node().value;
    updateTimeseries(selected);
    if (currentCountry.code!==undefined && selected!==undefined)
      vizTrack(`chart ${currentCountry.code} view`, selected);
  });


  //country select event
  d3.select('.country-select').on('change',function(e) {
    currentCountry.code = d3.select('.country-select').node().value;
    currentCountry.name = d3.select('.country-select option:checked').text();
    if (currentCountry.code==='') {
      resetMap();
    }
    else {
      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }

    updateGlobalLayer(currentCountry.code);
  });
}


// function selectCountry(features) {
//   //set first country indicator
//   $('#population').prop('checked', true);
//   currentCountryIndicator = {
//     id: $('input[name="countryIndicators"]:checked').val(), 
//     name: $('input[name="countryIndicators"]:checked').parent().text()
//   };

//   //reset panel
//   $('.panel-content').animate({scrollTop: 0}, 300);
//   $('.indicator-select').val('');

//   updateCountryLayer();
//   map.setLayoutProperty(globalLayer, 'visibility', 'none');
//   map.setLayoutProperty(globalMarkerLayer, 'visibility', 'none');
//   map.setLayoutProperty(countryLayer, 'visibility', 'visible');
//   map.setLayoutProperty(countryBoundaryLayer, 'visibility', 'visible');
//   map.setLayoutProperty(countryLabelLayer, 'visibility', 'visible');
//   map.setLayoutProperty(countryMarkerLayer, 'visibility', 'visible');

//   var target = bbox.default(turfHelpers.featureCollection(features));
//   var offset = 50;
//   map.fitBounds(target, {
//     padding: {top: offset, right: $('.map-legend.country').outerWidth()+offset, bottom: offset, left: ($('.key-figure-panel').outerWidth() - $('.content-left').outerWidth()) + offset},
//     linear: true
//   });

//   map.once('moveend', initCountryView);
//   vizTrack(currentCountry.code, currentCountryIndicator.name);

//   //append country code to url
//   window.history.replaceState(null, null, '?c='+currentCountry.code);
// }




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
      top: $('.tab-menubar').outerHeight(),
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
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');

  map.flyTo({ 
    speed: 1,
    zoom: zoomLevel,
    center: [37, 6]
  });
  map.once('moveend', initKeyFigures);
}
