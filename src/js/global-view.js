/****************************/
/*** GLOBAL MAP FUNCTIONS ***/
/****************************/
function handleGlobalEvents(layer) {
  map.on('mouseenter', globalLayer, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    tooltip.addTo(map);
  });

  map.on('mousemove', globalLayer, function(e) {
    var features = map.queryRenderedFeatures(e.point, { layers: [globalLayer] });
    var target;
    features.forEach(function(feature) {
      if (feature.sourceLayer==adm1SourceLayer)
        target = feature;
    });
    if (target!=undefined) {
      tooltip.setLngLat(e.lngLat);
      createMapTooltip(target.properties.ADM_PCODE, target.properties.ADM_REF, e.point);
    }
  });
     
  map.on('mouseleave', globalLayer, function() {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  });
}


function initGlobalLayer() {
  initKeyFigures();

  //color scale
  colorScale = getLegendScale();
  createMapLegend(colorScale);

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  adminone_data.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    expression.push(d['#adm1+code'], color);
  });

  //default value for no data
  expression.push(colorDefault);
  
  //set properties
  map.setPaintProperty(globalLayer, 'fill-color', expression);

  //define mouse events
  handleGlobalEvents();
}


function updateGlobalLayer() {
  //color scale
  colorScale = getLegendScale();
  updateMapLegend(colorScale)

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM_PCODE']];
  adminone_data.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    var boundaryColor = '#E0E0E0';

    //turn off choropleth for raster layers
    if (currentIndicator.id=='#population' || currentIndicator.id=='#climate+rainfall+anomaly') {
      color = colorDefault;
    }
    if (currentIndicator.id=='#climate+rainfall+anomaly') {
      boundaryColor = '#FFF';
    }

    expression.push(d['#adm1+code'], color);
    expressionBoundary.push(d['#adm1+code'], boundaryColor);
  });

  //default value for no data
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  
  //update map and legend
  map.setPaintProperty(globalLayer, 'fill-color', expression);
  map.setPaintProperty(globalBoundaryLayer, 'line-color', expressionBoundary);

  //toggle rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    if (currentCountry.code=='' || country_code==currentCountry.code) {
      var id = country_code.toLowerCase();
      if (map.getLayer(id+'-popdensity'))
        map.setLayoutProperty(id+'-popdensity', 'visibility', (currentIndicator.id=='#population') ? 'visible' : 'none');

      if (map.getLayer(id+'-chirps'))
        map.setLayoutProperty(id+'-chirps', 'visibility', (currentIndicator.id=='#climate+rainfall+anomaly') ? 'visible' : 'none');
    }
  });
}


function createMapLegend(scale) {
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //set data sources
  createSource($('.map-legend .ipc-source'), '#affected+food+ipc+phase+type+regional');
  createSource($('.map-legend .rainfall-source'), '#climate+rainfall+anomaly+regional');
  createSource($('.map-legend .priority-source'), '#priority+regional');
  createSource($('.map-legend .idp-source'), '#affected+idps+ind+regional');
  createSource($('.map-legend .population-source'), '#population+regional');

  var legend = d3.legendColor()
    .labelFormat(shortenNumFormat)
    .cells(colorRange.length)
    .scale(scale);

  var div = d3.select('.map-legend .legend-scale');
  var svg = div.append('svg')
    .attr('class', 'legend-container');

  svg.append('g')
    .attr('class', 'scale')
    .call(legend);

  //no data
  var nodata = div.append('svg')
    .attr('class', 'no-data-key');

  nodata.append('rect')
    .attr('width', 15)
    .attr('height', 15);

  nodata.append('text')
    .attr('class', 'label')
    .text('No Data');

  //boundaries disclaimer
  createFootnote('.map-legend', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

  //expand/collapse functionality
  $('.map-legend .toggle-icon, .map-legend .collapsed-title').on('click', function() {
    $(this).parent().toggleClass('collapsed');
    $('.legend-gradient').toggleClass('collapsed');
  });
}


function updateMapLegend(scale) {
  //hide no data key for rainfall layer
  if (currentIndicator.id=='#climate+rainfall+anomaly') $('.no-data-key').hide();
  else $('.no-data-key').show();

  //hide idp source for kenya
  if (currentCountry.code=='KEN') $('.idp-source').hide();
  else $('.idp-source').show();

  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //set class to current indicator
  var layerID = currentIndicator.id.replaceAll('+','-').replace('#','');
  $('.map-legend .legend-container').attr('class', 'legend-container '+ layerID);

  //update legend
  var legend = d3.legendColor()
    .labelFormat(shortenNumFormat)
    .cells(colorRange.length)
    .scale(scale);

  var g = d3.select('.map-legend .scale');
  g.call(legend);
}


function getLegendScale() {
  //get min/max
  let min, max;
  if (isCountryView()) {
    min =  d3.min(admintwo_data, function(d) { 
      if (d['#country+code']==currentCountry.code) {
        return +d[currentIndicator.id]; 
      }
    });
    max =  d3.max(admintwo_data, function(d) { 
      if (d['#country+code']==currentCountry.code) {
        return +d[currentIndicator.id]; 
      }
    });
  }
  else { //regional view
    min = d3.min(adminone_data, d => +d[currentIndicator.id]);
    max = d3.max(adminone_data, d => +d[currentIndicator.id]);
  }

  //set scale
  var scale;
  if (currentIndicator.id=='#climate+rainfall+anomaly') {
    scale = d3.scaleOrdinal().domain(['>300', '200 – 300', '100 – 200', '50 – 100', '25 – 50', '10 – 25', '-10 – -10', '-25 – -10', '-50 – -25', '-100 – -50', '-200 – -100', '-200 – -100', '<-300']).range(chirpsColorRange);
  }
  // else if (currentIndicator.id=='#affected+food+ipc+p3plus+num') {
  //   scale = d3.scaleOrdinal().domain(['1 – Minimal', '2 – Stressed', '3 – Crisis', '4 – Emergency', '5 – Famine']).range(ipcColorRange);
  // }
  else if (currentIndicator.id=='#priority') {
    scale = d3.scaleOrdinal().domain(['Low', 'Medium', 'High']).range(priorityColorRange);
  }
  else if (currentIndicator.id=='#population') {
    scale = d3.scaleOrdinal().domain(['<1', '1 – 2', '2 – 5', '5 – 10', '10 – 25', '25 – 50', '>50']).range(populationColorRange);
  }
  else {
    scale = d3.scaleQuantize().domain([0, max]).range(colorRange);
  }

  return scale;
}