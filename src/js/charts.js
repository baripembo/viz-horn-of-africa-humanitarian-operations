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


