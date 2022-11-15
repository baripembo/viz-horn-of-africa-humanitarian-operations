window.$ = window.jQuery = require('jquery');
var bbox = require('@turf/bbox');
var turfHelpers = require('@turf/helpers');
/******************/
/*** SPARKLINES ***/
/******************/
function createSparkline(data, div, size) {
  var width = (isMobile) ? 30 : 60;
  var height = 20;
  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);
  var parseDate = d3.timeParse("%Y-%m-%d");
  var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); })
    .curve(d3.curveBasis);

  data.forEach(function(d) {
    d.date = parseDate(d.date);
    d.value = +d.value;
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain(d3.extent(data, function(d) { return d.value; }));

  var svg = d3.select(div)
    .append('svg')
    .attr('class', 'sparkline')
    .attr('width', width)
    .attr('height', height+5)
    .append('g')
      .attr('transform', 'translate(0,4)');
    
  svg.append('path')
   .datum(data)
   .attr('class', 'sparkline')
   .attr('d', line);
}

/****************************************/
/*** RANKING CHART FUNCTIONS ***/
/****************************************/
function initRanking(data, div) {
  let formattedData = formatRankingData(data);
  $('.ranking-title').html(`<h6>Top Ten Donors in All Countries (USD)</h6>`);
  createRanking(formattedData, div);
}

function formatRankingData(data) {
  let donors = d3.nest()
    .key(function(d) { return d['#org+name+funder']; })
    .rollup(function(leaves) { return d3.sum(leaves, function(d) {
      return d['#value+funding+total+usd']
    })})
    .entries(data);
  donors.sort((a, b) => (a.value < b.value) ? 1 : -1);

  //format for c3
  let num = 10;
  let donorsArray = donors.slice(0, num).map((d) => d.key);
  donorsArray.unshift('x');

  let valueArray = donors.slice(0, num).map((d) => d.value);
  valueArray.unshift('values');

  return {donors: donorsArray, values: valueArray};
}


function createRanking(data, div) {
  const chartWidth = (isMobile) ? viewportWidth - 40 : viewportWidth - $('.key-figure-panel').width() - 100;
  const chartHeight = 400;
  let colorArray = ['#F8B1AD'];
  let valMax = data.values.slice(1, data.values.length);
  let yMax = d3.max(valMax);

  var chart = c3.generate({
    size: {
      width: chartWidth,
      height: chartHeight
    },
    padding: {
      bottom: 0,
      top: 10,
      left: (isMobile) ? 130 : 300,
      right: (isMobile) ? 0 : 200
    },
    bindto: div,
    data: {
      x: 'x',
      columns: [
        data.donors,
        data.values
      ],
      types: {
        values: 'bar'
      },
      labels: {
        format: {
          values: function (v) { return formatValue(v); }
        }
      }
    },
    color: {
      pattern: colorArray
    },
    axis: {
      x: {
        type: 'category',
        tick: {
          outer: false,
          multiline: true,
          multilineMax: 2,
          width: (isMobile) ? 100 : 225
        }
      },
      y: {
        show: isMobile ? false : true,
        max: yMax,
        padding: {top: isMobile ? 60 : 40},
        tick: {
          format: function(d) {
            return formatValue(d);
          }
        }
      },
      rotated: true
    },
    legend: {
      show: false
    },
    grid: {
      y: {
        show: isMobile ? false : true
      }
    },
    point: { show: false },
    tooltip: {
      show: false
    },
    transition: { duration: 500 }
  });

  //adjust placement of bar labels
  d3.select('.c3-text').attr('dy', '0.3em')

  rankingChart = chart;
  createSource($('#chart-view .source-container'), '#value+funding+total+usd+regional');
}


function updateRanking(selected) {
  let filteredData = (selected!='Regional') ? donorData.filter((d) => d['#country+code'] == selected) : donorData;
  let data = formatRankingData(filteredData);
  let countryName = (selected!='Regional') ? globalCountryList.filter((d) => d.code == selected)[0].name : 'All Countries';
  $('.ranking-title').html(`<h6>Top Ten Donors in ${countryName} (USD)</h6>`);

  rankingChart.load({
    columns: [
      data.donors,
      data.values
    ]
  });
}


/****************************************/
/*** TIMESERIES CHART FUNCTIONS ***/
/****************************************/
// function initTimeseries(data, div) {
//   let formattedData = formatData(data);
//   $('.trendseries-title').html('<h6>Total Number of Conflict Events</h6><div class="num">'+numFormat(data.length)+'</div>');
//   createTimeSeries(formattedData, div);
// }

// let eventsArray;
// function formatData(data) {
//   let events = d3.nest()
//     .key(function(d) { return d['#event+type']; })
//     .key(function(d) { return d['#date+occurred']; })
//     .rollup(function(leaves) { return leaves.length; })
//     .entries(data);
//   events.sort((a, b) => (a.key > b.key) ? 1 : -1);

//   let dates = [... new Set(acledData.map((d) => d['#date+occurred']))];
//   let totals = [];

//   eventsArray = [];
//   events.forEach(function(event) {
//     let array = [];
//     dates.forEach(function(date, index) {
//       let val = 0;
//       event.values.forEach(function(e) {
//         if (e.key==date)
//           val = e.value;
//       });
//       totals[index] = (totals[index]==undefined) ? val : totals[index]+val; //save aggregate of all events per day
//       array.push(val); //save each event per day
//     });
//     array.reverse();
//     array.unshift(event.key);
//     eventsArray.push(array);
//   });

//   //format for c3
//   dates.unshift('x');
//   totals.unshift('All');
//   return {series: [dates, totals], events: eventsArray};
// }


// function createTimeSeries(data, div) {
//   const chartWidth = viewportWidth - $('.key-figure-panel').width() - 100;
//   const chartHeight = 280;
//   let colorArray = ['#F8B1AD'];

//   var chart = c3.generate({
//     size: {
//       width: chartWidth,
//       height: chartHeight
//     },
//     padding: {
//       bottom: (isMobile) ? 60 : 0,
//       top: 10,
//       left: (isMobile) ? 30 : 35,
//       right: (isMobile) ? 200 : 200
//     },
//     bindto: div,
//     data: {
//       x: 'x',
//       columns: data.series,
//       type: 'bar'
//     },
//     bar: {
//         width: {
//             ratio: 0.5
//         }
//     },
//     color: {
//       pattern: colorArray
//     },
//     point: { show: false },
//     grid: {
//       y: {
//         show: true
//       }
//     },
//     axis: {
//       x: {
//         type: 'timeseries',
//         tick: { 
//           outer: false
//         }
//       },
//       y: {
//         min: 0,
//         padding: { 
//           top: (isMobile) ? 20 : 50, 
//           bottom: 0 
//         },
//         tick: { 
//           outer: false,
//           //format: d3.format('d')
//           format: function(d) {
//             if (Math.floor(d) != d){
//               return;
//             }
//             return d;
//           }
//         }
//       }
//     },
//     legend: {
//       show: false
//     },
//     transition: { duration: 500 },
//     tooltip: {
//       contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
//         let events = eventsArray;
//         let id = d[0].index + 1;
//         let date = new Date(d[0].x);
//         let total = 0;
//         let html = `<table><thead><tr><th colspan="2">${moment(date).format('MMM D, YYYY')}</th></tr><thead>`;
//         for (var i=0; i<=events.length-1; i++) {
//           if (events[i][id]>0) {
//             html += `<tr><td>${events[i][0]}</td><td>${events[i][id]}</td></tr>`;
//             total += events[i][id];
//           }
//         };
//         html += `<tr><td><b>Total</b></td><td><b>${total}</b></td></tr></table>`;
//         return html;
//       }
//     }
//   });

//   countryTimeseriesChart = chart;
//   createSource($('#chart-view .source-container'), '#date+latest+acled');
// }


// function updateTimeseries(selected) {
//   let filteredData = (selected!='All') ? acledData.filter((d) => d['#adm1+code'] == selected) : acledData;
//   let data = formatData(filteredData);
//   eventsArray = data.events;
//   $('.trendseries-title').find('.num').html(numFormat(filteredData.length));

//   if (filteredData.length<=0)
//     $('.trendseries-chart').hide();
//   else 
//     $('.trendseries-chart').show();

//   countryTimeseriesChart.load({
//     columns: data.series
//   });
// }


/***************************/
/*** PIE CHART FUNCTIONS ***/
/***************************/
function createPieChart(data, div) {
  let requirement = data[0];
  let funded = data[1];
  let fundedPercent = funded/requirement;

  let width = (isMobile) ? 25 : 30
      height = width
      margin = 1

  let radius = Math.min(width, height)/2 - margin

  let svg = d3.select(div)
    .append('svg')
      .attr('class', 'pie-chart')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

  let dataArray = {a: fundedPercent, b: 1-fundedPercent};

  let color = d3.scaleOrdinal()
    .domain(data)
    .range(['#418FDE', '#DFDFDF'])

  let pie = d3.pie()
    .value(function(d) { return d.value; }).sort(null);
  let formatData = pie(d3.entries(dataArray));

  svg
    .selectAll('g')
    .data(formatData)
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
    )
    .attr('fill', function(d){ return( color(d.data.key)) })
    .style('stroke-width', 0)
}



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
  admintwo_data.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    var labelOpacity = (val==undefined) ? 0 : 1;

    //ipc markers (dont show for SOM)
    var ipcVal = d['#affected+food+ipc+p3plus+num'];
    var markerSize = (!isVal(ipcVal) || d['#country+code']=='SOM' || d['#country+code']=='KEN') ? 0 : markerScale(ipcVal);

    //turn off choropleth for ipc layer
    if (currentIndicator.id=='#affected+food+ipc+phase+type') {
      color = '#FFF';
    }

    expression.push(d['#adm2+code'], color);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
    expressionMarkers.push(d['#adm2+code'], markerSize);
  });

  //default value for no data
  expression.push(colorDefault);
  expressionLabelOpacity.push(0);
  expressionMarkers.push(0);
  
  //set properties
  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-opacity', expressionLabelOpacity==0 ? 0 : 0.5);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-stroke-opacity', expressionLabelOpacity==0 ? 0 : 1);
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

  //hide indicator footnotes as default
  $('.footnote-indicator').hide();
}



