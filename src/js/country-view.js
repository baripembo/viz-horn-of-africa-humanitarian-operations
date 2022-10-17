/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryLayer() {
  initKeyFigures();

  //color scale
  colorScale = getLegendScale();
  createMapLegend(colorScale);

  //color scale
  countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionLabelOpacity = ['match', ['get', 'ADM_PCODE']];
  admintwo_data.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    var labelOpacity = (val==undefined) ? 0 : 1;

    //turn off choropleth for ipc layer
    if (currentIndicator.id=='#affected+food+ipc+phase+type') {
      color = '#FFF';
    }

    expression.push(d['#adm2+code'], color);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
  });

  //default value for no data
  expression.push(colorDefault);
  expressionLabelOpacity.push(0);
  
  //set properties
  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);


  //mouse events
  map.on('mouseenter', subnationalLayer, onMouseEnter);
  map.on('mouseleave', subnationalLayer, onMouseLeave);
  map.on('mousemove', subnationalLayer, function(e) {
    var f = map.queryRenderedFeatures(e.point)[0];
    var location = admintwo_data.filter(function(c) {
      if (c['#adm2+code']==f.properties.ADM_PCODE)
        return c;
    });

    if (location[0]!=undefined) {
      var val = location[0][currentIndicator.id];
      if (val!==undefined && f.properties.ADM_PCODE!=undefined && (f.properties.ADM0_REF==currentCountry.name || !isCountryView()) && currentIndicator.id!=='#affected+food+ipc+phase+type') {
        map.getCanvas().style.cursor = 'pointer';
        createCountryMapTooltip(location[0]);
        tooltip
          .addTo(map)
          .setLngLat(e.lngLat);
      }    
      else {
        onMouseLeave(e);
      }
    }
    else {
      onMouseLeave(e);
    }
  });    
}



function updateCountryLayer() {
  //set map layers
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');

  //reset disabled inputs
  disableInput('#affected+food+ipc+phase+type', false);
  disableInput('#affected+idps+ind', false);

  //disable empty layers
  if (currentCountry.code=='ETH') {
    disableInput('#affected+food+ipc+phase+type', true);
    if (currentIndicator.id=='#affected+food+ipc+phase+type') {
      //set fallback default layer  
      var selected = $('.map-legend').find('input[value="#climate+rainfall+anomaly"]');
      selected.prop('checked', true);
      onLayerSelected(selected);
    }
  }
  if (currentCountry.code=='KEN') {
    disableInput('#affected+idps+ind', true);
    if (currentIndicator.id=='#affected+idps+ind') {
      //set fallback default layer  
      var selected = $('.map-legend').find('input[value="#affected+food+ipc+phase+type"]');
      selected.prop('checked', true);
      onLayerSelected(selected);
    }
  }

  //set download links
  if (currentCountry.code!='') {
    $('.download-link').hide();
    $(`.download-link.${currentCountry.code.toLowerCase()}`).show();
  }

  //update key figures
  initKeyFigures();

  //color scale
  colorNoData = '#F9F9F9';
  var clrRange = colorRange;
  switch(currentIndicator.id) {
    case '#population':
      clrRange = populationColorRange;
      break;
    case '#affected+idps+ind':
      clrRange = idpColorRange;
      break;
    default:
      //
  }

  //update legend
  var colorScale = getLegendScale();
  if ((currentIndicator.id=='#affected+idps+ind' && currentCountry.code=='KEN') || (currentIndicator.id=='#affected+food+ipc+phase+type' && currentCountry.code=='ETH')) {
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
  var expressionLabelOpacity = ['match', ['get', 'ADM_PCODE']];
  admintwo_data.forEach(function(d) {
    var color, boundaryColor, layerOpacity, labelOpacity;
    if (d['#country+code']==currentCountry.code || !isCountryView()) {
      var val = d[currentIndicator.id];
      layerOpacity = 1;
      labelOpacity = (val==undefined) ? 0 : 1;
      boundaryColor = '#E0E0E0';
      color = (val<0 || !isVal(val)) ? colorNoData : colorScale(val);

      //turn off choropleth for raster layers
      if (currentIndicator.id=='#climate+rainfall+anomaly') {
        color = colorDefault;
      }
      if (currentIndicator.id=='#population') {
        color = colorDefault;
      }    
      if (currentIndicator.id=='#affected+food+ipc+phase+type') {
        color = '#FFF';
      }
    }
    else {
      color = colorDefault;
      boundaryColor = '#E0E0E0';
      layerOpacity = 0;
      labelOpacity = 0;
    }
    
    expression.push(d['#adm2+code'], color);
    expressionBoundary.push(d['#adm2+code'], boundaryColor);
    expressionOpacity.push(d['#adm2+code'], layerOpacity);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);
  expressionLabelOpacity.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', (currentIndicator.id=='#population' || currentIndicator.id=='#climate+rainfall+anomaly') ? 0 : 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-color', expressionBoundary);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);

  //toggle raster layers
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();

    //pop rasters
    var popVis = (currentIndicator.id=='#population' && (currentCountry.code.toLowerCase()==id || !isCountryView())) ? 'visible' : 'none';
    map.setLayoutProperty(id+'-popdensity', 'visibility', popVis);

    //rainfall rasters
    var rainVis = (currentIndicator.id=='#climate+rainfall+anomaly' && (currentCountry.code.toLowerCase()==id || !isCountryView())) ? 'visible' : 'none';
    map.setLayoutProperty(id+'-chirps', 'visibility', rainVis);
  });


  //set ipc layer properties
  let isIPC = (currentIndicator.id=='#affected+food+ipc+phase+type') ? true : false;
  toggleIPCLayers(isIPC);
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