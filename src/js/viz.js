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
      d3.json('https://raw.githubusercontent.com/OCHA-DAP/viz-horn-of-africa-humanitarian-operations/v1/src/data/ethiopia_ipc.geojson')
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
      //   d['#affected+food+ipc+p3plus+num'] = transformIPC(d['#affected+food+ipc+p3plus+num']);
      // });

      //transform adm2 ipc and priority data
      admintwo_data.forEach(function(d) {
        //d['#affected+food+ipc+p3plus+num'] = transformIPC(d['#affected+food+ipc+p3plus+num']);

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