function updateCountryLayer() {
  //set map layers
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');

  //reset disabled inputs
  //disableInput('#affected+food+ipc+phase+type', false);
  disableInput('#affected+idps+ind', false);

  //disable empty layers
  // if (currentCountry.code=='ETH') {
  //   disableInput('#affected+food+ipc+phase+type', true);
  //   if (currentIndicator.id=='#affected+food+ipc+phase+type') {
  //     //set fallback default layer  
  //     var selected = $('.map-legend').find('input[value="#climate+rainfall+anomaly"]');
  //     selected.prop('checked', true);
  //     onLayerSelected(selected);
  //   }
  // }
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
  var expressionLabelOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkers = ['match', ['get', 'ADM_PCODE']];
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
      markerSize = 0;
    }
    
    expression.push(d['#adm2+code'], color);
    expressionBoundary.push(d['#adm2+code'], boundaryColor);
    expressionOpacity.push(d['#adm2+code'], layerOpacity);
    expressionLabelOpacity.push(d['#adm2+code'], labelOpacity);
    expressionMarkers.push(d['#adm2+code'], markerSize);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);
  expressionLabelOpacity.push(0);
  expressionMarkers.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', (currentIndicator.id=='#population' || currentIndicator.id=='#climate+rainfall+anomaly') ? 0 : 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-color', expressionBoundary);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionLabelOpacity);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-radius', expressionMarkers);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-opacity', expressionLabelOpacity==0 ? 0 : 0.5);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-stroke-opacity', expressionLabelOpacity==0 ? 0 : 1);

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
function vizTrack(view, content) {
  mpTrack(view, content);
  gaTrack('viz interaction hdx', 'switch viz', 'horn of africa data explorer', content);
}

