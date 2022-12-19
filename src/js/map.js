var map, mapFeatures, baseLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, subnationalMarkerLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'hornafrica_polbnda_subnationa-2rkvd2';
var hoveredStateId = null;


let ipcData = [
  {
    iso: 'eth',
    data: 'https://raw.githubusercontent.com/OCHA-DAP/viz-horn-of-africa-humanitarian-operations/v1/src/data/eth_food_security.geojson'
  },
  {
    iso: 'ken',
    data: 'https://raw.githubusercontent.com/OCHA-DAP/viz-horn-of-africa-humanitarian-operations/v1/src/data/kenya_ipc.geojson'
  },
  {
    iso: 'som',
    data: 'https://raw.githubusercontent.com/OCHA-DAP/viz-horn-of-africa-humanitarian-operations/v1/src/data/Somalia_Aug2022_Map_projected.geojson'
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

  //fills source
  let subnationalSource = 'hornafrica_polbnda_subnationa-2rkvd2';
  let subnationalCentroidSource = 'hornafrica_polbndp_subnationa-a7lq5r';
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });

  //fills
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
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');

  //boundaries
  map.addLayer({
    'id': 'subnational-boundaries',
    'type': 'line',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalSource,
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, baseLayer);
  subnationalBoundaryLayer = 'subnational-boundaries';
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');

  //centroids source
  map.addSource('country-centroids', {
    'url': 'mapbox://humdata.cywtvjt9',
    'type': 'vector'
  });

  //centroids
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
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');

  //markers
  map.addLayer({
    'id': 'subnational-markers',
    'type': 'circle',
    'source': 'country-centroids',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalCentroidSource,
    'paint': {
      'circle-color': '#999',
      'circle-opacity': 0.5,
      'circle-stroke-color': '#999',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 1
    }
  }, baseLayer);
  subnationalMarkerLayer = 'subnational-markers';
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');



  mapFeatures = map.queryRenderedFeatures();

  //load raster layers
  loadRasters();

  //init element events
  createEvents();

  //init country layers
  initCountryLayer();

  //load special IPC layers
  ipcData.forEach(function(country) {
    loadIPCLayer(country);
  });

  //load acled layer
  initAcledLayer();

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
        subnationalBoundaryLayer
      );
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
    }

    //chirps mam rasters
    var chirpsRasterMAM = countryCodeList[country_code].chirpsMAM;
    if (chirpsRasterMAM!='') {
      map.addSource(id+'-mam-chirps-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+chirpsRasterMAM
      });

      map.addLayer(
        {
          id: id+'-mam-chirps',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+chirpsRasterMAM+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        subnationalBoundaryLayer
      );
      map.setLayoutProperty(id+'-mam-chirps', 'visibility', 'none');
    }

    //chirps ond rasters
    var chirpsRasterOND = countryCodeList[country_code].chirpsOND;
    if (chirpsRasterOND!='') {
      map.addSource(id+'-ond-chirps-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+chirpsRasterOND
      });

      map.addLayer(
        {
          id: id+'-ond-chirps',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+chirpsRasterOND+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        subnationalBoundaryLayer
      );
      map.setLayoutProperty(id+'-ond-chirps', 'visibility', 'none');
    }
  });
}

function loadIPCLayer(country) {
  console.log(country.data)
  map.addSource(`${country.iso}-ipc`, {
    type: 'geojson',
    data: country.data,
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
        0,
        '#FFF',
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
  }, subnationalMarkerLayer);


  map.addLayer({
    id: `${country.iso}-ipc-boundary-layer`,
    type: 'line',
    source: `${country.iso}-ipc`,
    paint: {
      'line-color': '#E0E0E0',
    }
  }, subnationalMarkerLayer);

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
    let content, location, p3Pop;

    //format content
    content = `<h2>${prop['area']}, ${prop['country']}</h2>`;
    let phase = transformIPC(prop['overall_phase_P']);

    //get adm2 data by area name
    location = admintwo_data.filter(function(c) {
      if (c['#adm2+name'].includes(prop['area'])) {
        return c;
      }
    });

    p3Pop = prop['p3_plus_P_population'];
    if (phase!='0') content += `${currentIndicator.name}: <div class="stat">${phase}</div>`;

    let tableArray = [{label: 'People Affected', indicator: '#affected+total'},
                      {label: 'People Targeted', indicator: '#targeted+total'},
                      {label: 'People Reached', indicator: '#reached+total'}];

    content += '<div class="table-display">';
    if (p3Pop!==undefined) {
      content += `<div class="table-row"><div>Population with Acute Food Insecurity:</div><div>${shortenNumFormat(p3Pop)}</div></div>`;
    }

    tableArray.forEach(function(row) {
      let value = (location[0]!=undefined) ? location[0][row.indicator] : 0;
      let shortVal = (value==0 || isNaN(value)) ? 'No Data' : shortenNumFormat(value);
      content += `<div class="table-row"><div>${row.label}:</div><div>${shortVal}</div></div>`;
    });
    content += '</div>';
    
    //set tooltip
    tooltip.setHTML(content);
    tooltip
      .addTo(map)
      .setLngLat(e.lngLat);
  });
}

