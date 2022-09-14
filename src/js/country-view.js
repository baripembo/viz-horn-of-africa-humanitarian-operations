/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryLayer() {
  //color scale
  countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);
  //createCountryLegend(countryColorScale);

  //mouse events
  map.on('mouseenter', subnationalLayer, onMouseEnter);
  map.on('mouseleave', subnationalLayer, onMouseLeave);
  map.on('mousemove', subnationalLayer, function(e) {
    var f = map.queryRenderedFeatures(e.point)[0];
    if (f.properties.ADM1_PCODE!=undefined && f.properties.ADM0_REF==currentCountry.name) {
      map.getCanvas().style.cursor = 'pointer';
      createCountryMapTooltip(f.properties.ADM1_REF, f.properties.ADM1_PCODE, e.point);
      tooltip
        .addTo(map)
        .setLngLat(e.lngLat);
    }
    else {
      map.getCanvas().style.cursor = '';
      tooltip.remove();
    }
  });    
}



function updateCountryLayer() {
  map.setLayoutProperty(globalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');

  //update key figures
  initKeyFigures();

  colorNoData = '#F9F9F9';

  //max
  var max = getCountryIndicatorMax();

  //color scale
  var clrRange = colorRange;
  switch(currentIndicator.id) {
    case '#population':
      clrRange = populationColorRange;
      break;
    default:
      //
  }

  //update legend
  var countryColorScale = d3.scaleQuantize().domain([0, max]).range(clrRange);
  updateMapLegend(countryColorScale);

  //data join
  var expression = ['match', ['get', 'ADM1_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM1_PCODE']];
  var expressionOpacity = ['match', ['get', 'ADM1_PCODE']];
  subnationalData.forEach(function(d) {
    var color, boundaryColor, layerOpacity;
    if (d['#country+code']==currentCountry.code) {
      var val = +d[currentIndicator.id];
      layerOpacity = 1;
      color = (val<0 || !isVal(val) || isNaN(val)) ? colorNoData : countryColorScale(val);

      //turn off choropleth for population layer
      if (currentIndicator.id=='#population') {
        color = colorDefault;
      }
    }
    else {
      color = colorDefault;
      // boundaryColor = '#E0E0E0';
      layerOpacity = 0;
    }
    
    expression.push(d['#adm1+code'], color);
    //expressionBoundary.push(d['#adm1+code'], boundaryColor);
    expressionOpacity.push(d['#adm1+code'], layerOpacity);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', (currentIndicator.id=='#population') ? 0 : 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionOpacity);

  //hide all pop density rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();
    if (map.getLayer(id+'-popdensity'))
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
  });

  //set properties
  if (currentIndicator.id=='#population') {
    var id = currentCountry.code.toLowerCase();
    map.setLayoutProperty(id+'-popdensity', 'visibility', 'visible');
  }


  //toggle layers
  // if (currentCountryIndicator.id=='#acled+events') {
  //   resetLayers();
  //   map.setLayoutProperty('acled-dots', 'visibility', 'visible');
  //   map.setLayoutProperty('border-crossings-layer', 'visibility', 'none');
  //   map.setLayoutProperty('hostilities-layer', 'visibility', 'none');
  // }
  // else if (currentCountryIndicator.id=='#affected+idps') {
  //   resetLayers();
  //   map.setLayoutProperty(countryLayer, 'visibility', 'none');
  //   map.setLayoutProperty('macro-regions', 'visibility', 'visible');
  // }
  // else {
  //   resetLayers();
  // }
}

function getCountryIndicatorMax() {
  var max =  d3.max(subnationalData, function(d) { 
    if (d['#country+code']==currentCountry.code) {
      return +d[currentIndicator.id]; 
    }
  });
  return max;
}


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