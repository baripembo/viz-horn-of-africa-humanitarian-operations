/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initKeyFigures() {
  var data = (!isCountryView()) ? regionalData : dataByCountry[currentCountry.code][0];
  console.log(currentCountry.code)

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