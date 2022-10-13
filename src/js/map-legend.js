/****************************/
/*** LEGEND FUNCTIONS ***/
/****************************/
function createMapLegend(scale) {
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //set data sources
  createSource($('.map-legend .ipc-source'), '#affected+food+ipc+phase+type+regional');
  createSource($('.map-legend .ipc-phase-source'), '#affected+food+ipc+phase+type+regional');
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

  //rainfall disclaimer
  createFootnote('.map-legend', '#climate+rainfall+anomaly', 'The seasonal rainfall anomaly describes how the current season compares to the historical 1981-2010 average. It is updated every 5 days using cumulative CHIRPS rainfall data for the two main seasons (March-April-May and October-November-December)');

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

  //show/hide footnotes
  $('.footnote-indicator').hide();
  $('.footnote-indicator[data-indicator="'+ currentIndicator.id +'"]').show();
}


function getLegendScale() {
  //get min/max
  let min, max;
  let data = new Array(); //create copy of indicator data for quantile scales
  min =  d3.min(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code || currentCountry.code=='') {
      data.push(+d[currentIndicator.id]);
      return +d[currentIndicator.id]; 
    }
  });
  max =  d3.max(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code || currentCountry.code=='') {
      return +d[currentIndicator.id]; 
    }
  });

  //set scale
  var scale;
  if (currentIndicator.id=='#climate+rainfall+anomaly') {
    scale = d3.scaleOrdinal().domain(['>300', '200 – 300', '100 – 200', '50 – 100', '25 – 50', '10 – 25', '-10 – 10', '-25 – -10', '-50 – -25', '-100 – -50', '-200 – -100', '-200 – -100', '<-300']).range(chirpsColorRange);
  }
  else if (currentIndicator.id=='#affected+food+ipc+phase+type') {
    scale = d3.scaleOrdinal().domain(['1-Minimal', '2-Stressed', '3-Crisis', '4-Emergency', '5-Famine']).range(ipcPhaseColorRange);
  }
  else if (currentIndicator.id=='#priority') {
    scale = d3.scaleOrdinal().domain(['Priority 3', 'Priority 2', 'Priority 1']).range(priorityColorRange);
  }
  else if (currentIndicator.id=='#population') {
    scale = d3.scaleOrdinal().domain(['<1', '1 – 2', '2 – 5', '5 – 10', '10 – 25', '25 – 50', '>50']).range(populationColorRange);
  }
  else if (currentIndicator.id=='#affected+idps+ind') {
    scale = d3.scaleQuantile().domain(data).range(idpColorRange);
    scale.quantiles().map(x => Math.round(x));
  }
  else {
    scale = d3.scaleQuantize().domain([0, max]).range(colorRange);
  }

  return scale;
}