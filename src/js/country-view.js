/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryLayer() {
  initKeyFigures();

  //create log scale for circle markers
  var maxIPC = d3.max(admintwo_data, function(d) { if (d['#country+code']=='ETH') return +d['#affected+food+ipc+p3plus+num']; })
  markerScale = d3.scaleSqrt()
    .domain([1, maxIPC])
    .range([2, (isMobile)? 8 : 15]);


  //color scale
  colorScale = getLegendScale();
  createMapLegend(colorScale);

  //color scale
  countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionLabelOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkers = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkerOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkerStrokeOpacity = ['match', ['get', 'ADM_PCODE']];
  admintwo_data.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    var labelOpacity = (val==undefined) ? 0 : 1;

    //ipc markers (dont show for SOM)
    var ipcVal = d['#affected+food+ipc+p3plus+num'];
    var markerSize = (!isVal(ipcVal) || d['#country+code']=='SOM' || d['#country+code']=='KEN') ? 0 : markerScale(ipcVal);
    var markerOpacity = markerSize==0 ? 0 : 0.5;
    var markerStrokeOpacity = markerSize==0 ? 0 : 1;

    //turn off choropleth for ipc layer
    if (currentIndicator.id=='#affected+food+ipc+p3plus+num') {
      color = '#FFF';
    }

    expression.push(d['#adm2+code'], color);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
    expressionMarkers.push(d['#adm2+code'], markerSize);
    expressionMarkerOpacity.push(d['#adm2+code'], markerOpacity);
    expressionMarkerStrokeOpacity.push(d['#adm2+code'], markerStrokeOpacity);
  });

  //default value for no data
  expression.push(colorDefault);
  expressionLabelOpacity.push(0);
  expressionMarkers.push(0);
  expressionMarkerOpacity.push(0);
  expressionMarkerStrokeOpacity.push(0);

  //set properties
  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-opacity', expressionMarkerOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-stroke-opacity', expressionMarkerStrokeOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-radius', expressionMarkers);


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
      if (val!==undefined && f.properties.ADM_PCODE!=undefined && (f.properties.ADM0_REF==currentCountry.name || !isCountryView()) && currentIndicator.id!=='#affected+food+ipc+p3plus+num') {
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

  //hide indicator footnotes as default
  $('.footnote-indicator').hide();
}



function updateCountryLayer() {
  //set map layers
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');

  //set download links
  if (currentCountry.code!='') {
    $('.download-link').hide();
    $(`.download-link.${currentCountry.code.toLowerCase()}`).show();
  }

  //update key figures
  initKeyFigures();

  //update log scale for circle markers
  var maxIPC = d3.max(admintwo_data, function(d) { if (d['#country+code']=='ETH') return +d['#affected+food+ipc+p3plus+num']; })
  markerScale.domain([2, maxIPC]);

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
  updateMapLegend(colorScale);

  //data join
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM_PCODE']];
  var expressionOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionLabelOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkers = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkerOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkerStrokeOpacity = ['match', ['get', 'ADM_PCODE']];
  admintwo_data.forEach(function(d) {
    var color, boundaryColor, layerOpacity, labelOpacity, markerSize;
    if (d['#country+code']==currentCountry.code || !isCountryView()) {
      var val = d[currentIndicator.id];
      layerOpacity = 1;
      labelOpacity = (val==undefined) ? 0 : 1;
      boundaryColor = '#E0E0E0';
      color = (val<0 || !isVal(val)) ? colorNoData : colorScale(val);
      
      //ipc markers 
      var ipcVal = d['#affected+food+ipc+p3plus+num'];
      markerSize = (!isVal(ipcVal) || d['#country+code']=='SOM' || d['#country+code']=='KEN') ? 0 : markerScale(ipcVal);
      var markerOpacity = markerSize==0 ? 0 : 0.5;
      var markerStrokeOpacity = markerSize==0 ? 0 : 1;

      //turn off choropleth for raster layers
      if ((currentIndicator.id).includes('#climate+rainfall+anomaly')) {
        color = colorDefault;
      }
      if (currentIndicator.id=='#population') {
        color = colorDefault;
      }    
      if (currentIndicator.id=='#affected+food+ipc+p3plus+num') {
        color = '#FFF';
      }
    }
    else {
      color = colorDefault;
      boundaryColor = '#E0E0E0';
      layerOpacity = 0;
      labelOpacity = 0;
      markerSize = 0;
      markerOpacity = 0;
      markerStrokeOpacity = 0;
    }
    
    expression.push(d['#adm2+code'], color);
    expressionBoundary.push(d['#adm2+code'], boundaryColor);
    expressionOpacity.push(d['#adm2+code'], layerOpacity);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
    expressionMarkers.push(d['#adm2+code'], markerSize);
    expressionMarkerOpacity.push(d['#adm2+code'], markerOpacity);
    expressionMarkerStrokeOpacity.push(d['#adm2+code'], markerStrokeOpacity);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);
  expressionLabelOpacity.push(0);
  expressionMarkers.push(0);
  expressionMarkerOpacity.push(0);
  expressionMarkerStrokeOpacity.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', (currentIndicator.id=='#population' || (currentIndicator.id).includes('#climate+rainfall+anomaly')) ? 0 : 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-color', expressionBoundary);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-opacity', expressionMarkerOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-stroke-opacity', expressionMarkerStrokeOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-radius', expressionMarkers);

  //toggle raster layers
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();

    //pop rasters
    var popVis = (currentIndicator.id=='#population' && (currentCountry.code.toLowerCase()==id || !isCountryView())) ? 'visible' : 'none';
    map.setLayoutProperty(id+'-popdensity', 'visibility', popVis);

    //rainfall rasters marmay
    var rainVisMAM = (currentIndicator.id=='#climate+rainfall+anomaly+marmay' && (currentCountry.code.toLowerCase()==id || !isCountryView())) ? 'visible' : 'none';
    map.setLayoutProperty(id+'-mam-chirps', 'visibility', rainVisMAM);

    //rainfall rasters octdec
    var rainVisOND = (currentIndicator.id=='#climate+rainfall+anomaly+octdec' && (currentCountry.code.toLowerCase()==id || !isCountryView())) ? 'visible' : 'none';
    map.setLayoutProperty(id+'-ond-chirps', 'visibility', rainVisOND);
  });

  //set ipc layer properties
  let isIPC = (currentIndicator.id=='#affected+food+ipc+p3plus+num') ? true : false;
  toggleIPCLayers(isIPC);

  //set acled layer properties
  let isAcled = (currentIndicator.id=='#date+latest+acled') ? true : false;
  toggleAcledLayer(isAcled);
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