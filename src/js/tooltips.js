/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
function createMapTooltip(p_code, p_name, point) {
  var location = adminone_data.filter(c => c['#adm1+code'] == p_code);
  if (location[0]!=undefined && currentIndicator.id!=='#affected+food+ipc+phase+type') {
    var val = location[0][currentIndicator.id];

    //format content for tooltip
    if (!isVal(val)) {
      val = 'No Data';
    }

    //format content for display
    var content = `<h2>${p_name}, ${location[0]['#country+name']}</h2>`;

    if (currentIndicator.id=='#population' && location[0]['#country+name']=='Ethiopia') {
      //dont show population figures for ETH
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
                      {label: 'People Targeted', indicator: '#targeted+total'}];//{label: 'People Reached', indicator: '#reached+total'}

    //remove population figures for ETH only
    if (location[0]['#country+name']=='Ethiopia') {
      tableArray.splice(0, 1);
    }

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

    //setTooltipPosition(point);
  }
}


function createCountryMapTooltip(name, location, point) {
  var val = location[currentIndicator.id];
  var label = currentIndicator.name;

  //format content for tooltip
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
  else if (currentIndicator.id=='#population' && currentCountry.code=='ETH') {
    //dont show population figures for ETH
  }
  else {
    content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}</div>`;
  }

  //set up supporting key figures    
  var tableArray = [{label: 'Population', indicator: '#population'},
                    {label: 'People Affected', indicator: '#affected+total'},
                    {label: 'People Targeted', indicator: '#targeted+total'}];//{label: 'People Reached', indicator: '#reached+total'}

  //show ipc pop for countries except for SOM
  if (currentCountry.code=='KEN') {
    tableArray.splice(1, 0, {label: 'Population in IPC Phase 3+', indicator: '#affected+food+ipc+p3plus+num'});
  }

  //remove population figures for ETH only
  if (currentCountry.code=='ETH') {
    tableArray.splice(0, 1);
  }

  content += '<div class="table-display">';
  tableArray.forEach(function(row) {
    if (row.indicator!=currentIndicator.id) {
      let value = location[row.indicator];
      let shortVal = (value==0 || isNaN(value)) ? 'No Data' : shortenNumFormat(value);
      if (row.indicator=='#affected+food+ipc+phase+type') shortVal = (value==undefined) ? 'No Data' : value;
      content += `<div class="table-row"><div>${row.label}:</div><div>${shortVal}</div></div>`;
    }
  });
  content += '</div>';

  tooltip.setHTML(content);
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