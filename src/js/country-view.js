/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryLayer() {
  //color scale
  countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);

  //mouse events
  map.on('mouseenter', subnationalLayer, onMouseEnter);
  map.on('mouseleave', subnationalLayer, onMouseLeave);
  map.on('mousemove', subnationalLayer, function(e) {
    var f = map.queryRenderedFeatures(e.point)[0];
    if (f.properties.ADM_PCODE!=undefined && f.properties.ADM0_REF==currentCountry.name) {
      map.getCanvas().style.cursor = 'pointer';
      createCountryMapTooltip(f.properties.ADM_REF, f.properties.ADM_PCODE, e.point);
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
  map.setLayoutProperty(globalBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');

  $('.map-legend .indicator.country-only').show();

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
  var colorScale = getLegendScale();
  if (currentIndicator.id=='#affected+idps+ind' && currentCountry.code=='KEN') {
    $('.legend-container').hide();
  }
  else {
    $('.legend-container').show();
    updateMapLegend(colorScale);
  }

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM_PCODE']];
  var expressionOpacity = ['match', ['get', 'ADM_PCODE']];
  admintwo_data.forEach(function(d) {
    var color, boundaryColor, layerOpacity;
    if (d['#country+code']==currentCountry.code) {
      var val = d[currentIndicator.id];
      layerOpacity = 1;
      boundaryColor = '#D7D5D5';
      color = (val<0 || !isVal(val)) ? colorNoData : colorScale(val);

      //turn off choropleth for raster layers
      if (currentIndicator.id=='#climate+rainfall+anomaly') {
        boundaryColor = '#FFF';
        color = colorDefault;
      }
      if (currentIndicator.id=='#population') {
        color = colorDefault;
      }    
      if (currentIndicator.id=='#affected+food+ipc+phase+type') {
        boundaryColor = '#E0E0E0';
        color = '#FFF';
      }
    }
    else {
      color = colorDefault;
      boundaryColor = '#D7D5D5';
      layerOpacity = 0;
    }
    
    expression.push(d['#adm2+code'], color);
    expressionBoundary.push(d['#adm2+code'], boundaryColor);
    expressionOpacity.push(d['#adm2+code'], layerOpacity);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#D7D5D5');
  expressionOpacity.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', (currentIndicator.id=='#population' || currentIndicator.id=='#climate+rainfall+anomaly') ? 0 : 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-color', expressionBoundary);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionOpacity);

  //hide all rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();
    if (map.getLayer(id+'-popdensity'))
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');

    if (map.getLayer(id+'-chirps'))
      map.setLayoutProperty(id+'-chirps', 'visibility', 'none');
  });

  //set pop raster properties
  if (currentIndicator.id=='#population') {
    var id = currentCountry.code.toLowerCase();
    map.setLayoutProperty(id+'-popdensity', 'visibility', 'visible');
  }

  //set chirps raster properties
  if (currentIndicator.id=='#climate+rainfall+anomaly') {
    var id = currentCountry.code.toLowerCase();
    map.setLayoutProperty(id+'-chirps', 'visibility', 'visible');
  }

  //set ipc layer properties
  let isIPC = (currentIndicator.id=='#affected+food+ipc+phase+type') ? true : false;
  toggleIPCLayers(isIPC, currentCountry.code);
}

function getCountryIndicatorMax() {
  var max =  d3.max(admintwo_data, function(d) { 
    if (d['#country+code']==currentCountry.code) {
      return +d[currentIndicator.id]; 
    }
  });
  return max;
}


//mouse event/leave events
function onMouseEnter(e) {
  map.getCanvas().style.cursor = 'pointer';
  tooltip.addTo(map);
}
function onMouseLeave(e) {
  map.getCanvas().style.cursor = '';
  tooltip.remove();
}