function mpTrack(view, content) {
  //mixpanel event
  mixpanel.track('viz interaction', {
    'page title': document.title,
    'embedded in': window.location.href,
    'action': 'switch viz',
    'viz type': 'horn of africa data explorer',
    'current view': view,
    'content': content
  });
}

function gaTrack(eventCategory, eventAction, eventLabel) {
  //google tag manager event
  dataLayer.push({
    'event': eventCategory,
    'label': eventAction,
    'type': eventLabel
  });
}


function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}

function formatValue(val, type) {
  let format;
  switch(type) {
    case 'percent':
      format = percentFormat;
      break;
    case 'short':
      format = d3.format('.3s');
      break;
    default:
      format = d3.formatPrefix('$.1f', val);//d3.format('$.3s');
  }
  let value;
  if (!isVal(val)) {
    value = 'NA';
  }
  else {
    value = (isNaN(val) || val==0) ? val : format(val).replace(/G/, 'B');
  }
  return value;
}


function formatDateRange(d) {
  let date = d.split('-');
  date = `${dateFormat(new Date(date[0]))}-${dateFormat(new Date(date[1]))}`;
  return date;
}


function roundUp(x, limit) {
  return Math.ceil(x/limit)*limit;
}


function isVal(value) {
  return (value===undefined || value===null || value==='') ? false : true;
}

function randomNumber(min, max) { 
  return Math.random() * (max - min) + min;
}

function createFootnote(target, indicator, text) {
  var indicatorName = (indicator==undefined) ? '' : indicator;
  var className = (indicatorName=='') ? 'footnote' : 'footnote footnote-indicator';
  var footnote = $(`<p class='${className}' data-indicator='${indicatorName}'>${truncateString(text, 65)}<a href='#' class='expand'>MORE</a></p>`);
  $(target).append(footnote);
  footnote.click(function() {
    if ($(this).find('a').hasClass('collapse')) {
      $(this).html(`${truncateString(text, 65)}<a href='#' class='expand'>MORE</a>`);
    }
    else {
      $(this).html(`${text}<a href='#' class='collapse'>LESS</a>`);
    }
  });
}

function isCountryView() {
  return currentCountry.code=='Regional' ? false : true;
}

function transformIPC(value) {
  let phase;
  switch(+value) {
    case 1:
      phase = '1-Minimal';
      break;
    case 2:
      phase = '2-Stressed';
      break;
    case 3:
      phase = '3-Crisis';
      break;
    case 4:
      phase = '4-Emergency';
      break;
    case 5:
      phase = '5-Famine';
      break;
    default:
      phase = value;
  }
  return phase;
}

function disableInput(indicator, isDisabled) {
  let clr = (isDisabled) ? '#BBB' : '#000';
  $(`input[value="${indicator}"]`).attr('disabled', isDisabled);
  $(`input[value="${indicator}"]`).parent().css('color', clr);
}

//country codes and raster ids
const countryCodeList = {
  ETH: {pop: '1jx1mpm4', chirps: '9f35wnzq'},
  KEN: {pop: '1iwk6136', chirps: '0zdu5z45'},
  SOM: {pop: 'd0xh6ux7', chirps: '1bl7k2zs'}
};


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
  if (currentIndicator.id=='#climate+rainfall+anomaly' || currentIndicator.id=='#date+latest+acled') $('.no-data-key').hide();
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
var map, mapFeatures, baseLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, subnationalMarkerLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'hornafrica_polbnda_subnationa-2rkvd2';
var hoveredStateId = null;


let ipcData = [
  {
    iso: 'eth',
    data: 'eth_food_security.geojson'
    //data: 'Ethiopia_May_2021_merged.geojson'
  },
  {
    iso: 'ken',
    data: 'kenya_ipc.geojson'
  },
  {
    iso: 'som',
    data: 'Somalia_Aug2022_Map_projected.geojson'
  }
];


function initMap() {
  console.log('Loading map...')
  map = new mapboxgl.Map({
    container: 'global-map',
    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
    center: [37, 6],
    minZoom: minZoom,
    zoom: zoomLevel,
    attributionControl: false
  });

  map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
     .addControl(new mapboxgl.AttributionControl(), 'bottom-right');

  map.on('load', function() {
    console.log('Map loaded')
    
    mapLoaded = true;
    if (dataLoaded==true) displayMap();
  });
}

