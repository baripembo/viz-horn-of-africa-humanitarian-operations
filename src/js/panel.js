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
    {className: 'idp', title: 'Internally Displaced People', tag: '#affected+idps'},
    {className: 'ipc', title: 'IPC 3+ Acute Food Insecurity', tag: '#affected+food+ipc+p3plus+num'},
    {className: 'water', title: 'Water Insecurity', tag: '#affected+water'},
    {className: 'sam', title: 'Severe Acute Malnutrition', tag: '#affected+sam'},
    {className: 'gam', title: 'Global Acute Malnutrition', tag: '#affected+gam'}
  ];

  impactFigures.forEach(function(fig) {
    let tag = (!isCountryView()) ? `${fig.tag}+regional` : `${fig.tag}+${(currentCountry.code).toLowerCase()}`;
    createFigure(impactDiv, {className: fig.className, title: fig.title, stat: formatValue(data[fig.tag], 'short'), indicator: tag});
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
    createFigure(fundingDiv, {className: fig.className, title: fig.title, stat: statVal, indicator: tag});
  });
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