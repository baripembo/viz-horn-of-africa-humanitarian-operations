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
      createMapTooltip(target.properties.ISO_3, target.properties.Terr_Name, e.point);
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
  colorScale = getGlobalLegendScale();
  createMapLegend(colorScale);

  //data join
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    expression.push(d['#country+code'], color);
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
  colorScale = getGlobalLegendScale();

  //data join
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    expression.push(d['#country+code'], color);
  });

  //default value for no data
  expression.push(colorDefault);
  
  //update map and legend
  map.setPaintProperty(globalLayer, 'fill-color', expression);
  updateMapLegend(colorScale);

  //toggle pop density rasters
  var countryList = Object.keys(countryCodeList);
  let state = (currentIndicator.id=='#population') ? 'visible' : 'none';
  countryList.forEach(function(country_code) {
    if (currentCountry.code=='' || country_code==currentCountry.code) {
      var id = country_code.toLowerCase();
      if (map.getLayer(id+'-popdensity'))
        map.setLayoutProperty(id+'-popdensity', 'visibility', state);
    }
  });
}


function createMapLegend(scale) {
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //set data sources
  createSource($('.map-legend .ipc-source'), '#affected+food+ipc+p3plus+num');
  createSource($('.map-legend .population-source'), '#population');

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
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //update legend
  var legend = d3.legendColor()
    .labelFormat(shortenNumFormat)
    .cells(colorRange.length)
    .scale(scale);

  var g = d3.select('.map-legend .scale');
  g.call(legend);
}


function getGlobalLegendScale() {
  //get min/max
  var min = d3.min(nationalData, function(d) { 
    return +d[currentIndicator.id]; 
  });
  var max = d3.max(nationalData, function(d) { 
    return +d[currentIndicator.id];
  });

  //set color range
  var clrRange;
  switch(currentIndicator.id) {
    case '#population':
      clrRange = populationColorRange;
      break;
    default:
      clrRange = colorRange;
  }

  //set scale
  var scale = d3.scaleQuantize().domain([0, max]).range(clrRange);

  return (max==undefined) ? null : scale;
}

function setGlobalLegend(scale) {
  var div = d3.select('.map-legend');
  var svg;
  var indicator = currentIndicator.id;
  $('.map-legend .source-secondary').empty();

  //SETUP
  if ($('.map-legend .scale').empty()) {
    //current indicator
    createSource($('.map-legend .indicator-source'), indicator);
    svg = div.append('svg')
      .attr('class', 'legend-container');
    svg.append('g')
      .attr('class', 'scale');

    //expand/collapse functionality
    $('.map-legend .toggle-icon, .map-legend .collapsed-title').on('click', function() {
      $(this).parent().toggleClass('collapsed');
    });
  }
  else {
    updateSource($('.indicator-source'), indicator);
  }

  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //current indicator
  if (scale==null) {
    $('.map-legend .legend-container').hide();
  }
  else {
    $('.map-legend .legend-container').show();
    var layerID = currentIndicator.id.replaceAll('+','-').replace('#','');
    $('.map-legend .legend-container').attr('class', 'legend-container '+ layerID);

    var legendFormat = (currentIndicator.id.indexOf('pct')>-1 || currentIndicator.id.indexOf('ratio')>-1) ? d3.format('.0%') : shortenNumFormat;
    var legend = d3.legendColor()
      .labelFormat(legendFormat)
      .cells(colorRange.length)
      .scale(scale);
    var g = d3.select('.map-legend .scale');
    g.call(legend);
  }

  //no data
  var noDataKey = $('.map-legend .no-data-key');
  noDataKey.find('.label').text('No Data');
  noDataKey.find('rect').css('fill', '#FFF');
}