function initAcledLayer() {
  let maxCount = d3.max(acledData, function(d) { return +d['#affected+killed']; });
  let dotScale = d3.scaleSqrt()
    .domain([1, maxCount])
    .range([4, 16]);

  //get unique event types
  let acledEvents = [...new Set(acledData.map(d => d['#event+type']))];
  
  //build expression for event dot circles
  let eventTypeColorScale = ['match', ['get', 'event_type']];
  for (const [index, event] of acledEvents.sort().entries()) {
    eventTypeColorScale.push(event);
    eventTypeColorScale.push(eventColorRange[index]);
  }
  eventTypeColorScale.push('#666');

  let events = [];
  for (let e of acledData) {
    events.push({
      'type': 'Feature',
      'properties': {
        'iso': e['#country+code'],
        'adm1': e['#adm1+name'],
        'adm3': e['#adm3+name'],
        'event_type': e['#event+type'],
        'date': e['#date+occurred'],
        'fatalities': e['#affected+killed'],
        'notes': e['#description'],
        'iconSize': dotScale(e['#affected+killed'])
      },
      'geometry': { 
        'type': 'Point', 
        'coordinates': e['#coords']
      } 
    })
  }
  let eventsGeoJson = {
    'type': 'FeatureCollection',
    'features': events
  };

  map.addSource('acled', {
    type: 'geojson',
    data: eventsGeoJson,
    generateId: true
  });

  //add acled layer per country
  globalCountryList.forEach(function(country) {
    let iso = country.code.toLowerCase();
    map.addLayer({
      id: `acled-dots-${iso}`,
      type: 'circle',
      source: 'acled',
      filter: ['==', 'iso', iso.toUpperCase()],
      paint: {
        'circle-color': eventTypeColorScale,
        'circle-stroke-color': eventTypeColorScale,
        'circle-opacity': 0.5,
        'circle-radius': ['get', 'iconSize'],
        'circle-stroke-width': 1,
      }
    }, baseLayer);
    map.setLayoutProperty(`acled-dots-${iso}`, 'visibility', 'none');

    //mouse events
    map.on('mouseenter', `acled-dots-${iso}`, onMouseEnter);
    map.on('mouseleave', `acled-dots-${iso}`, onMouseLeave);
    map.on('mousemove', `acled-dots-${iso}`, function(e) {
      map.getCanvas().style.cursor = 'pointer';
      let prop = e.features[0].properties;
      let date = new Date(prop.date);
      let content = `<span class='small'>${moment(date).format('MMM D, YYYY')}</span>`;
      content += `<h2>${prop.event_type}</h2>`;
      content += `<p>${prop.notes}</p>`;
      content += `<p>Fatalities: ${prop.fatalities}</p>`;
      tooltip.setHTML(content);
      tooltip
        .addTo(map)
        .setLngLat(e.lngLat);
    });
  });

  //var zipCodeFilter = ["==", ['get', 'ZipCode'], Number(zipcode_val)];
  //var boroughFilter = ['match', ['get', 'Borough'], borough_val, true, false];
  //var combinedFilter = ["all", zipCodeFilter, boroughFilter];
  //map.setFilter('parcels_fill', combinedFilter);
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
    var selected = $('.map-legend').find('input[data-layer="'+layer+'"]');
    if (layer.includes('chirps')) {
      $('.map-legend').find('input[id="rainfall"]').prop('checked', true);
      $('.nested').show();
    }
    selected.prop('checked', true);
    onLayerSelected(selected);
  }
  //deep link to tabbed view
  if (location.indexOf('?tab=')>-1) {
    let view = location.split('tab=')[1];
    let selectedTab = $(`.tab-menubar .tab-button[data-id="${view}"]`);
    selectedTab.click();
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
  //create tab events
  $('.tab-menubar .tab-button').on('click', function() {
    $('.tab-button').removeClass('active');
    $(this).addClass('active');
    if ($(this).data('id')=='chart-view') {
      $('#chart-view').show();
    }
    else {
      $('#chart-view').hide();
    }

    let location = ($(this).data('id')==undefined || $(this).data('id')=='map-view') ? window.location.pathname : window.location.pathname + '?tab=' + $(this).data('id');
    window.history.replaceState(null, null, location);
    vizTrack($(this).data('id'), currentIndicator.name);
  });

  //country dropdown select event
  d3.select('.country-select').on('change',function(e) {
    //reset tab view  
    let selectedTab = $(`.tab-menubar .tab-button[data-id="map-view"]`);
    selectedTab.click();

    currentCountry.code = d3.select('.country-select').node().value;
    currentCountry.name = d3.select('.country-select option:checked').text();
    vizTrack(`main ${currentCountry.code} view`, currentIndicator.name);

    if (isCountryView()) {
      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
    else {
      resetMap();
    }

    //update country specific sources
    updateCountrySource();
  });

  //ranking select event
  d3.selectAll('.ranking-select').on('change',function(e) {
    var selected = d3.select(this).node().value;
    if (selected!='') {
      updateRanking(selected);
      vizTrack(`chart view`, selected);
    }
  });

  //map legend radio events
  $('input[name="countryIndicators"]').click(function(){
    var selected = $(this);

    //show nested options for rainfall layer
    $('.nested').hide();
    if (selected.val() == 'rainfall-select') {
      selected.closest('.indicator').find('.nested label:nth-child(1) input').prop('checked', true);
      selected.closest('.indicator').find('.nested').show();
      selected = selected.closest('.indicator').find('.nested label:nth-child(1) input');
    }

    vizTrack(`main ${currentCountry.code} view`, selected.parent().text());
    onLayerSelected(selected);
  });

  //special rainfall layer select
  $('input[name="rainfallSelect"]').click(function(){
    var selected = $(this);
    vizTrack(`main ${currentCountry.code} view`, selected.parent().text());
    onLayerSelected(selected);
  });
}

function onLayerSelected(selected) {
  currentIndicator = {id: selected.val(), name: selected.parent().text()};
  selectLayer(selected);

  if (!isCountryView()) {
    updateCountryLayer();
  }
  else {
    var selectedFeatures = matchMapFeatures(currentCountry.code);
    selectCountry(selectedFeatures);
  }
}


function selectLayer(layer) {
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

  //append country code to url
  window.history.replaceState(null, null, window.location.pathname + '?c='+currentCountry.code);
}


function updateCountrySource() {
  let country = (!isCountryView()) ? 'regional' : (currentCountry.code).toLowerCase();
  $('.map-legend .indicator').each(function(layer) {
    let div = $(this).find('.source-container');
    let indicator = $(this).find('input').val() + '+' + country;
    updateSource(div, indicator);
  });

  //update source for rainfall layers
  updateSource($('.map-legend .rainfall-mam-source'), `#climate+rainfall+anomaly+marmay+${country}`);
  updateSource($('.map-legend .rainfall-ond-source'), `#climate+rainfall+anomaly+octdec+${country}`);
}

function zoomToRegion() {
  var offset = 100;
  let mapPadding = (isMobile) ?
    {
        top: 0,
        right: -100,
        left: -100,
        bottom: 0
    } :
    { 
      top: offset,
      right: offset,
      bottom: offset,
      left: $('.key-figure-panel').outerWidth(),
    };
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });
}

