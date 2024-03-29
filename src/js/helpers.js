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
  ETH: {pop: '1jx1mpm4', chirps: '9f35wnzq', chirpsMAM: 'adtgh6lr', chirpsOND: '9f35wnzq'},
  KEN: {pop: '1iwk6136', chirps: '0zdu5z45', chirpsMAM: 'bdidwt0g', chirpsOND: '0zdu5z45'},
  SOM: {pop: 'd0xh6ux7', chirps: '1bl7k2zs', chirpsMAM: '7xxd10pv', chirpsOND: '1bl7k2zs'}
};