function displayMap() {
  console.log('Display map');

  //remove loader and show vis
  $('.loader, #static-map').remove();
  $('#global-map, .map-legend').css('opacity', 1);

  //set initial indicator
  currentIndicator = {
    id: $('input[name="countryIndicators"]:checked').val(), 
    name: $('input[name="countryIndicators"]:checked').parent().text()
  };

  //get bottommost layer from basemap
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.id==='Dashed bnd 1m') {
      baseLayer = layer.id;
    }
    if (layer.id.startsWith('Countries')) {
      map.setLayoutProperty(layer.id, 'text-allow-overlap', true);
    }
  }

  //add map layers

  //water bodies
  map.addSource('waterbodies', {
    'url': 'mapbox://humdata.bo7vgo3j',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'waterbodies-layer',
    'type': 'fill',
    'source': 'waterbodies',
    'source-layer': 'hornafrica_waterbodies-8qylz8',
    'paint': {
      'fill-color': '#99daea'
    }
  }, baseLayer);
  waterLayer = 'waterbodies-layer';
  map.setLayoutProperty(waterLayer, 'visibility', 'visible');

  //fills source
  let subnationalSource = 'hornafrica_polbnda_subnationa-2rkvd2';
  let subnationalCentroidSource = 'hornafrica_polbndp_subnationa-a7lq5r';
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.8j9ay0ba',
    'type': 'vector'
  });

  //fills
  map.addLayer({
    'id': 'subnational-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalSource,
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1,
    }
  }, baseLayer);
  subnationalLayer = 'subnational-fills';
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');

  //boundaries
  map.addLayer({
    'id': 'subnational-boundaries',
    'type': 'line',
    'source': 'country-polygons',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalSource,
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, baseLayer);
  subnationalBoundaryLayer = 'subnational-boundaries';
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');

  //centroids source
  map.addSource('country-centroids', {
    'url': 'mapbox://humdata.cywtvjt9',
    'type': 'vector'
  });

  //centroids
  map.addLayer({
    'id': 'subnational-labels',
    'type': 'symbol',
    'source': 'country-centroids',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalCentroidSource,
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-padding': 8
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);
  subnationalLabelLayer = 'subnational-labels';
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');

  //markers
  map.addLayer({
    'id': 'subnational-markers',
    'type': 'circle',
    'source': 'country-centroids',
    'filter': ['==', 'ADM_LEVEL', 2],
    'source-layer': subnationalCentroidSource,
    'paint': {
      'circle-color': '#999',
      'circle-opacity': 0.5,
      'circle-stroke-color': '#999',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 1
    }
  }, baseLayer);
  subnationalMarkerLayer = 'subnational-markers';
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');



  mapFeatures = map.queryRenderedFeatures();

  //load raster layers
  loadRasters();

  //init element events
  createEvents();

  //init country layers
  initCountryLayer();

  //load special IPC layers
  ipcData.forEach(function(country) {
    loadIPCLayer(country);
  });

  //load acled layer
  initAcledLayer();

  //zoom into region
  zoomToRegion();

  //deeplink to country if parameter exists
  if (viewInitialized==true) deepLinkView();

  //create tooltip
  tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'map-tooltip'
  });
}


function loadRasters() {
  //load pop density and chirps rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();

    //pop rasters
    var raster = countryCodeList[country_code].pop;
    if (raster!='') {
      map.addSource(id+'-pop-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+raster
      });

      map.addLayer(
        {
          id: id+'-popdensity',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+raster+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        subnationalBoundaryLayer
      );
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
    }

    //chirps rasters
    var chirpsRaster = countryCodeList[country_code].chirps;
    if (chirpsRaster!='') {
      map.addSource(id+'-chirps-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+chirpsRaster
      });

      map.addLayer(
        {
          id: id+'-chirps',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+chirpsRaster+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        subnationalBoundaryLayer
      );
      map.setLayoutProperty(id+'-chirps', 'visibility', 'none');
    }
  });
}

function loadIPCLayer(country) {
  map.addSource(`${country.iso}-ipc`, {
    type: 'geojson',
    data: `data/${country.data}`,
    generateId: true 
  });
  map.addLayer({
    id: `${country.iso}-ipc-layer`,
    type: 'fill',
    source: `${country.iso}-ipc`,
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'overall_phase_P'],
        0,
        '#FFF',
        1,
        '#CDFACD',
        2,
        '#FAE61C',
        3,
        '#E67800',
        4,
        '#C80100',
        5,
        '#640100'
      ]
    }
  }, subnationalMarkerLayer);


  map.addLayer({
    id: `${country.iso}-ipc-boundary-layer`,
    type: 'line',
    source: `${country.iso}-ipc`,
    paint: {
      'line-color': '#E0E0E0',
    }
  }, subnationalMarkerLayer);

  map.addLayer({
    id: `${country.iso}-ipc-label-layer`,
    type: 'symbol',
    source: `${country.iso}-ipc`,
    filter: ['==', ['geometry-type'], 'Polygon'],
    layout: {
      'text-field': ['get', 'area'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.4
    },
    paint: {
      'text-color': '#333',
      'text-halo-color': '#F2F2F2',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  }, baseLayer);

  map.on('mouseenter', `${country.iso}-ipc-layer`, onMouseEnter);
  map.on('mouseleave', `${country.iso}-ipc-layer`, onMouseLeave);
  map.on('mousemove', `${country.iso}-ipc-layer`, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    let prop = e.features[0].properties;
    let content, location, p3Pop;

    //format content
    content = `<h2>${prop['area']}, ${prop['country']}</h2>`;
    let phase = transformIPC(prop['overall_phase_P']);

    //get adm2 data by area name
    location = admintwo_data.filter(function(c) {
      if (c['#adm2+name'].includes(prop['area'])) {
        return c;
      }
    });

    p3Pop = prop['p3_plus_P_population'];
    if (phase!='0') content += `${currentIndicator.name}: <div class="stat">${phase}</div>`;

    let tableArray = [{label: 'People Affected', indicator: '#affected+total'},
                      {label: 'People Targeted', indicator: '#targeted+total'}];

    content += '<div class="table-display">';
    if (p3Pop!==undefined) {
      content += `<div class="table-row"><div>Population with Acute Food Insecurity:</div><div>${shortenNumFormat(p3Pop)}</div></div>`;
    }

    tableArray.forEach(function(row) {
      let value = (location[0]!=undefined) ? location[0][row.indicator] : 0;
      let shortVal = (value==0 || isNaN(value)) ? 'No Data' : shortenNumFormat(value);
      content += `<div class="table-row"><div>${row.label}:</div><div>${shortVal}</div></div>`;
    });
    content += '</div>';
    
    //set tooltip
    tooltip.setHTML(content);
    tooltip
      .addTo(map)
      .setLngLat(e.lngLat);
  });
}

