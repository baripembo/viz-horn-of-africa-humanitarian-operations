var map, mapFeatures, globalLayer, globalLabelLayer, globalMarkerLayer, countryLayer, countryBoundaryLayer, countryLabelLayer, countryMarkerLayer, tooltip, markerScale, countryMarkerScale;
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
  //currentIndicator = {id: $('.menu-indicators').find('.selected').attr('data-id'), name: $('.menu-indicators').find('.selected').attr('data-legend'), title: $('.menu-indicators').find('.selected').text()};

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

  //add layers
  //adm1 fills
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.4p7qgaya',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'adm1-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'source-layer': 'hornafrica_polbnda_int_uncs-9e96cy',
    'paint': {
      'fill-color': '#f1f1ee',
      'fill-opacity': 1
    }
  }, labelLayer);
  globalLayer = 'adm1-fills';

  //adm1 boundaries
  map.addSource('country-lines', {
    'url': 'mapbox://humdata.d6fpfzk8',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'adm1-boundaries',
    'type': 'line',
    'source': 'country-lines',
    'source-layer': 'hornafrica_polbndl_int_uncs-8iaq93',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  });
  globalBoundaryLayer = 'adm1-boundaries';

  //adm1 markers
  // map.addSource('country-markers', {
  //   'url': 'mapbox://humdata.01v49eax',
  //   'type': 'vector'
  // });
  // map.addLayer({
  //   'id': 'adm1-markers',
  //   'type': 'circle',
  //   'source': 'country-markers',
  //   'source-layer': 'hornafrica_polbndp_int_uncs-arxx3e',
  //   'paint': {
  //     'circle-color': '#ffcc00'
  //   }
  // });
  // globalMarkerLayer = 'adm1-markers';

  //adm1 labels
  map.addSource('country-labels', {
    'url': 'mapbox://humdata.01v49eax',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'adm1-labels',
    'type': 'symbol',
    'source': 'country-labels',
    'source-layer': 'hornafrica_polbndp_int_uncs-arxx3e',
    'paint': {
    }
  });
  globalLabelLayer = 'adm1-labels';

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
  //initCountryLayer();

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

// function deepLinkView() {
//   let countryCode = 'SOM';
//   if (countryCodeList.hasOwnProperty(countryCode)) {
//     currentCountry.code = countryCode;
//     currentCountry.name = '';

//     //find matched features and zoom to country
//     let selectedFeatures = matchMapFeatures(currentCountry.code);
//     selectCountry(selectedFeatures);
//   }

//   //deep link to specific layer 
//   let location = window.location.search;
//   if (location.indexOf('?layer=')>-1) {
//     let param = location.split('layer=')[1];
//     let layer = $('.map-legend.country').find('input[data-layer="'+param+'"]');
//     //selectLayer(layer);
//   }
// }

function selectLayer(layer) {
  //layer.prop('checked', true);
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
//     padding: {top: offset, right: $('.map-legend.country').outerWidth()+offset, bottom: offset, left: ($('.country-panel').outerWidth() - $('.content-left').outerWidth()) + offset},
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
      left: $('.country-panel').outerWidth() + padding,
    };
  map.fitBounds(target, {
    offset: [0, 0] ,
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });

  map.once('moveend', initCountryPanel);
}


function resetMap() {
  map.flyTo({ 
    speed: 1,
    zoom: zoomLevel,
    center: [37, 6]
  });
  map.once('moveend', initCountryPanel);
}


/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
// function initCountryView() {
//   $('.country-panel').scrollTop(0);
//   initCountryPanel();
// }

// function initCountryLayer() {
//   //color scale
//   countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);
//   createCountryLegend(countryColorScale);

//   //mouse events
//   map.on('mouseenter', countryLayer, onMouseEnter);
//   map.on('mouseleave', countryLayer, onMouseLeave);
//   map.on('mousemove', countryLayer, function(e) {  
//     if (currentCountryIndicator.id!='#acled+events') {
//       var f = map.queryRenderedFeatures(e.point)[0];
//       if (f.properties.ADM_PCODE!=undefined && f.properties.ADM_REF==currentCountry.name) {
//         map.getCanvas().style.cursor = 'pointer';
//         if (f.layer.id!='hostilities-layer') createCountryMapTooltip(f.properties.ADM1_EN, f.properties.ADM1_PCODE, e.point);
//         tooltip
//           .addTo(map)
//           .setLngLat(e.lngLat);
//       }
//       else {
//         if (f.layer.id!='hostilities-layer' && f.layer.id!='country-labels' && f.layer.id!='adm1-label' && f.layer.id!='town-dots') {
//           map.getCanvas().style.cursor = '';
//           tooltip.remove();
//         }
//         else {
//           tooltip
//             .addTo(map)
//             .setLngLat(e.lngLat);
//         } 
//       }
//     }
//   });    
// }


