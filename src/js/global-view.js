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
  var expressionBoundary = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = +d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    var boundaryColor = '#E0E0E0';

    //turn off choropleth for raster layers
    if (currentIndicator.id=='#population' || currentIndicator.id=='#chirps') {
      color = colorDefault;
      boundaryColor = '#FFF';
    }

    expression.push(d['#country+code'], color);
    expressionBoundary.push(d['#country+code'], boundaryColor);
  });

  //default value for no data
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  
  //update map and legend
  map.setPaintProperty(globalLayer, 'fill-color', expression);
  map.setPaintProperty(globalBoundaryLayer, 'line-color', expressionBoundary);
  updateMapLegend(colorScale);

  //toggle rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    if (currentCountry.code=='' || country_code==currentCountry.code) {
      var id = country_code.toLowerCase();
      if (map.getLayer(id+'-popdensity'))
        map.setLayoutProperty(id+'-popdensity', 'visibility', (currentIndicator.id=='#population') ? 'visible' : 'none');

      if (map.getLayer(id+'-chirps'))
        map.setLayoutProperty(id+'-chirps', 'visibility', (currentIndicator.id=='#chirps') ? 'visible' : 'none');
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
    case '#chirps':
      clrRange = chirpsColorRange;
      break;
    default:
      clrRange = colorRange;
  }

  //set scale
  var scale;
  if (currentIndicator.id=='#chirps') {
    scale = d3.scaleOrdinal().domain(['-750', '-400', '-150', '0', '150', '400', '750']).range(clrRange);
  }
  else {
    scale = d3.scaleQuantize().domain([0, max]).range(clrRange);
  }

  return scale;
  //return (max==undefined) ? null : scale;
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