function resetMap() {
  //reset layers
  toggleIPCLayers(true);

  //reset map legends
  $('.legend-container').show();

  //reset download links
  $('.download-link').hide();
  $('.download-link.regional').show();

  //set default layer  
  var selected = $('.map-legend').find('input[data-layer="ipc_acute_food_insecurity_phase"]');
  selected.prop('checked', true);
  onLayerSelected(selected);

  //reset nested rainfall layers
  $('.nested').hide();

  //zoom to region
  zoomToRegion()
  map.once('moveend', initKeyFigures);

  //reset location
  window.history.replaceState(null, null, window.location.pathname);
}

function toggleIPCLayers(visible) {
  ipcData.forEach(function(country) {
    let vis = (visible && (!isCountryView() || currentCountry.code.toLowerCase()==country.iso)) ? 'visible' : 'none';
    map.setLayoutProperty(`${country.iso}-ipc-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-boundary-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-label-layer`, 'visibility', vis);
  });

  //turn subnational labels off and ipc bubbles on for ipc layer
  if (visible) {
    map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');
    map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');
    if (currentCountry.code=='KEN' || currentCountry.code=='SOM') $('.bubble-scale').hide();
    else $('.bubble-scale').show();
  }
  else {
    map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'none');
    $('.bubble-scale').hide();
  }
}

function toggleAcledLayer(visible) {
  globalCountryList.forEach(function(country) {
    let vis = (visible && (!isCountryView() || currentCountry.code.toLowerCase()==country.code.toLowerCase())) ? 'visible' : 'none';
    map.setLayoutProperty(`acled-dots-${country.code.toLowerCase()}`, 'visibility', vis);
  });
}