function initAcledLayer() {
  let maxCount = d3.max(acledData, function(d) { return +d['#affected+killed']; });
  let dotScale = d3.scaleSqrt()
    .domain([1, maxCount])
    .range([4, 16]);

  //get unique event types
  let acledEvents = [...new Set(acledData.map(d => d['#event+type']))];
  
  //build expression for event dot circles
  let eventTypeColorScale = ['match', ['get', 'event_type']];
  for (const [index, event] of acledEvents.sort().entries()) {
    eventTypeColorScale.push(event);
    eventTypeColorScale.push(eventColorRange[index]);
  }
  eventTypeColorScale.push('#666');

  let events = [];
  for (let e of acledData) {
    events.push({
      'type': 'Feature',
      'properties': {
        'iso': e['#country+code'],
        'adm1': e['#adm1+name'],
        'adm3': e['#adm3+name'],
        'event_type': e['#event+type'],
        'date': e['#date+occurred'],
        'fatalities': e['#affected+killed'],
        'notes': e['#description'],
        'iconSize': dotScale(e['#affected+killed'])
      },
      'geometry': { 
        'type': 'Point', 
        'coordinates': e['#coords']
      } 
    })
  }
  let eventsGeoJson = {
    'type': 'FeatureCollection',
    'features': events
  };

  map.addSource('acled', {
    type: 'geojson',
    data: eventsGeoJson,
    generateId: true
  });

  //add acled layer per country
  globalCountryList.forEach(function(country) {
    let iso = country.code.toLowerCase();
    map.addLayer({
      id: `acled-dots-${iso}`,
      type: 'circle',
      source: 'acled',
      filter: ['==', 'iso', iso.toUpperCase()],
      paint: {
        'circle-color': eventTypeColorScale,
        'circle-stroke-color': eventTypeColorScale,
        'circle-opacity': 0.5,
        'circle-radius': ['get', 'iconSize'],
        'circle-stroke-width': 1,
      }
    }, baseLayer);
    map.setLayoutProperty(`acled-dots-${iso}`, 'visibility', 'none');

    //mouse events
    map.on('mouseenter', `acled-dots-${iso}`, onMouseEnter);
    map.on('mouseleave', `acled-dots-${iso}`, onMouseLeave);
    map.on('mousemove', `acled-dots-${iso}`, function(e) {
      map.getCanvas().style.cursor = 'pointer';
      let prop = e.features[0].properties;
      let date = new Date(prop.date);
      let content = `<span class='small'>${moment(date).format('MMM D, YYYY')}</span>`;
      content += `<h2>${prop.event_type}</h2>`;
      content += `<p>${prop.notes}</p>`;
      content += `<p>Fatalities: ${prop.fatalities}</p>`;
      tooltip.setHTML(content);
      tooltip
        .addTo(map)
        .setLngLat(e.lngLat);
    });
  });

  //var zipCodeFilter = ["==", ['get', 'ZipCode'], Number(zipcode_val)];
  //var boroughFilter = ['match', ['get', 'Borough'], borough_val, true, false];
  //var combinedFilter = ["all", zipCodeFilter, boroughFilter];
  //map.setFilter('parcels_fill', combinedFilter);
}



function deepLinkView() {
  var location = window.location.search;
  //deep link to country view
  if (location.indexOf('?c=')>-1) {
    var countryCode = location.split('c=')[1].toUpperCase();
    if (countryCodeList.hasOwnProperty(countryCode)) {    
      $('.country-select').val(countryCode);
      currentCountry.code = countryCode;
      currentCountry.name = d3.select('.country-select option:checked').text();

      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
      updateCountrySource();
    }
  }
  //deep link to specific layer in global view
  if (location.indexOf('?layer=')>-1) {
    var layer = location.split('layer=')[1];
      var selected = $('.map-legend').find('input[data-layer="'+layer+'"]');
      selected.prop('checked', true);
      onLayerSelected(selected);
  }
  //deep link to tabbed view
  if (location.indexOf('?tab=')>-1) {
    let view = location.split('tab=')[1];
    let selectedTab = $(`.tab-menubar .tab-button[data-id="${view}"]`);
    selectedTab.click();
  }
}


function matchMapFeatures(country_code) {
  //loop through mapFeatures to find matches to currentCountry.code
  var selectedFeatures = [];
  mapFeatures.forEach(function(feature) {
    if (feature.sourceLayer==adm0SourceLayer && feature.properties.ISO3_CODE==currentCountry.code) {
      selectedFeatures.push(feature)
    }
  });
  return selectedFeatures;
}


function createEvents() {
  //country dropdown select event
  d3.select('.country-select').on('change',function(e) {
    currentCountry.code = d3.select('.country-select').node().value;
    currentCountry.name = d3.select('.country-select option:checked').text();
    vizTrack(`main ${currentCountry.code} view`, currentIndicator.name);

    if (isCountryView()) {
      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
    else {
      resetMap();
    }

    //update country specific sources
    updateCountrySource();

    //reset tab view  
    let selectedTab = $(`.tab-menubar .tab-button[data-id="map-view"]`);
    selectedTab.click();
  });

  //ranking select event
  d3.selectAll('.ranking-select').on('change',function(e) {
    var selected = d3.select(this).node().value;
    if (selected!='') {
      updateRanking(selected);
      vizTrack(`chart view`, selected);
    }
  });

  //map legend radio events
  $('input[type="radio"]').click(function(){
    var selected = $('input[name="countryIndicators"]:checked');
    vizTrack(`main ${currentCountry.code} view`, selected.parent().text());
    onLayerSelected(selected);
  });
}

function onLayerSelected(selected) {
  currentIndicator = {id: selected.val(), name: selected.parent().text()};
  selectLayer(selected);
  
  if (!isCountryView()) {
    updateCountryLayer();
  }
  else {
    var selectedFeatures = matchMapFeatures(currentCountry.code);
    selectCountry(selectedFeatures);
  }
}


function selectLayer(layer) {
  //reset any deep links
  let layerID = layer.attr('data-layer');
  let location = (layerID==undefined) ? window.location.pathname : window.location.pathname+'?layer='+layerID;
  window.history.replaceState(null, null, location);
}


function selectCountry(features) {
  let target = bbox.default(turfHelpers.featureCollection(features));
  let padding = 40;
  let mapPadding = (isMobile) ?
    {
        top: 0,
        right: -100,
        left: -100,
        bottom: 0
    } :
    { 
      top: $('.tab-menubar').outerHeight() + padding,
      right: $('.map-legend').outerWidth(),
      bottom: padding,
      left: $('.key-figure-panel').outerWidth() + padding,
    };
  map.fitBounds(target, {
    offset: [0, 0] ,
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });

  map.once('moveend', updateCountryLayer);

  //append country code to url
  window.history.replaceState(null, null, window.location.pathname + '?c='+currentCountry.code);
}


function updateCountrySource() {
  let country = (!isCountryView()) ? 'regional' : (currentCountry.code).toLowerCase();
  $('.map-legend .indicator').each(function(layer) {
    let div = $(this).find('.source-container');
    let indicator = $(this).find('input').val() + '+' + country;
    updateSource(div, indicator);
  });
}

function zoomToRegion() {
  var offset = 100;
  let mapPadding = (isMobile) ?
    {
        top: 0,
        right: -100,
        left: -100,
        bottom: 0
    } :
    { 
      top: offset,
      right: offset,
      bottom: offset,
      left: $('.key-figure-panel').outerWidth(),
    };
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
    linear: true
  });
}