function initLocationLabels() {
  //surrounding country data
  map.addSource('country-data', {
    type: 'geojson',
    data: countryData,
    generateId: true 
  });

  //country labels
  map.addLayer({
    id: 'country-labels',
    type: 'symbol',
    source: 'country-data',
    layout: {
      'text-field': [
        'format',
        ['upcase', ['get', 'CNTRY']]
      ],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-allow-overlap': true,
      'text-letter-spacing': 0.3
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  });


  //town/capital data
  map.addSource('location-data', {
    type: 'geojson',
    data: locationData,
    generateId: true 
  });

  //towm markers
  map.addLayer({
    id: 'town-dots',
    type: 'symbol',
    source: 'location-data',
    filter: ['==', 'TYPE', 'ADMIN 1'],
    layout: {
      'icon-image': 'marker-town',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 1],
      'icon-allow-overlap': true,
      'text-field': ['get', 'CAPITAL'],
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
  }, globalLabelLayer);


  //capital markers
  map.addLayer({
    id: 'marker-capital',
    type: 'symbol',
    source: 'location-data',
    filter: ['==', 'TYPE', 'TERRITORY'],
    layout: {
      'icon-image': 'marker-capital',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 0.9],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['get', 'CAPITAL'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.7,
      'text-allow-overlap': true,
      'text-ignore-placement': true
    },
    paint: {
      'text-color': '#888',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, globalLabelLayer);

}


// function updateCountryLayer() {
//   colorNoData = '#F9F9F9';
//   $('.no-data-key').hide();

//   //max
//   var max = getCountryIndicatorMax();
//   //if (currentCountryIndicator.id.indexOf('pct')>0 && max>0) max = 1;

//   //color scale
//   var clrRange = colorRange;
//   switch(currentCountryIndicator.id) {
//     case '#population':
//       clrRange = populationColorRange;
//       break;
//     default:
//       //
//   }
//   var countryColorScale = d3.scaleQuantize().domain([0, max]).range(clrRange);

//   $('.map-legend.country').removeClass('population acled idps');
//   if (currentCountryIndicator.id=='#population') {
//     $('.map-legend.country').addClass('population');
//     countryColorScale = d3.scaleOrdinal().domain(['<1', '1-2', '2-5', '5-10', '10-25', '25-50', '>50']).range(populationColorRange);
//   }

//   updateCountryLegend(countryColorScale);

//   //data join
//   var expression = ['match', ['get', 'ADM_PCODE']];
//   var expressionBoundary = ['match', ['get', 'ADM_PCODE']];
//   var expressionOpacity = ['match', ['get', 'ADM_PCODE']];
//   subnationalData.forEach(function(d) {
//     var color, boundaryColor, layerOpacity, markerSize;
//     if (d['#country+code']==currentCountry.code) {
//       var val = +d[currentCountryIndicator.id];
//       layerOpacity = 1;
//       color = (val<0 || !isVal(val) || isNaN(val)) ? colorNoData : countryColorScale(val);

//       //turn off choropleth for population layer
//       color = (currentCountryIndicator.id=='#population') ? colorDefault : color;
//     }
//     else {
//       color = colorDefault;
//       boundaryColor = '#E0E0E0';
//       layerOpacity = 0;
//     }
    
//     expression.push(d['#adm1+code'], color);
//     expressionBoundary.push(d['#adm1+code'], boundaryColor);
//     expressionOpacity.push(d['#adm1+code'], layerOpacity);
//   });
//   //set expression defaults
//   expression.push(colorDefault);
//   expressionBoundary.push('#E0E0E0');
//   expressionOpacity.push(0);

//   //hide all pop density rasters
//   var countryList = Object.keys(countryCodeList);
//   countryList.forEach(function(country_code) {
//     var id = country_code.toLowerCase();
//     if (map.getLayer(id+'-popdensity'))
//       map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
//   });

//   //set properties
//   if (currentCountryIndicator.id=='#population') {
//     var id = currentCountry.code.toLowerCase();
//     map.setLayoutProperty(id+'-popdensity', 'visibility', 'visible');
//   }
//   // map.setPaintProperty(countryLayer, 'fill-color', expression);
//   // map.setPaintProperty(countryBoundaryLayer, 'line-opacity', expressionOpacity);
//   // map.setPaintProperty(countryBoundaryLayer, 'line-color', '#C4C4C4');//expressionBoundary
//   // map.setPaintProperty(countryLabelLayer, 'text-opacity', expressionOpacity);


//   //toggle layers
//   // if (currentCountryIndicator.id=='#acled+events') {
//   //   resetLayers();
//   //   map.setLayoutProperty('acled-dots', 'visibility', 'visible');
//   //   map.setLayoutProperty('border-crossings-layer', 'visibility', 'none');
//   //   map.setLayoutProperty('hostilities-layer', 'visibility', 'none');
//   // }
//   // else if (currentCountryIndicator.id=='#affected+idps') {
//   //   resetLayers();
//   //   map.setLayoutProperty(countryLayer, 'visibility', 'none');
//   //   map.setLayoutProperty('macro-regions', 'visibility', 'visible');
//   // }
//   // else {
//   //   resetLayers();
//   // }
// }


function resetLayers() {
  // map.setLayoutProperty(countryLayer, 'visibility', 'visible')
  // map.setLayoutProperty('acled-dots', 'visibility', 'none');
  // map.setLayoutProperty('border-crossings-layer', 'visibility', 'visible');
  // map.setLayoutProperty('hostilities-layer', 'visibility', 'visible');
  // map.setLayoutProperty('macro-regions', 'visibility', 'none');
}


// function createCountryLegend(scale) {
//   //set data sources
//   createSource($('.map-legend.country .ipc-source'), '#affected+food+ipc+p3plus+num');
//   createSource($('.map-legend.country .population-source'), '#population');

//   var legend = d3.legendColor()
//     .labelFormat(percentFormat)
//     .cells(colorRange.length)
//     .scale(scale);

//   var div = d3.select('.map-legend.country .legend-scale');
//   var svg = div.append('svg')
//     .attr('class', 'legend-container');

//   svg.append('g')
//     .attr('class', 'scale')
//     .call(legend);

//   //no data
//   var nodata = div.append('svg')
//     .attr('class', 'no-data-key');

//   nodata.append('rect')
//     .attr('width', 15)
//     .attr('height', 15);

//   nodata.append('text')
//     .attr('class', 'label')
//     .text('No Data');

//   //boundaries disclaimer
//   createFootnote('.map-legend.country', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

//   //expand/collapse functionality
//   $('.map-legend.country .toggle-icon, .map-legend.country .collapsed-title').on('click', function() {
//     $(this).parent().toggleClass('collapsed');
//     $('.legend-gradient').toggleClass('collapsed');
//   });
// }


// function updateCountryLegend(scale) {
//   //set format for legend format
//   let legendFormat = (currentCountryIndicator.id=='#population') ? shortenNumFormat : d3.format('.0f');

//   //set legend title
//   let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
//   $('.map-legend.country .legend-title').html(legendTitle);

//   //update legend
//   var legend = d3.legendColor()
//     .labelFormat(legendFormat)
//     .cells(colorRange.length)
//     .scale(scale);

//   var g = d3.select('.map-legend.country .scale');
//   g.call(legend);
// }


// function getCountryIndicatorMax() {
//   var max =  d3.max(subnationalData, function(d) { 
//     if (d['#country+code']==currentCountry.code) {
//       return +d[currentCountryIndicator.id]; 
//     }
//   });
//   return max;
// }


//mouse event/leave events
function onMouseEnter(e) {
  map.getCanvas().style.cursor = 'pointer';
  tooltip.addTo(map);
}
function onMouseLeave(e) {
  map.getCanvas().style.cursor = '';
  tooltip.remove();
}


/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
// function createCountryMapTooltip(adm1_name, adm1_pcode, point) {
//   var adm1 = subnationalData.filter(function(c) {
//     if (c['#adm1+code']==adm1_pcode && c['#country+code']==currentCountry.code)
//       return c;
//   });

//   if (adm1[0]!=undefined) {
//     var val = adm1[0][currentCountryIndicator.id];
//     var label = currentCountryIndicator.name;

//     //format content for tooltip
//     if (val!=undefined && val!='' && !isNaN(val)) {
//       if (currentCountryIndicator.id.indexOf('pct')>-1) val = (val>1) ? percentFormat(1) : percentFormat(val);
//       if (currentCountryIndicator.id=='#population') val = shortenNumFormat(val);
//     }
//     else {
//       val = 'No Data';
//     }

//     let content = '';
//     content = `<h2>${adm1_name} Oblast</h2>${label}:<div class="stat">${val}</div>`;

//     tooltip.setHTML(content);
//     //if (!isMobile) setTooltipPosition(point)
//   }
// }

// function setTooltipPosition(point) {
//   var tooltipWidth = $('.map-tooltip').width();
//   var tooltipHeight = $('.map-tooltip').height();
//   var anchorDirection = (point.x + tooltipWidth > viewportWidth) ? 'right' : 'left';
//   var yOffset = 0;
//   if (point.y + tooltipHeight/2 > viewportHeight) yOffset = viewportHeight - (point.y + tooltipHeight/2);
//   if (point.y - tooltipHeight/2 < 0) yOffset = tooltipHeight/2 - point.y;
//   var popupOffsets = {
//     'right': [0, yOffset],
//     'left': [0, yOffset]
//   };
//   tooltip.options.offset = popupOffsets;
//   tooltip.options.anchor = anchorDirection;

//   if (yOffset>0) {
//     $('.mapboxgl-popup-tip').css('align-self', 'flex-start');
//     $('.mapboxgl-popup-tip').css('margin-top', point.y);
//   }
//   else if (yOffset<0)  {
//     $('.mapboxgl-popup-tip').css('align-self', 'flex-end');
//     $('.mapboxgl-popup-tip').css('margin-bottom', viewportHeight-point.y-10);
//   }
//   else {
//     $('.mapboxgl-popup-tip').css('align-self', 'center');
//     $('.mapboxgl-popup-tip').css('margin-top', 0);
//     $('.mapboxgl-popup-tip').css('margin-bottom', 0);
//   }
// }

