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
  createSource($('.map-legend .rainfall-mam-source'), '#climate+rainfall+anomaly+marmay+regional');
  createSource($('.map-legend .rainfall-ond-source'), '#climate+rainfall+anomaly+octdec+regional');
  createSource($('.map-legend .priority-source'), '#priority+regional');
  createSource($('.map-legend .idp-source'), '#affected+idps+ind+regional');
  createSource($('.map-legend .population-source'), '#population+regional');
  createSource($('.map-legend .acled-source'), '#date+latest+acled+regional');

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

  //bubble scale
  var bubbleLegend = d3.select('.map-legend .bubble-scale');
  $('.bubble-scale').append('<h4>Population with Acute Food Insecurity</h4>');
  createSource($('.bubble-scale'), '#affected+food+ipc+p3plus+num+regional');

  var markersvg = bubbleLegend.append('svg')
    .attr('height', '55px')
    .attr('class', 'ipcScale');
  markersvg.append('g')
    .attr("transform", "translate(5, 10)")
    .attr('class', 'legendSize');

  var legendSize = d3.legendSize()
    .scale(markerScale)
    .shape('circle')
    .shapePadding(40)
    .labelFormat(numFormat)
    .labelOffset(15)
    .cells(2)
    .orient('horizontal');

  markersvg.select('.legendSize')
    .call(legendSize);

  //rainfall disclaimer
  createFootnote('.map-legend', '#climate+rainfall+anomaly+marmay', 'The seasonal rainfall anomaly describes how the current season compares to the historical 1981-2010 average. It is updated every 5 days using cumulative CHIRPS rainfall data for the March-April-May season');
  createFootnote('.map-legend', '#climate+rainfall+anomaly+octdec', 'The seasonal rainfall anomaly describes how the current season compares to the historical 1981-2010 average. It is updated every 5 days using cumulative CHIRPS rainfall data for the October-November-December season)');

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

  //set class to current indicator
  var layerID = currentIndicator.id.replaceAll('+','-').replace('#','');
  $('.map-legend .legend-container').attr('class', 'legend-container '+ layerID);


  //update legend
  if (currentIndicator.id=='#date+latest+acled') {
    if (d3.selectAll('.legendCells-events').empty()) {
      var svg = d3.select('.map-legend .scale');
      svg.append("g")
        .attr("class", "legendCells-events")
        .attr("transform", "translate(6,10)");

      var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(90)())
        .shapePadding(3)
        .scale(scale);

      svg.select(".legendCells-events")
        .call(legendOrdinal);
    }
  }
  else {
    var legend = d3.legendColor()
      .labelFormat(shortenNumFormat)
      .cells(colorRange.length)
      .scale(scale);

    var g = d3.select('.map-legend .scale');
    g.call(legend);
  }

  //bubble scale
  var maxIPC = d3.max(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code || currentCountry.code=='Regional' && d['#country+code']!='SOM' && d['#country+code']!='KEN') {
      return +d['#affected+food+ipc+p3plus+num'];
    } 
  })
  markerScale.domain([2, maxIPC]);
  d3.select('.ipcScale .cell:nth-child(2) .label').text(numFormat(maxIPC));
  updateSource($('.bubble-scale'), '#affected+food+ipc+p3plus+num+'+currentCountry.code.toLowerCase());

  //hide no data key for rainfall layer
  if ((currentIndicator.id).includes('#climate+rainfall+anomaly') || currentIndicator.id=='#date+latest+acled') $('.no-data-key').hide();
  else $('.no-data-key').show();

  //show/hide footnotes
  $('.footnote-indicator').hide();
  $('.footnote-indicator[data-indicator="'+ currentIndicator.id +'"]').show();
}


function getLegendScale() {
  //get min/max
  let min, max;
  let data = new Array(); //create copy of indicator data for quantile scales
  min =  d3.min(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code || !isCountryView()) {
      //if (isNaN(+d[currentIndicator.id])) d[currentIndicator.id] = 0;
      data.push(+d[currentIndicator.id]);
      return +d[currentIndicator.id]; 
    }
  });
  max =  d3.max(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code || !isCountryView()) {
      return +d[currentIndicator.id]; 
    }
  });

  //set scale
  $('.map-legend').removeClass('acled');
  var scale;
  if ((currentIndicator.id).includes('#climate+rainfall+anomaly')) {
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
    if (currentCountry.code=='KEN') scale = d3.scaleQuantize().domain([0, max]).range(idpColorRange);
  }
  else if (currentIndicator.id=='#date+latest+acled') {
    $('.map-legend').addClass('acled');
    scale = d3.scaleOrdinal()
      .domain(['Battles', 'Explosions/Remote violence', 'Riots', 'Violence against civilians'])
      .range(eventColorRange);
  }
  else {
    scale = d3.scaleQuantize().domain([0, max]).range(colorRange);
  }

  return scale;
}