function resetMap() {
  //reset layers
  toggleIPCLayers(true);

  //reset map legends
  $('.legend-container').show();

  //reset download links
  $('.download-link').hide();
  $('.download-link.regional').show();

  //set default layer  
  var selected = $('.map-legend').find('input[data-layer="ipc_acute_food_insecurity_phase"]');
  selected.prop('checked', true);
  onLayerSelected(selected);

  //zoom to region
  zoomToRegion()
  map.once('moveend', initKeyFigures);

  //reset location
  window.history.replaceState(null, null, window.location.pathname);
}

function toggleIPCLayers(visible) {
  ipcData.forEach(function(country) {
    let vis = (visible && (!isCountryView() || currentCountry.code.toLowerCase()==country.iso)) ? 'visible' : 'none';
    map.setLayoutProperty(`${country.iso}-ipc-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-boundary-layer`, 'visibility', vis);
    map.setLayoutProperty(`${country.iso}-ipc-label-layer`, 'visibility', vis);
  });

  //turn subnational labels off and ipc bubbles on for ipc layer
  if (visible) {
    map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');
    map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');
    if (currentCountry.code=='KEN' || currentCountry.code=='SOM') $('.bubble-scale').hide();
    else $('.bubble-scale').show();
  }
  else {
    map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'none');
    $('.bubble-scale').hide();
  }
}

function toggleAcledLayer(visible) {
  globalCountryList.forEach(function(country) {
    let vis = (visible && (!isCountryView() || currentCountry.code.toLowerCase()==country.code.toLowerCase())) ? 'visible' : 'none';
    map.setLayoutProperty(`acled-dots-${country.code.toLowerCase()}`, 'visibility', vis);
  });
}

/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initKeyFigures() {
  var data = (!isCountryView()) ? regionalData : dataByCountry[currentCountry.code][0];

  //humanitarian impact figures
  var impactDiv = $('.key-figure-panel .impact .panel-inner');
  impactDiv.children().remove();

  let impactFigures = [
    {className: 'pin', title: 'People Affected', tag: '#affected+total'},
    {className: 'targeted', title: 'People Targeted', tag: '#targeted+total'},
    {className: 'reached', title: 'People Reached', tag: '#reached+total'},
    {className: 'idp', title: 'Internally Displaced People due to Drought', tag: '#affected+idps'},
    {className: 'ipc', title: 'Population with Acute Food Insecurity [?]', tag: '#affected+food+ipc+p3plus+num', tooltip: 'For Kenya and Somalia, Population with Acute Food Insecurity refers to the population assessed to be in IPC phase 3 and above through an IPC or IPC compatible process. For Ethiopia, Population with Acute Food Insecurity refers to the population targeted for food assistance by the food security cluster in Ethiopia'},
    {className: 'water', title: 'Water Insecurity [?]', tag: '#affected+water', tooltip: 'Number of people who cannot access enough water for drinking, cooking, cleaning'},
    {className: 'sam', title: 'No. of Children (<5yrs) with Severe Acute Malnutrition', tag: '#affected+sam'},
    {className: 'gam', title: 'No. of Children (<5yrs) with Global Acute Malnutrition', tag: '#affected+gam'}
  ];

  impactFigures.forEach(function(fig) {
    let tag = (!isCountryView()) ? `${fig.tag}+regional` : `${fig.tag}+${(currentCountry.code).toLowerCase()}`;
    fig.indicator = tag;
    fig.stat = formatValue(data[fig.tag], 'short');
    createFigure(impactDiv, fig);
  });


   //funding figures
  var fundingDiv = $('.key-figure-panel .funding .panel-inner');
  fundingDiv.children().remove();

  let fundingFigures = [
    {className: 'requirement', title: 'Requirement', tag: '#value+funding+required+usd'},
    {className: 'funded', title: 'Funded', tag: '#value+funding+total+usd'},
    {className: 'percent-funded', title: 'Percent Funded', tag: '#value+funding+pct'}
  ];

  fundingFigures.forEach(function(fig) {
    let tag = (!isCountryView()) ? `${fig.tag}+regional` : `${fig.tag}+${(currentCountry.code).toLowerCase()}`;
    let statVal = fig.tag=='#value+funding+pct' ? formatValue(data[fig.tag], 'percent') : formatValue(data[fig.tag]);
    fig.indicator = tag;
    fig.stat = statVal;
    createFigure(fundingDiv, fig);
  });
}


