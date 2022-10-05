var numFormat = d3.format(',');
var shortenNumFormat = d3.format('.3s');
var percentFormat = d3.format('.1%');
var dateFormat = d3.utcFormat("%b %d, %Y");
var chartDateFormat = d3.utcFormat("%-m/%-d/%y");
var colorRange = ['#F7DBD9', '#F6BDB9', '#F5A09A', '#F4827A', '#F2645A'];
var priorityColorRange = ['#F7DBD9', '#F5A09A', '#F2645A'];
var populationColorRange = ['#F7FCB9', '#D9F0A3', '#ADDD8E', '#78C679', '#41AB5D', '#238443', '#005A32'];
var ipcPhaseColorRange = ['#CDFACD', '#FAE61E', '#E67800', '#C80000', '#640000'];
var chirpsColorRange = ['#254061', '#1e6deb', '#3a95f5', '#78c6fa', '#b5ebfa', '#77eb73', '#fefefe', '#f0dcb9', '#ffe978', '#ffa200', '#ff3300', '#a31e1e', '#69191a'];
var colorDefault = '#F2F2EF';
var colorNoData = '#FFF';
var regionBoundaryData, regionalData, nationalData, adminone_data, admintwo_data, dataByCountry, colorScale, viewportWidth, viewportHeight = '';
var countryTimeseriesChart = '';
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

  var tooltip = d3.select('.tooltip');
  var minWidth = 1000;
  viewportWidth = (window.innerWidth<minWidth) ? minWidth : window.innerWidth;
  viewportHeight = window.innerHeight;


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
    $('.content').width(viewportWidth);
    $('.content').height(viewportHeight);
    $('.content-right').width(viewportWidth);
    $('.key-figure-panel .panel-content').height(viewportHeight - $('.key-figure-panel .panel-content').position().top);
    $('.map-legend.country').css('max-height', viewportHeight - 200);
    if (viewportHeight<696) {
      zoomLevel = 1.4;
    }
    $('#chart-view').height(viewportHeight-30);//$('#chart-view').height(viewportHeight-$('.tab-menubar').outerHeight()-30);

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
      d3.json('data/ocha-regions-bbox-hornafrica.geojson')
    ]).then(function(data) {
      console.log('Data loaded');
      $('.loader span').text('Initializing map...');


      //parse data
      var allData = data[0];
      regionalData = allData.regional_data[0];
      nationalData = allData.national_data;
      adminone_data = allData.adminone_data;
      admintwo_data = allData.admintwo_data;
      sourcesData = allData.sources_data;
      regionBoundaryData = data[1].features;

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
        //d['#affected+food+ipc+phase+type'] = transformIPC(d['#affected+food+ipc+phase+type']);

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


  function initView() {
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
      //vizTrack($(this).data('id'), currentIndicator.name);
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
    $('.country-select').prepend('<option value="">All Countries</option>');
    $('.country-select').val($('.country-select option:first').val());
    currentCountry = {code: '', name:''}

    //create chart view country select
    // $('.trendseries-select').append($('<option value="All">All Clusters</option>')); 
    // var trendseriesSelect = d3.select('.trendseries-select')
    //   .selectAll('option')
    //   .data(subnationalData)
    //   .enter().append('option')
    //     .text(function(d) {
    //       let name = (d['#adm1+code']=='UA80') ? d['#adm1+name'] + ' (city)' : d['#adm1+name'];
    //       return name; 
    //     })
    //     .attr('value', function (d) { return d['#adm1+code']; });

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