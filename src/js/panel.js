/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initKeyFigures() {
  var data = (currentCountry.code=='') ? regionalData : dataByCountry[currentCountry.code][0];

   //humanitarian impact figures
  var impactDiv = $('.key-figure-panel .impact .panel-inner');
  impactDiv.children().remove();
  createFigure(impactDiv, {className: 'pin', title: 'People in Need', stat: formatValue(data['#inneed'], 'short'), indicator: '#inneed'});
  createFigure(impactDiv, {className: 'targeted', title: 'People Targeted', stat: formatValue(data['#targeted'], 'short'), indicator: '#targeted'});
  createFigure(impactDiv, {className: 'reached', title: 'People Reached', stat: formatValue(data['#reached'], 'short'), indicator: '#reached'});
  createFigure(impactDiv, {className: 'idp', title: 'Internally Displaced People', stat: shortenNumFormat(data['#affected+idps']), indicator: '#affected+idps'});
  createFigure(impactDiv, {className: 'ipc', title: 'Population in IPC Phase 3+ Acute Food Insecurity', stat: shortenNumFormat(data['#affected+food+ipc+p3plus+num']), indicator: '#affected+food+ipc+p3plus+num'});
  createFigure(impactDiv, {className: 'sam', title: 'Severe Acute Malnutrition', stat: shortenNumFormat(data['#affected+children+sam']), indicator: '#affected+children+sam'});

   //humanitarian impact figures
  var fundingDiv = $('.key-figure-panel .funding .panel-inner');
  fundingDiv.children().remove();
  createFigure(fundingDiv, {className: 'requirement', title: 'Requirement', stat: formatValue(data['#value+funding+required+usd']), indicator: '#value+funding+required+usd'});
  createFigure(fundingDiv, {className: 'funded', title: 'Funded', stat: formatValue(data['#value+funding+total+usd']), indicator: '#value+funding+total+usd'});
  createFigure(fundingDiv, {className: 'percent-funded', title: 'Percent Funded', stat: formatValue(data['#value+funding+pct'], 'percent'), indicator: '#value+funding+pct'});

  if (isCountryView()) {
    createFigure(fundingDiv, {className: 'other-requirement', title: data['#value+funding+other+plan_name'] + ' Requirement', stat: formatValue(data['#value+funding+other+required+usd']), indicator: '#value+funding+other+required+usd'});
    createFigure(fundingDiv, {className: 'other-funded', title: data['#value+funding+other+plan_name'] + ' Funded', stat: formatValue(data['#value+funding+other+total+usd']), indicator: '#value+funding+other+total+usd'});
    createFigure(fundingDiv, {className: 'other-percent-funded', title: data['#value+funding+other+plan_name'] + ' Percent Funded', stat: formatValue(data['#value+funding+other+pct'], 'percent'), indicator: '#value+funding+other+pct'});
  }
}


function createFigure(div, obj) {
  div.append('<div class="figure '+ obj.className +'"><div class="figure-inner"></div></div>');
  var divInner = $('.'+ obj.className +' .figure-inner');
  if (obj.title != undefined) divInner.append('<h6 class="title">'+ obj.title +'</h6>');
  divInner.append('<p class="stat">'+ obj.stat +'</p>');

  if (obj.indicator!='')
    createSource(divInner, obj.indicator);
}


/************************/
/*** SOURCE FUNCTIONS ***/
/************************/
function createSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));

  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  let sourceContent = `<p class='small source'><span class='date'>${date}</span> | <span class='source-name'>${sourceName}</span>`;
  if (sourceURL!=='#') sourceContent += ` | <a href='${sourceURL}' class='dataURL' target='_blank' rel='noopener'>DATA</a>`;
  sourceContent += `</p>`;
  div.append(sourceContent);
}

function updateSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));
  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  div.find('.date').text(date);
  div.find('.source-name').text(sourceName);
  div.find('.dataURL').attr('href', sourceURL);
}

function getSource(indicator) {
  var isGlobal = ($('.content').hasClass('country-view')) ? false : true;
  var obj = {};
  sourcesData.forEach(function(item) {
    if (item['#indicator+name']==indicator) {
      obj = item;
    }
  });
  return obj;
}