function createFigure(div, obj) {
  div.append(`<div class="figure ${obj.className}"><div class="figure-inner"></div></div>`);
  var divInner = $(`.${obj.className} .figure-inner`);
  if (obj.title != undefined) divInner.append(`<h6 class="title">${obj.title}</h6>`);
  divInner.append(`<p class="stat">${obj.stat}</p>`);

  if (obj.indicator!='')
    createSource(divInner, obj.indicator);

  if (obj.tooltip!=undefined) {
    divInner.find('.title').on('mouseenter', function(e) {
      let pos = $(e.currentTarget).position();
      $('.panel-tooltip .tooltip-inner').html(obj.tooltip);
      $('.panel-tooltip').css('opacity', 0.9);
      $('.panel-tooltip').css('top', `${pos.top - $('.panel-tooltip').height() - 10}px`);
      $('.panel-tooltip').css('left', `${pos.left + $(this).width()/2 - $('.panel-tooltip').width()/2}px`);
    });
    divInner.find('.title').on('mouseout', function(e) {
      $('.panel-tooltip').css('opacity', 0);
    });
  }
}


/************************/
/*** SOURCE FUNCTIONS ***/
/************************/
function createSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = sourceObj['#date'];
  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  let sourceContent = `<p class='small source'><span class='date'>${date}</span> | <span class='source-name'>${sourceName}</span>`;
  sourceContent += ` | <a href='${sourceURL}' class='dataURL' target='_blank' rel='noopener'>DATA</a>`;
  sourceContent += `</p>`;
  div.append(sourceContent);
}

function updateSource(div, indicator) {
  var sourceObj = getSource(indicator);
  if (Object.keys(sourceObj).length<1) {
    div.hide();
  }
  else {
    div.show();

    var date = sourceObj['#date'];
    var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
    var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
    div.find('.date').text(date);
    div.find('.source-name').text(sourceName);
    div.find('.dataURL').attr('href', sourceURL);
  }
}

