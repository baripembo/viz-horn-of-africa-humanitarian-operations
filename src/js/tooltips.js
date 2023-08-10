/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
function createCountryMapTooltip(location) {
  var val = location[currentIndicator.id];
  var label = currentIndicator.name;

  console.log('----', location)

  //format content for tooltip
  let content = '';
  content = `<h2>${location['#adm2+name']}, ${location['#country+name']}</h2>`;

  if ('currentIndicator.id'=='#priority' || isNaN(val)) {
    let indicator;
    if (currentIndicator.id=='#priority') indicator = 'Operational Priority Level';
    else indicator = currentIndicator.name
    content += `${indicator}:<div class="stat">${val}</div>`;
  }
  else if ((currentIndicator.id).includes('#climate+rainfall+anomaly')){
    content += `${currentIndicator.name}:<div class="stat">${parseFloat(val).toFixed(2)}mm</div>`;
  }
  else if (currentIndicator.id=='#population' && location['#country+code']=='ETH') {
    //dont show population figures for ETH
  }
  else {
    content += `${currentIndicator.name}:<div class="stat">${shortenNumFormat(val)}</div>`;
  }

  //set up supporting key figures    
  var tableArray = [{label: 'Population', indicator: '#population'},
                    {label: 'People Affected', indicator: '#affected+total'},
                    {label: 'People Targeted', indicator: '#targeted+total'},
                    {label: 'People Reached', indicator: '#reached+total'}];

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
      if (row.indicator=='#affected+food+ipc+p3plus+num') shortVal = (value==undefined) ? 'No Data' : shortenNumFormat(value);
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