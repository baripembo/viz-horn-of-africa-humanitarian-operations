/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
function createMapTooltip(country_code, country_name, point) {
  var location = adminone_data.filter(c => c['#adm1+code'] == country_code);
  if (location[0]!=undefined) {
    var val = location[0][currentIndicator.id];

    //format content for tooltip
    if (!isVal(val)) {
      val = 'No Data';
    }

    //format content for display
    var content = `<h2>${country_name}, ${location[0]['#country+name']}</h2>`;

    if (currentIndicator.id=='#affected+food+ipc+p3plus+num') {
      let ipcVal = (val=='No Data') ? val : shortenNumFormat(val);
      content += `${currentIndicator.name}<div class="stat">${ipcVal}</div>`;
    }
    else if (currentIndicator.id=='#climate+rainfall+anomaly') {
      content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}mm</div>`;
    }
    else {
      content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}</div>`;
    }

    var tableArray = [{label: 'Population', indicator: '#population'},
                      {label: 'Population in IPC Phase 3+', indicator: '#affected+food+ipc+p3plus+num'},
                      {label: 'People Affected', indicator: '#affected+total'},
                      {label: 'People Targeted', indicator: '#targeted+total'},
                      {label: 'People Reached', indicator: '#reached+total'}];
    content += '<div class="table-display">';
    tableArray.forEach(function(row) {
      if (row.indicator!=currentIndicator.id) {
        let value = location[0][row.indicator];
        let shortVal = (value==0 || isNaN(value)) ? 'No Data' : shortenNumFormat(value);
        content += '<div class="table-row"><div>'+ row.label +':</div><div>'+ shortVal +'</div></div>';
      }
    });
    content += '</div>';

    //set content for tooltip
    tooltip.setHTML(content);

    setTooltipPosition(point);
  }
}


function createCountryMapTooltip(name, pcode, point) {
  var location = admintwo_data.filter(function(c) {
    if (c['#adm2+code']==pcode && c['#country+code']==currentCountry.code)
      return c;
  });

  if (location[0]!=undefined) {
    var val = location[0][currentIndicator.id];
    var label = currentIndicator.name;

    //format content for tooltip
    if (!isVal(val)) {
      val = 'No Data';
    }

    let content = '';
    content = `<h2>${name}</h2>`;

    if ('currentIndicator.id'=='#priority' || isNaN(val)) {
      let indicator;
      if (currentIndicator.id=='#priority') indicator = 'Operational Priority Level';
      else indicator = currentIndicator.name
      content += `${indicator}:<div class="stat">${val}</div>`;
    }
    else if (currentIndicator.id=='#climate+rainfall+anomaly'){
      content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}mm</div>`;
    }
    else {
      content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}</div>`;
    }

    
    var tableArray = [{label: 'Population', indicator: '#population'},
                      {label: 'Population in IPC Phase 3+', indicator: '#affected+food+ipc+p3plus+num'},
                      {label: 'People Affected', indicator: '#affected+total'},
                      {label: 'People Targeted', indicator: '#targeted+total'},
                      {label: 'People Reached', indicator: '#reached+total'}];

    //show ipc phase for KEN only
    if (currentCountry.code=='KEN') {
      tableArray.splice(2, 0, {label: 'IPC Acute Food Insecurity Phase', indicator: '#affected+food+ipc+phase+type'});
    }

    content += '<div class="table-display">';
    tableArray.forEach(function(row) {
      if (row.indicator!=currentIndicator.id) {
        let value = location[0][row.indicator];
        let shortVal = (value==0 || isNaN(value)) ? 'No Data' : shortenNumFormat(value);
        if (row.indicator=='#affected+food+ipc+phase+type') shortVal = (value==undefined) ? 'No Data' : value;
        content += `<div class="table-row"><div>${row.label}:</div><div>${shortVal}</div></div>`;
      }
    });
    content += '</div>';

    tooltip.setHTML(content);
  }
}


function setTooltipPosition(point) {
  var tooltipWidth = $('.map-tooltip').width();
  var tooltipHeight = $('.map-tooltip').height();
  var anchorDirection = (point.x + tooltipWidth > viewportWidth) ? 'right' : 'left';
  var yOffset = 0;
  if (point.y + tooltipHeight/2 > viewportHeight) yOffset = viewportHeight - (point.y + tooltipHeight/2);
  if (point.y - tooltipHeight/2 < 0) yOffset = tooltipHeight/2 - point.y;
  var popupOffsets = {
    'right': [0, yOffset],
    'left': [0, yOffset]
  };
  tooltip.options.offset = popupOffsets;
  tooltip.options.anchor = anchorDirection;

  if (yOffset>0) {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-start');
    $('.mapboxgl-popup-tip').css('margin-top', point.y);
  }
  else if (yOffset<0)  {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-end');
    $('.mapboxgl-popup-tip').css('margin-bottom', viewportHeight-point.y-10);
  }
  else {
    $('.mapboxgl-popup-tip').css('align-self', 'center');
    $('.mapboxgl-popup-tip').css('margin-top', 0);
    $('.mapboxgl-popup-tip').css('margin-bottom', 0);
  }
}