function getSource(indicator) {
  var obj = {};
  sourcesData.forEach(function(item) {
    if (item['#indicator+name']==indicator) {
      obj = item;
    }
  });
  return obj;
}
/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
function createCountryMapTooltip(location) {
  var val = location[currentIndicator.id];
  var label = currentIndicator.name;

  //format content for tooltip
  let content = '';
  content = `<h2>${location['#adm2+name']}, ${location['#country+name']}</h2>`;

  if ('currentIndicator.id'=='#priority' || isNaN(val)) {
    let indicator;
    if (currentIndicator.id=='#priority') indicator = 'Operational Priority Level';
    else indicator = currentIndicator.name
    content += `${indicator}:<div class="stat">${val}</div>`;
  }
  else if (currentIndicator.id=='#climate+rainfall+anomaly'){
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
var numFormat = d3.format(',');
var shortenNumFormat = d3.format('.2s');
var percentFormat = d3.format('.1%');
var dateFormat = d3.utcFormat("%b %d, %Y");
var chartDateFormat = d3.utcFormat("%-m/%-d/%y");
var colorRange = ['#F7DBD9', '#F6BDB9', '#F5A09A', '#F4827A', '#F2645A'];
var priorityColorRange = ['#F7DBD9', '#F5A09A', '#F2645A'];
var populationColorRange = ['#F7FCB9', '#D9F0A3', '#ADDD8E', '#78C679', '#41AB5D', '#238443', '#005A32'];
var ipcPhaseColorRange = ['#CDFACD', '#FAE61E', '#E67800', '#C80000', '#640000'];
var idpColorRange = ['#D1E3EA','#BBD1E6','#ADBCE3','#B2B3E0','#A99BC6'];
var chirpsColorRange = ['#254061', '#1e6deb', '#3a95f5', '#78c6fa', '#b5ebfa', '#77eb73', '#fefefe', '#f0dcb9', '#ffe978', '#ffa200', '#ff3300', '#a31e1e', '#69191a'];
var eventColorRange = ['#EEB598','#CE7C7F','#60A2A4','#91C4B7'];
var eventCategories = ['Battles', 'Explosions/Remote violence', 'Riots', 'Violence against civilians'];
var colorDefault = '#F2F2EF';
var colorNoData = '#FFF';
var regionBoundaryData, regionalData, nationalData, adminone_data, admintwo_data, ethData, fatalityData, donorData, dataByCountry, colorScale, viewportWidth, viewportHeight = '';
var rankingChart = '';
var mapLoaded = false;
var dataLoaded = false;
var viewInitialized = false;
var isMobile = false;
var zoomLevel = 4.9;
var minZoom = 3.5;

var globalCountryList = [];
var currentIndicator = {};
var currentCountry = {};

mapboxgl.baseApiUrl='https://data.humdata.org/mapbox';
mapboxgl.accessToken = 'cacheToken';

$( document ).ready(function() {
  var prod = (window.location.href.indexOf('ocha-dap')>-1 || window.location.href.indexOf('data.humdata.org')>-1) ? true : false;
  //console.log(prod);


  function init() {
    //detect mobile users
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      $('.mobile-message').show();
      isMobile = true;
      minZoom = 1;
      zoomLevel = 3;
    }
    $('.mobile-message').on('click', function() {
      $(this).remove();
    });

    //set content sizes based on viewport
    var minWidth = isMobile ? window.innerWidth : 1000;
    viewportWidth = (window.innerWidth<minWidth) ? minWidth : window.innerWidth;
    viewportHeight = window.innerHeight;

    var tooltip = d3.select('.tooltip');
    $('.content').width(viewportWidth);
    $('.content').height(viewportHeight);
    $('.content-right').width(viewportWidth);
    $('.key-figure-panel .panel-content').height(viewportHeight - $('.key-figure-panel .panel-content').position().top);
    $('.map-legend.country').css('max-height', viewportHeight - 200);
    if (viewportHeight<696) {
      zoomLevel = 1.4;
    }
    $('#chart-view').height(viewportHeight-$('.tab-menubar').outerHeight()-30);

    //load static map -- will only work for screens smaller than 1280
    if (viewportWidth<=1280) {
      var staticURL = 'https://api.mapbox.com/styles/v1/humdata/cl0cqcpm4002014utgdbhcn4q/static/-25,0,2/'+viewportWidth+'x'+viewportHeight+'?access_token='+mapboxgl.accessToken;
      $('#static-map').css('background-image', 'url('+staticURL+')');
    }

    getData();
    initMap();
  }

  function getData() {
    console.log('Loading data...')
    Promise.all([
      d3.json('https://raw.githubusercontent.com/OCHA-DAP/hdx-scraper-hornafrica-viz/main/all.json'),
      d3.json('data/ocha-regions-bbox-hornafrica.geojson'),
      d3.json('data/eth_food_security.geojson')
    ]).then(function(data) {
      console.log('Data loaded');
      $('.loader span').text('Initializing map...');


      //parse data
      var allData = data[0];
      regionalData = allData.regional_data[0];
      nationalData = allData.national_data;
      //adminone_data = allData.adminone_data;
      admintwo_data = allData.admintwo_data;
      sourcesData = allData.sources_data;
      regionBoundaryData = data[1].features;
      ethData = data[2].features;
      donorData = allData.planorgfunding_data;

      //clean acled data
      fatalityData = allData.fatalities_data;
      acledCoords(allData.fatalities_data);

      //parse national data
      nationalData.forEach(function(item) {
        //keep global list of countries
        globalCountryList.push({
          'name': item['#country+name'],
          'code': item['#country+code']
        });
        globalCountryList.sort(function(a,b) {
          return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
        });
      });

      //transform adm1 ipc data
      // adminone_data.forEach(function(d) {
      //   d['#affected+food+ipc+phase+type'] = transformIPC(d['#affected+food+ipc+phase+type']);
      // });

      //transform adm2 ipc and priority data
      admintwo_data.forEach(function(d) {
        d['#affected+food+ipc+phase+type'] = transformIPC(d['#affected+food+ipc+phase+type']);

        switch(+d['#priority']) {
          case 1:
            d['#priority'] = 'Priority 1';
            break;
          case 2:
            d['#priority'] = 'Priority 2';
            break;
          case 3:
            d['#priority'] = 'Priority 3';
            break;
          default:
            d['#priority'] = d['#priority'];
        }

        ethData.forEach(function(feature) {
          if (feature.properties.ADM3_PCODE == d['#adm2+code'])
            d['#affected+food+ipc+p3plus+num'] = feature.properties.p3_plus_P_population;
        })
      });

      //group national data by country -- drives country panel    
      dataByCountry = d3.nest()
        .key(function(d) { return d['#country+code']; })
        .object(nationalData);


      dataLoaded = true;
      if (mapLoaded==true) displayMap();
      initView();
    });
  }

  function acledCoords(d) {
    //process acled data
    let data = [];
    d.forEach(function(event) {
      if (eventCategories.includes(event['#event+type'])) {
        let iso = '';
        if (event['#adm2+code'].includes('ET'))
          iso = 'ETH';
        else if (event['#adm2+code'].includes('KE'))
          iso = 'KEN';
        else
          iso = 'SOM';
        event['#country+code'] = iso;
        event['#coords'] = [+event['#geo+lon'], +event['#geo+lat']];
        data.push(event);
      }
    });

    //group by coords
    let coordGroups = d3.nest()
      .key(function(d) { return d['#coords']; })
      .entries(data);

    //nudge dots with duplicate coords
    acledData = [];
    coordGroups.forEach(function(coords) {
      if (coords.values.length>1)
        coords.values.forEach(function(c) {
          let origCoord = turf.point(c['#coords']);
          let bearing = randomNumber(-180, 180); //randomly scatter around origin
          let distance = randomNumber(2, 8); //randomly scatter by 2-8km from origin
          let newCoord = turf.destination(origCoord, distance, bearing);
          c['#coords'] = newCoord.geometry.coordinates;
          acledData.push(c);
        });
      else {
        acledData.push(coords.values[0]);
      }
    });
  }

  function initView() {
    //load ranking data for chart view 
    initRanking(donorData, '.ranking-chart');

    //check map loaded status
    if (mapLoaded==true && viewInitialized==false)
      deepLinkView();

    //create tab events
    $('.tab-menubar .tab-button').on('click', function() {
      $('.tab-button').removeClass('active');
      $(this).addClass('active');
      if ($(this).data('id')=='chart-view') {
        $('#chart-view').show();
      }
      else {
        $('#chart-view').hide();
      }

      let location = ($(this).data('id')==undefined) ? window.location.pathname : window.location.pathname + '?tab=' + $(this).data('id');
      window.history.replaceState(null, null, location);
      vizTrack($(this).data('id'), currentIndicator.name);
    });

    //create country dropdown
    $('.country-select').empty();
    var countrySelect = d3.select('.country-select')
      .selectAll('option')
      .data(Object.entries(dataByCountry))
      .enter().append('option')
        .text(function(d) { return d[1][0]['#country+name']; })
        .attr('value', function (d) { return d[1][0]['#country+code']; });
    //insert default option    
    $('.country-select').prepend('<option value="Regional">All Countries</option>');
    $('.country-select').val($('.country-select option:first').val());
    currentCountry = {code: 'Regional', name:'All Countries'}

    //create chart view country select
    var rankingSelect = d3.select('.ranking-select')
      .selectAll('option')
      .data(globalCountryList)
      .enter().append('option')
        .text(function(d) {
          return d.name; 
        })
        .attr('value', function (d) { return d.code; });
    //insert default option    
    $('.ranking-select').prepend('<option value="Regional">All Countries</option>');
    $('.ranking-select').val($('.ranking-select option:first').val());

    viewInitialized = true;
  }


  function initTracking() {
    //initialize mixpanel
    var MIXPANEL_TOKEN = window.location.hostname=='data.humdata.org'? '5cbf12bc9984628fb2c55a49daf32e74' : '99035923ee0a67880e6c05ab92b6cbc0';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  init();
  initTracking();
});