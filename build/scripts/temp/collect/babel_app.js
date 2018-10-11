'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var STORAGE = {
  'charts': {}, // Se guarda información correspondiente a cada gráfico
  'activeCard': {},
  'colors': {
    base: '#767676',
    base_dark: '#444444',
    base_light: '#FAFAFA',
    gobar_light: '#17B2F8',
    gobar_dark: '#0695D6',
    palette: {
      color1: '',
      color2: '',
      color3: ''
    }
  }
};

// Funciones Globales
////////////////////////////////////////////////////////////////////////////////

// Actualizado 17.08.2017 - Permite definir formato del número.
function roundNumber(_number, _decimals) {
  return Number(Math.round(_number + 'e' + _decimals) + 'e-' + _decimals);
}
function formatNumberD3(_number) {
  return d3.format(parseInt(_number) === _number ? ',' : ',.2f')(_number);
}
function formatNumberJS(_number, _precision, _miles, _decimales) {
  var r = '\\d(?=(\\d{3})+' + (_precision > 0 ? '\\D' : '$') + ')',
      v = _number.toFixed(Math.max(0, _precision));

  return (_decimales ? v.replace('.', _decimales) : v).replace(new RegExp(r, 'g'), '$&' + (_miles || ','));
}
// Actualizado 17.08.2017 - Guarda en el portapapeles el texto de un elemento.
function copyText(_element) {
  var copy = _element.parentNode.querySelector('input').select();

  window.document.execCommand('copy');
}
// Actualizado 17.08.2017 - Permite renderizar un bloque de contenido y descargar una imagen.
function shareSaveAs(_element, _indicatorId) {
  var renderNode = _element.parentNode.parentNode;
  renderNode.parentNode.querySelector('.share-open').checked = false;

  domtoimage.toBlob(renderNode).then(function (blob) {
    window.saveAs(blob, 'indicator_' + _indicatorId + '_chart_' + renderNode.getAttribute('id') + '_' + moment().zone('+00:00').format('x') + '.png');
  }).catch(function (error) {
    console.error('oops, algo sucedio mal!', error);
  });
}
// Actualizado 17.08.2017 - Permite generar una imagen para embeber ese bloque de contenido.
function shareEmbebed(_element) {
  var renderNode = _element.parentNode.parentNode;
  renderNode.parentNode.querySelector('.share-open').checked = false;

  embebedContainerShow(renderNode);
}
// Actualizado 17.08.2017 - Muesta el contenedor para embeber el modulo.
function embebedContainerShow(_component) {
  _component.querySelector('.embebedContainer').style.opacity = '';
  _component.querySelector('.embebedContainer').style.visibility = '';
}
// Actualizado 17.08.2017 - Oculta el contenedor para embeber el modulo.
function embebedContainerHide(_component) {
  _component.parentNode.style.opacity = 0;
  _component.parentNode.style.visibility = 'hidden';
}
// Actualizado 17.08.2017 - Genera un div de embebedido.
function addEmbebed(_indicatorId, _chart) {
  var component = void 0,
      callToAction = void 0,
      iframe = void 0,
      input = void 0,
      button = void 0,
      exit = void 0,
      title = void 0;

  iframe = '<iframe src=' + (window.location.href + '?indicator=' + _indicatorId + '&chart=' + _chart.id) + ' width=100% height=100% frameborder=0 scrolling=no></iframe>';
  input = '<input value="' + iframe + '"></input>';
  button = '<button class="button buttonBig buttonSquare" onclick="copyText(this)"><span class="button-waves"><i class="fa fa-clone" aria-hidden="true"></i>&nbsp;Copiar</span></button>';

  callToAction = window.document.createElement('div');
  callToAction.setAttribute('class', 'flex');
  callToAction.innerHTML = input + button;

  exit = '<span class="btn-exit flex" onclick="embebedContainerHide(this)"><i class="fa fa-times" aria-hidden="true"></i></span>';
  title = '<span class="embebed-text-info">Copie el siguiente código y peguelo en su sitio.</span>';

  component = window.document.createElement('div');
  component.setAttribute('class', 'embebedContainer flex flex-column');
  component.style.visibility = 'hidden';
  component.style.opacity = 0;
  component.innerHTML = exit + title;

  component.appendChild(callToAction);

  return component;
}
// Actualizado 17.08.2017 - Genera un div de loading.
function addLoading() {
  return makeDomElement('div', {
    className: 'loading flex flex-column'
  }, ['i', {
    className: 'fa fa-spinner fa-pulse fa-3x fa-fw'
  }], ['span', {
    className: 'error-message'
  }]);
}

// Funciones de parseo de datos.
////////////////////////////////////////////////////////////////////////////////
function parseHumanFrecuency(_frecuency, _laps) {
  var frecuency = void 0;

  switch (_frecuency) {
    case 'year':
      frecuency = 'años';
      break;
    case 'semester':
      frecuency = 'semestres';
      break;
    case 'quarter':
      frecuency = 'trimestres';
      break;
    case 'month':
      frecuency = 'meses';
      break;
    case 'day':
      frecuency = 'días';
      break;
    default:
      frecuency = 'frecuencia invalida';
  }

  return 'Últimos ' + _laps + ' ' + frecuency;
}
// Actualizado 17.08.2017 - Esta función parsea el el formato de tipo de linea.
function parseTypeLine(type) {

  switch (type) {
    case 'solid':
      return null;
    case 'dashed':
      return '5, 5';
    default:
      console.error('El tipo de linea ' + type + ' no es válido.');
      return null;
  }
}
// Actualizado 17.08.2017 - Esta función parsea el formato de tipo de fecha.
function parseFormatDate(format, date) {
  var short = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  date = moment(date).zone('+00:00');

  switch (format) {
    case 'year':
      return date.format('YYYY');
    case 'semester':
      var semester = Math.ceil(date.format('M') / 6);

      if (short) {
        return semester + 'S ' + date.format('YY');
      } else {
        return semester + 'º semestre de ' + date.format('YYYY');
      }

      break;
    case 'quarter':
      var trimester = Math.ceil(date.format('M') / 3);

      if (short) {
        return trimester + 'T ' + date.format('YY');
      } else {
        return trimester + 'º trimestre de ' + date.format('YYYY');
      }

      break;
    case 'month':
      return date.format('MMM YY');
    case 'day':
      return date.format('D MMM YY');
    default:
      return 'Frecuencia no soportada'; // TODO ##0001 - Definir valor por defecto
  }
}
// Actualizado 17.08.2017 - Esta función parsea el el formato de tipo de unidad.
function parseValueIndicator(format, value) {
  switch (format) {
    case '%':
      return formatNumberD3(value * 100) + '%';
    default:
      return formatNumberD3(value);
  }
}

// Funciones para render de los gráficos.
////////////////////////////////////////////////////////////////////////////////

// Solicita el render de las tarjetas de gráficos.
// (Optimized)(Update: 25.08.2017)
function requestAllCharts(_indicatorId) {
  var cardData = STORAGE.cards.filter(function (_card) {
    return _card.id === _indicatorId;
  })[0];

  document.querySelector('#chartsContainer #charts').innerHTML = '';

  cardData.charts.forEach(function (_chart) {
    renderChartComponent(_indicatorId, _chart);
  });
}
// Genera el HTML de una tarjeta de gráfico.
// (Optimized)(Update: 25.08.2017)
function renderChartComponent(_indicatorId, _chart) {
  var container = document.querySelector('#chartsContainer #charts');

  var chartComponent = makeDomElement('div', {
    id: _chart.id,
    className: 'chart'
  }, ['div', {
    className: 'head'
  }, ['h3', _chart.title], ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]], ['p', {
    className: 'paragraph',
    innerHTML: _chart.description
  }], ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }], ['div', {
    className: 'br'
  }]]], ['div', {
    className: 'referenceContainer'
  }, ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]], ['span', {
    className: 'references'
  }], ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]], ['div', {
    className: 'break-line'
  }, ['hr']]], ['div', {
    className: 'rangeButton'
  }, ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]],
  // ['div', { className: 'rangeButton-component' },
  //   ['div', { className: 'rangeButton-text', innerHTML: 'Escala:' }],
  //   ['div', { className: 'rangeButton-button', state: 'off' }],
  //   ['div', { className: 'switch-effect', style: 'left: 2px;' }],
  //   ['button', { onclick: () => { changeSwitchPosition(this, _chart.id); }, state: 'active', innerHTML: 'Estática' }],
  //   ['button', { onclick: () => { changeSwitchPosition(this, _chart.id); }, state: '', innerHTML: 'Dinámica' }]
  // ],
  ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]]], ['div', {
    className: 'chart-svg'
  }], ['div', {
    className: 'break-line'
  }, ['div', {
    className: 'br'
  }]], ['div', {
    className: 'modal-share'
  }, ['input', {
    id: 'share-' + _chart.id,
    type: 'checkbox',
    className: 'share-open'
  }], ['label', {
    htmlFor: 'share-' + _chart.id,
    className: 'share-open-button hamburger-dark'
  }, ['span', {
    className: 'hamburger-1'
  }], ['span', {
    className: 'hamburger-2'
  }], ['span', {
    className: 'hamburger-3'
  }]], ['button', {
    className: 'share-item button buttonCircle',
    title: 'Embeber',
    onclick: function onclick(e) {
      shareEmbebed(e.currentTarget);
    },
    style: {
      backgroundColor: 'gray',
      color: 'white',
      right: '0px'
    }
  }, ['span', {
    className: 'buttonCircleSmall boton_efecto'
  }, ['i', {
    className: 'fa fa-code'
  }]]], ['button', {
    className: 'share-item button buttonCircle',
    title: 'Descargar',
    onclick: function onclick(e) {
      shareSaveAs(e.currentTarget, _chart.id);
    },
    style: {
      backgroundColor: 'gray',
      color: 'white',
      right: '0px'
    }
  }, ['span', {
    className: 'buttonCircleSmall boton_efecto'
  }, ['i', {
    className: 'fa fa-download'
  }]]]]);

  chartComponent.appendChild(addLoading());
  chartComponent.appendChild(addEmbebed(_indicatorId, _chart));

  container.appendChild(chartComponent);

  STORAGE.charts[_chart.id] = {
    container: chartComponent
  };

  if (_chart.indicators.length > 0) {
    downloadFilesToChart(_chart);
  } else {
    var domElement = document.getElementById(_chart.id);

    domElement.querySelector('.loading .fa').setAttribute('class', 'fa fa-exclamation');
    domElement.querySelector('.loading .fa').setAttribute('style', 'font-size: 70px;');
    domElement.querySelector('.loading .error-message').innerHTML = 'No hay indicadores definidos para este gráfico.';
  }
}

function inyectValueToUrl(_url, _value) {
  return _url.replace("{serie_id}", _value);
}

function downloadFilesToChart(_chart) {
  var _jQuery,
      _arguments = arguments;

  var promises = [],
      url_ext,
      url_loc;

  _chart.indicators.forEach(function (_indicator) {

    if (!STORAGE[_indicator.id]) {

      url_ext = inyectValueToUrl(STORAGE.params.path_files, _indicator.id), url_loc = './public/data/series/' + _indicator.id + '.json';

      promises.push(downloadFile({
        local: url_loc,
        external: url_ext
      }, _indicator.id));
    }
  });

  promises = (_jQuery = jQuery).when.apply(_jQuery, _toConsumableArray(promises));

  promises.catch(function () {
    var indicatorsError = [],
        indicators = _arguments['0'].indicators,
        chart = _arguments['0'].id;

    indicators = indicators.filter(function (_indicator) {
      return !STORAGE[_indicator.id];
    }).map(function (_indicator) {
      return _indicator.id;
    });

    var domElement = document.getElementById(chart);

    domElement.querySelector('.loading .fa').setAttribute('class', 'fa fa-exclamation');
    domElement.querySelector('.loading .fa').setAttribute('style', 'font-size: 70px;');
    domElement.querySelector('.loading .error-message').innerHTML = 'Uno o más indicadores no existen: ' + indicators;
  });

  promises.then(function () {
    injectChartData(_arguments['0']);
    renderChart(_arguments['0']);
  });
}
// Completa la tarjeta del grñafico con la metadata del indicador.
// (Update: 25.08.2017)
function injectChartData(_chart) {
  _chart.indicators.forEach(function (_indicator) {
    var component = makeDomElement('p', {}, ['div', {
      className: 'reference-round-line',
      style: {
        backgroundColor: _indicator.color
      }
    }], ['span', {
      innerHTML: _indicator.short_name
    }]);

    document.getElementById(_chart.id).querySelector('.references').appendChild(component);
  });
}

// Actualizado 18.08.2017 - Esta función genera un gráfico de lineas.

// Funciones complementarias /////////////////////////////////////////////////
function normalDatos(_data, _indicatorId) {
  var data_norm = _data.filter(function (d) {
    return d[1] !== null;
  }).map(function (d) {
    var object = {};
    object['date'] = moment(d[0]).zone('+00:00');
    object[_indicatorId] = roundNumber(d[1], 3);

    return object;
  });

  return data_norm;
}

function normalDatosLine(_data, _indicatorId) {
  var data_norm = _data
  // .filter((d) => (d[1] !== null))
  .map(function (d) {
    return {
      date: moment(d[0]).zone('+00:00'),
      value: d[1] !== null ? roundNumber(d[1], 3) : null
    };
  });

  return data_norm;
}

function processData(_chart) {
  var data = [],
      data_norm = void 0;

  _chart.indicators.forEach(function (_indicator) {

    data_norm = normalDatos(STORAGE[_indicator.id].data, _indicator.id);

    data_norm.forEach(function (row) {
      data.push(row);
    });
  });

  data = _.toArray(_.map(_.groupBy(data, function (row) {
    return row.date;
  }), function (row) {
    var _ref;

    return (_ref = _).extend.apply(_ref, _toConsumableArray(row));
  }));

  return data;
}

function processDataLines(_chart) {
  var data_norm = void 0,
      data = [];

  _chart.indicators.forEach(function (_indicator) {
    data_norm = normalDatosLine(STORAGE[_indicator.id].data, _indicator.id);
    data.push(data_norm);
  });

  return data;
}

function calcMinRangeX(_data) {
  return _.min(_.map(_data, function (row) {
    return row.date;
  }));
}

function calcMaxRangeX(_data) {
  return _.max(_.map(_data, function (row) {
    return row.date;
  }));
}

function calcMinRangeY(_data) {
  return _.min(_.map(_data, function (row) {
    return _.min(rowToValues(row));
  }));
}

function calcMaxRangeY(_data) {
  return _.max(_.map(_data, function (row) {
    return _.max(rowToValues(row));
  }));
}

function rowToValues(_row) {
  var result = _.values(_row);
  result.shift();

  return result;
}

function searchProximityPoint(_data, _date) {
  var distances = _data.map(function (v, k) {
    return [Math.pow(moment(v.date).zone('+00:00').diff(_date), 2), v.date];
  }); // [diff, date]
  distances.sort(function (a, b) {
    return a[0] - b[0];
  });

  return distances[0][1];
}

function getValuesToDate(_data, _date) {
  var values = d3.values(_data.filter(function (d) {
    return d.date === _date;
  })[0]);
  values.splice(0, 1);

  return values;
}

function updateTranslatePositionY(element) {
  return element.getAttribute('transform').split('(')[1].split(')')[0].split(',').map(function (v) {
    return parseFloat(v.trim());
  });
}

function orderAscPosition(a, b) {
  var aPosition = updateTranslatePositionY(a)[1],
      bPosition = updateTranslatePositionY(b)[1];

  if (aPosition < bPosition) {
    return 1;
  } else {
    return -1;
  }
}

function orderDescPosition(a, b) {
  var aPosition = updateTranslatePositionY(a)[1],
      bPosition = updateTranslatePositionY(b)[1];

  if (aPosition > bPosition) {
    return 1;
  } else {
    return -1;
  }
}

function tooltipsCollapse(_chart) {
  // se seleccionan todos los indicadores del gráfico
  var chartDom = window.document.querySelector('#' + _chart),
      indicatorsDom = $(chartDom).find('.tooltip-indicator'),
      elements_asc = [],
      elements_desc = [];

  indicatorsDom.each(function (_key, _indicator) {
    // se resetean las posiciones
    _indicator.querySelector('.boxText').setAttribute('transform', 'translate(0, 0)');
    // se crean listas ordenadas con los indicadores
    elements_asc.push(_indicator);
    elements_desc.push(_indicator);
  });
  // se ordenan lista de indicadores segun posición
  elements_asc.sort(orderDescPosition);
  elements_desc.sort(orderAscPosition);

  // se ordenan los indicadores ascendentemente
  var count = 0,
      force = 0;

  elements_asc.forEach(function (v, k) {
    if (k !== elements_asc.length - 1) {
      var start = elements_asc[k],
          startPosition = updateTranslatePositionY(start)[1],
          end = elements_asc[k + 1],
          endPosition = updateTranslatePositionY(end)[1],
          diff = endPosition - startPosition,
          minHeight = 30;

      if (diff - count < minHeight) {
        count += 30 - diff;
        elements_asc[k + 1].querySelector('.boxText').setAttribute('transform', 'translate(0, ' + count + ')');
      }
    }
  });

  elements_desc.forEach(function (v, k) {

    if (k !== elements_desc.length - 1) {

      var start = elements_desc[k],
          startAdd = start.querySelector('.boxText'),
          end = elements_desc[k + 1],
          endAdd = end.querySelector('.boxText'),
          startPosition = updateTranslatePositionY(start)[1] + updateTranslatePositionY(startAdd)[1],
          endPosition = updateTranslatePositionY(end)[1] + updateTranslatePositionY(endAdd)[1],
          diff = startPosition - endPosition,
          minHeight = 30,
          minPosY = 0,
          transform = void 0,
          maxPosY = document.querySelector('#' + _chart + ' .tooltip-rect-space').getBoundingClientRect().height - minPosY;

      // Si el último elemento se paso del limite, se define force con esa medida
      if (k === 0 && startPosition > maxPosY) {
        force = startPosition - maxPosY;

        transform = updateTranslatePositionY(startAdd); // se trae la posición.
        transform[1] -= force; // se le resta la posición

        startAdd.setAttribute('transform', 'translate(' + transform[0] + ', ' + transform[1] + ')');
        startPosition = updateTranslatePositionY(start)[1] + updateTranslatePositionY(startAdd)[1];
      }

      if (diff <= minHeight) {
        transform = updateTranslatePositionY(endAdd); // se trae la posición.
        transform[1] -= force; // se le resta la posición
        endAdd.setAttribute('transform', 'translate(' + transform[0] + ', ' + transform[1] + ')');
      }
    }
  });
}

// Función principal /////////////////////////////////////////////////////////
function renderChart(_chart) {

  var container, data, data_lines, data_chart, data_range, totalWidth, chartWidth, rangeWidth, chartHeight, rangeHeight, chartMargin, rangeMargin, chartScaleX, rangeScaleX, chartScaleY, rangeScaleY, chartAxisX, rangeAxisX, chartAxisY, rangeAxisY, brush, minDate, maxDate, laps, minValue, maxValue, totalHeight, chartLine, rangeLine, svg, defs, background, chartContainer, chartLines, rangeContainer, rangeLines, startBrush, endBrush, tooltipLine, tooltipIndicator, boxText, tooltipDate;

  container = STORAGE.charts[_chart.id].container;
  var el = container.querySelector('.loading');
  el.parentNode.removeChild(el);

  ////////////////////////////////////////////////////////////////////////////
  // Render LineChart
  ////////////////////////////////////////////////////////////////////////////

  // Procesamiento de los datos //////////////////////////////////////////////
  data = processData(_chart);
  data_chart = STORAGE.charts[_chart.id]['data_chart'] = $.extend(true, [], data);
  data_range = STORAGE.charts[_chart.id]['data_range'] = $.extend(true, [], data);
  data = processDataLines(_chart);
  data_lines = STORAGE.charts[_chart.id]['data_lines'] = $.extend(true, [], data);
  laps = data_chart.length - _chart.laps >= 0 ? _chart.laps : data_chart.length;
  data_range = data_range.splice(0, laps);

  // Definición de los parámetros de configuración ///////////////////////////
  totalHeight = 410;
  chartMargin = {
    top: 0,
    right: 50,
    bottom: 112,
    left: 90
  };
  rangeMargin = {
    top: 350,
    right: 50,
    bottom: 20,
    left: 90
  };
  totalWidth = container.getBoundingClientRect().width;
  minDate = calcMinRangeX(data_chart);
  maxDate = calcMaxRangeX(data_chart);
  minValue = calcMinRangeY(data_chart);
  maxValue = calcMaxRangeY(data_chart);

  // Generación de parámetros para el gráfico ////////////////////////////////
  chartWidth = totalWidth - chartMargin.left - chartMargin.right;
  chartHeight = totalHeight - chartMargin.top - chartMargin.bottom;

  chartScaleX = d3.scaleTime().range([0, chartWidth]).domain(d3.extent(data_lines[0], function (d) {
    return d.date;
  }));
  chartScaleY = d3.scaleLinear().range([chartHeight, 0]).domain([minValue, maxValue]);
  chartAxisX = d3.axisBottom(chartScaleX).ticks(3).tickFormat(function (d) {
    return parseFormatDate(_chart.frequency, d, true);
  });
  chartAxisY = d3.axisLeft(chartScaleY).tickFormat(formatNumberD3);

  // Generación de parámetros para el rango //////////////////////////////////
  rangeWidth = totalWidth - rangeMargin.left - rangeMargin.right;
  rangeHeight = totalHeight - rangeMargin.top - rangeMargin.bottom;
  rangeScaleX = d3.scaleTime().range([0, rangeWidth]).domain(chartScaleX.domain());
  rangeScaleY = d3.scaleLinear().range([rangeHeight, 0]).domain(chartScaleY.domain());
  rangeAxisX = d3.axisBottom(rangeScaleX).tickValues([moment(minDate).zone('+00:00'), moment(maxDate).zone('+00:00')]).tickFormat(function (d) {
    return parseFormatDate(_chart.frequency, d, true);
  });
  rangeAxisY = d3.axisLeft(rangeScaleY);

  // Se define brush /////////////////////////////////////////////////////////
  brush = d3.brushX().extent([[0, 0], [rangeWidth, rangeHeight]]).on('brush', brushed);

  // Se define el tipo de línea  /////////////////////////////////////////////
  chartLine = d3.line().curve(d3.curveMonotoneX).x(function (d) {
    return chartScaleX(d.date);
  }).y(function (d) {
    return chartScaleY(d.value);
  }).defined(function (d) {
    return d.value != null;
  });
  rangeLine = d3.line().curve(d3.curveMonotoneX).x(function (d) {
    return rangeScaleX(d.date);
  }).y(function (d) {
    return rangeScaleY(d.value);
  }).defined(function (d) {
    return d.value != null;
  });

  // Se define svg ///////////////////////////////////////////////////////////
  svg = d3.select('#' + _chart.id + ' .chart-svg').append('svg').attr('width', chartWidth + chartMargin.left + chartMargin.right).attr('height', chartHeight + chartMargin.top + chartMargin.bottom);
  defs = svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('width', chartWidth).attr('height', chartHeight);
  background = svg.append('rect').attr('class', 'chart-background').attr('width', chartWidth + chartMargin.left + chartMargin.right).attr('height', chartHeight + chartMargin.top + 30);

  STORAGE.charts[_chart.id]['svg'] = svg;

  // se crea contenedor del gráfico //////////////////////////////////////////
  chartContainer = svg.append('g').attr('class', 'chart-container').attr('transform', 'translate(' + chartMargin.left + ', ' + chartMargin.top + ')');

  chartContainer.append('g').attr('class', 'chart-line-0').append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', chartScaleY(0)).attr('y2', chartScaleY(0)).attr('clip-path', 'url(#clip)');

  chartContainer.append('g').attr('class', 'chart-axis-x').attr('transform', 'translate(0, ' + chartHeight + ')').call(chartAxisX);

  chartContainer.append('g').attr('class', 'chart-axis-y').call(chartAxisY);

  chartLines = chartContainer.selectAll('.chart-line').data(data_lines).enter().append('g').attr('class', 'chart-line');

  chartLines.append('path').attr('id', function (d, i) {
    return _chart.id + '&&' + i;
  }).attr('stroke-dasharray', function (d, i) {
    return parseTypeLine(_chart.indicators[i].type);
  }).attr('d', chartLine).style('stroke', function (d, i) {
    return _chart.indicators[i].color;
  }).attr('clip-path', 'url(#clip)');

  // se crea contenedor del rango ////////////////////////////////////////////
  rangeContainer = svg.append('g').attr('class', 'range-container').attr('transform', 'translate(' + rangeMargin.left + ', ' + rangeMargin.top + ')');
  rangeContainer.append('g').attr('class', 'range-axis-x').attr('transform', 'translate(0, ' + rangeHeight + ')').call(rangeAxisX);
  startBrush = rangeContainer.append('g').attr('class', 'start-brush-date').attr('text-anchor', 'end').attr('transform', function () {
    return 'translate(' + rangeScaleX(data_range[0].date) + ', ' + (rangeHeight + 17.5) + ')';
  });
  startBrush.append('rect').attr('height', '20px').attr('transform', 'translate(0, -15)').attr('fill', 'white');
  startBrush.append('text');
  endBrush = rangeContainer.append('g').attr('class', 'end-brush-date').attr('text-anchor', 'start').attr('transform', 'translate(' + chartWidth + ', ' + (rangeHeight + 15) + ')');
  endBrush.append('rect').attr('height', '20px').attr('transform', 'translate(-7.5, -15)').attr('fill', 'white');
  endBrush.append('text');
  rangeLines = rangeContainer.selectAll('.range-line').data(data_lines).enter().append('g').attr('class', 'range-line');
  rangeLines.append('path').attr('d', function (d) {
    return rangeLine(d);
  }).style('stroke', function (d, i) {
    return _chart.indicators[i].color;
  });
  rangeContainer.append('g').attr('class', 'range-brush').call(brush).call(brush.move, [rangeScaleX(data_range[data_range.length - 1].date), chartWidth]);
  // se crea tooltip /////////////////////////////////////////////////////////
  var activeChart = STORAGE.cards.filter(function (_v) {
    return _v.id === STORAGE.activeCard;
  })[0].charts.filter(function (_v) {
    return _v.id === _chart.id;
  })[0].indicators;

  tooltipLine = svg.append('g').attr('class', 'chart-tooltip').attr('transform', 'translate(' + chartMargin.left + ', ' + chartMargin.top + ')');
  tooltipLine.append('path').attr('class', 'tooltip-line').style('opacity', 0);
  tooltipDate = tooltipLine.append('g').attr('class', 'tooltip-date').attr('height', '18px').attr('opacity', 0);
  tooltipDate.append('rect');
  tooltipDate.append('text');
  tooltipIndicator = tooltipLine.selectAll('.tooltip-indicator').data(data_lines).enter().append('g').attr('id', function (d, i) {
    return _chart.id + '_' + activeChart[i].id;
  }).attr('class', 'tooltip-indicator').style('opacity', 0);
  tooltipIndicator.append('circle').attr('transform', 'translate(0, 2)').attr('r', 4).style('fill', function (d, i) {
    return _chart.indicators[i].color;
  });
  boxText = tooltipIndicator.append('g').attr('class', 'boxText');
  boxText.append('rect').attr('rx', 15).attr('ry', 15).attr('height', 25).style('fill', function (d, i) {
    return _chart.indicators[i].color;
  });
  boxText.append('text');

  tooltipLine.append('rect').attr('class', 'tooltip-rect-space').attr('width', chartWidth).attr('height', chartHeight).attr('pointer-events', 'all').on('mouseover', tooltipMouseOver).on('mouseout', tooltipMouseOut).on('mousemove', tooltipMouseMouve);

  function tooltipMouseOver() {
    var element = d3.select(this.parentNode);
    element.select('.tooltip-line').transition().style('opacity', '1');
    element.selectAll('.tooltip-indicator').transition().style('opacity', '1');
    element.selectAll('.tooltip-date').transition().style('opacity', '1');
  }

  function tooltipMouseOut() {
    var element = d3.select(this.parentNode);
    element.select('.tooltip-line').transition().style('opacity', 0);
    element.selectAll('.tooltip-indicator').transition().style('opacity', 0);
    element.selectAll('.tooltip-date').transition().style('opacity', 0);
  }

  function tooltipMouseMouve() {
    var _this = this;

    var data = {
      date: {},
      values: []
    },
        tooltipDom,
        mousePosition,
        mouseDate,
        width;

    tooltipDom = d3.select(this.parentNode);
    mousePosition = d3.mouse(this);
    mouseDate = moment(chartScaleX.invert(mousePosition[0])).zone('+00:00');
    width = d3.select('.tooltip-rect-space').attr('width');

    data.date['calendar'] = searchProximityPoint(STORAGE.charts[_chart.id].data_chart, mouseDate);
    data.date['position'] = chartScaleX(data.date.calendar);
    data.values = getValuesToDate(STORAGE.charts[_chart.id].data_chart, data.date.calendar);

    var activeChart = STORAGE.cards.filter(function (_v) {
      return _v.id === STORAGE.activeCard;
    })[0].charts.filter(function (_v) {
      return _v.id === _chart.id;
    })[0].indicators;

    tooltipDom.select('.tooltip-line').attr('d', 'M ' + data.date.position + ', 0 V ' + chartHeight);
    tooltipDom.selectAll('.tooltip-indicator').attr('transform', function (d, i) {
      var value = STORAGE[activeChart[i].id].data.filter(function (_v) {
        return moment(_v[0]).zone('+00:00').toString() === moment(data.date.calendar).zone('+00:00').toString();
      });

      if (value[0]) {
        if (typeof value[0][1] === 'number') {
          return 'translate(' + data.date.position + ', ' + chartScaleY(value[0][1]) + ')';
        } else {
          return 'translate(-9999, -9999)';
        }
      } else {
        return 'translate(-9999, -9999)';
      }
      // return (typeof data.values[i] === 'number')?(`translate(${ data.date.position }, ${ chartScaleY(data.values[i]) })`):('translate(-9999, -9999)');
    }).select('text').text(function (d, i) {
      var value = STORAGE[activeChart[i].id].data.filter(function (_v) {
        return moment(_v[0]).zone('+00:00').toString() === moment(data.date.calendar).zone('+00:00').toString();
      });

      if (value[0]) {
        return formatNumberD3(value[0][1]) + ' - ' + activeChart[i].short_name;
      } else {
        return '';
      }
    })
    // .select('text').text((d, i) => `${ formatNumberD3(data.values[i]) } - ${ i }`)
    .attr('text-anchor', data.date.position < width / 2 ? 'start' : 'end').attr('transform', data.date.position < width / 2 ? 'translate(25, 7)' : 'translate(-25, 7)');
    tooltipDom.selectAll('.tooltip-indicator rect').attr('width', function (d, i) {
      return _this.parentNode.querySelectorAll('.tooltip-indicator text')[i].getBBox().width + 30;
    }).attr('y', -10).attr('x', function (d, i) {
      return data.date.position < width / 2 ? 10 : -(10 + _this.parentNode.querySelectorAll('.tooltip-indicator text')[i].getBBox().width + 30);
    });
    tooltipDom.select('.tooltip-date').attr('transform', 'translate(' + data.date.position + ', ' + (chartHeight + 5) + ')');

    tooltipDom.select('.tooltip-date text').text(parseFormatDate(_chart.frequency, data.date.calendar, true));
    tooltipDom.select('.tooltip-date rect').attr('height', '18px').attr('width', this.parentNode.querySelector('.tooltip-date text').getBBox().width + 30 + 'px').attr('transform', 'translate(-' + (this.parentNode.querySelector('.tooltip-date text').getBBox().width + 30) / 2 + ', -1)');

    tooltipsCollapse(_chart.id);
  }

  function brushed() {
    var position = void 0,
        range = void 0,
        min = void 0,
        max = void 0,
        minExt = void 0,
        maxExt = void 0,
        dataFiltered = void 0;

    if (d3.event.selection) {
      position = d3.event.selection;
      range = position.map(rangeScaleX.invert, rangeScaleX);

      // Se actualiza rango-x
      chartScaleX.domain(range);

      // Se actualizan fecha mínima y máxima del eje x en rangeContainer
      var _startBrush = d3.select(this.parentNode).select('.start-brush-date').attr('transform', 'translate(' + position[0] + ', ' + (rangeHeight + 17.5) + ')');

      _startBrush.select('.start-brush-date text').text(parseFormatDate(_chart.frequency, range[0], true));

      var widthStartBrush = this.parentNode.querySelector('.start-brush-date text').getBBox().width;

      _startBrush.select('.start-brush-date rect').attr('width', widthStartBrush + 15).attr('x', -((widthStartBrush + 15) / 2) - widthStartBrush / 2);

      var _endBrush = d3.select(this.parentNode).select('.end-brush-date').attr('transform', 'translate(' + position[1] + ', ' + (rangeHeight + 15) + ')');

      _endBrush.select('.end-brush-date text').text(parseFormatDate(_chart.frequency, range[1], true));

      var widthEndBrush = this.parentNode.querySelector('.end-brush-date text').getBBox().width;

      _endBrush.select('.end-brush-date rect').attr('width', widthEndBrush + 15);

      // Se actualizan fecha mínima y máxima del eje x en rangeContainer
      dataFiltered = $.extend(true, [], STORAGE.charts[_chart.id]['data_chart']);
      dataFiltered = data_range.filter(function (d) {
        return d.date < range[1] && d.date > range[0];
      });
      STORAGE.charts[_chart.id].data_range = dataFiltered;

      // Si el switch esta en on, hace algo, sino, hace otra cosa.
      // if (this.parentNode.parentNode.parentNode.parentNode.querySelector('.rangeButton-button').getAttribute('state') === 'on') {
      //   if (dataFiltered.length > 1) {
      //
      //     // Se actualiza rango-y
      //     chartScaleY.domain(generateRangeYDinamic(_chart.id));
      //
      //     chartContainer.select('.chart-line-0 line').attr('y1', chartScaleY(0)).attr('y2', chartScaleY(0));
      //   }
      // }

      chartContainer.selectAll('.chart-line path').attr('d', chartLine);
      // chartContainer.selectAll('.chart-dots circle').attr('cx', (d) => chartScaleX(d.date)).attr('cy', (d) => chartScaleY(d.value));
      chartContainer.select('.chart-axis-x').call(chartAxisX);
      chartContainer.select('.chart-axis-y').call(chartAxisY);
    }
  }

  function redraw() {
    var charts = void 0;

    // se actualiza ancho total
    totalWidth = container.getBoundingClientRect().width;
    // se actualiza ancho del gráfico
    chartWidth = totalWidth - chartMargin.left - chartMargin.right;
    // se actualiza ancho del rango
    rangeWidth = totalWidth - rangeMargin.left - rangeMargin.right;
    // se actualiza escala en x del gráfico
    chartScaleX = d3.scaleTime().range([0, chartWidth]).domain(d3.extent(data_lines[0], function (d) {
      return d.date;
    }));
    // se actualiza escala en x del rango
    rangeScaleX.range([0, rangeWidth]);
    // se actualiza brush component
    brush.extent([[0, 0], [rangeWidth, rangeHeight]]);
    // se actualiza el ancho de todos los gráficos
    charts = d3.select(container).select('.chart-svg svg');
    charts.attr('width', chartWidth + chartMargin.left + chartMargin.right);
    // se actualiza el ancho de todos los defs
    charts.select('defs rect').attr('width', chartWidth);
    // se actualiza el ancho de todos los background
    charts.select('.chart-background').attr('width', chartWidth + chartMargin.left + chartMargin.right);
    // se actualiza la posición del gráfico
    // charts.select('.chart-container').attr('transform', `translate(${ chartMargin.left }, ${ chartMargin.top })`);
    // se actualiza el ancho de la linea en la posición 0 del eje y
    charts.select('.chart-container').select('.chart-line-0 line').attr('x2', chartWidth);
    // se actualiza el ancho de la linea del gráfico
    charts.select('.chart-container').selectAll('.chart-line path').attr('d', chartLine).attr('d', chartLine);
    // se actualiza el ancho del axis en x del gráfico
    chartAxisX = d3.axisBottom(chartScaleX).ticks(3).tickFormat(function (d) {
      return parseFormatDate(_chart.frequency, d, true);
    });
    charts.select('.chart-container').select('.chart-axis-x').call(chartAxisX);
    // se actualiza la posición del rango
    // charts.select('.range-container').attr('transform', `translate(${ rangeMargin.left }, ${ rangeMargin.top })`);
    // se actualiza el ancho de la linea del rango
    charts.select('.range-container').selectAll('.range-line path').attr('d', function (d) {
      return rangeLine(d);
    });
    // se actualiza el ancho del axis en x del rango
    charts.select('.range-container').select('.range-axis-x').call(rangeAxisX);
    // se actualiza la posición de la fecha inicial seleccionada en el rango
    charts.select('.range-container').select('.start-brush-date').attr('transform', 'translate(' + rangeScaleX(data_range[0].date) + ', ' + (rangeHeight + 17.5) + ')');
    // se actualiza la posición de la fecha final seleccionada en el rango
    charts.select('.range-container').select('.end-brush-date').attr('transform', 'translate(' + chartWidth + ', ' + (rangeHeight + 15) + ')');
    // se actualiza el ancho del brush
    // charts.select('.range-container').select('.range-brush').call(brushed);

    charts.select('.tooltip-rect-space').attr('width', chartWidth);
  }

  // function changeSwitchPosition(activeButton, id) {
  //   let container = activeButton.parentNode,
  //       state = container.getAttribute('state');
  //
  //   if (state === 'on') {
  //     container.querySelectorAll('button')[0].setAttribute('state', 'active');
  //     container.querySelectorAll('button')[1].setAttribute('state', '');
  //     container.querySelector('.switch-effect').setAttribute('style', 'left: 2px;');
  //     container.setAttribute('state', 'off');
  //
  //     updateAxisY(generateRangeYStatic(id.getAttribute('id')), id.getAttribute('id'));
  //   } else {
  //     container.querySelectorAll('button')[0].setAttribute('state', '');
  //     container.querySelectorAll('button')[1].setAttribute('state', 'active');
  //     container.querySelector('.switch-effect').setAttribute('style', 'left: calc(50% - 2px);');
  //     container.setAttribute('state', 'on');
  //
  //     updateAxisY(generateRangeYDinamic(id.getAttribute('id')), id.getAttribute('id'));
  //   }
  // }
  // window.changeSwitchPosition = changeSwitchPosition;

  // function updateAxisY(domain, id) {
  //
  //   chartScaleY.domain(domain);
  //   chartLine = d3.line().curve(d3.curveMonotoneX).x((d) => chartScaleX(d.date)).y((d) => chartScaleY(d.value));
  //
  //   d3.select(`#${ id }`).select('.chart-line-0 line').attr('y1', chartScaleY(0)).attr('y2', chartScaleY(0));
  //   d3.select(`#${ id }`).select('.chart-axis-y').call(chartAxisY);
  //   d3.select(`#${ id }`).selectAll('.chart-line path').attr('d', chartLine);
  // }

  // function generateRangeYStatic(chart_id) {
  //   let minValue = calcMinRangeY(STORAGE.charts[chart_id].data_chart),
  //       maxValue = calcMaxRangeY(STORAGE.charts[chart_id].data_chart);
  //
  //   return [minValue, maxValue];
  // }
  // function generateRangeYDinamic(chart_id) {
  //   let minValue = calcMinRangeY(STORAGE.charts[chart_id].data_range),
  //       maxValue = calcMaxRangeY(STORAGE.charts[chart_id].data_range);
  //
  //   return [minValue, maxValue];
  // }

  window.addEventListener('resize', redraw);
}

function isArray(a) {
  return Object.prototype.toString.call(a) === '[object Array]';
}

function makeDomElement(desc) {
  if (!isArray(desc)) {
    return makeDomElement.call(this, Array.prototype.slice.call(arguments));
  }

  var name = desc[0],
      attributes = desc[1],
      start = 1,
      el = document.createElement(name);

  if ((typeof attributes === 'undefined' ? 'undefined' : _typeof(attributes)) === 'object' && attributes !== null && !isArray(attributes)) {

    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        switch (attr) {
          case 'style':
            for (var style in attributes[attr]) {
              if (attributes[attr].hasOwnProperty(style)) {
                el.style[style] = attributes[attr][style];
              }
            }
            break;
          default:
            el[attr] = attributes[attr];
            break;
        }
      }
    }

    start = 2;
  }

  for (var i = start; i < desc.length; i++) {
    if (isArray(desc[i])) {
      el.appendChild(makeDomElement(desc[i]));
    } else {
      el.appendChild(document.createTextNode(desc[i]));
    }
  }

  return el;
}

////////////////////////////////////////////////////////////////////////////////

function requestDatasets() {
  var download = downloadFile({
    local: STORAGE.params.path_datasets
  }, 'datasets');

  download.then(addMetadata);
}

function addMetadata() {
  var data = STORAGE.datasets;

  data.forEach(function (_dataset) {
    downloadFile({
      local: _dataset.catalog_url
    }, _dataset.dataset_identifier).then(function () {
      return renderDataset(_dataset);
    });
  });
}

function getDataset(_id) {
  return STORAGE[_id].dataset.filter(function (_item) {
    return _item.identifier === _id;
  })[0];
}

function getDistributions(_distributions, _data) {
  var distributions = [];

  _distributions.map(function (_distribution) {
    var result = null;

    _data.forEach(function (_dataDist) {
      if (_dataDist.identifier === _distribution.identifier || _dataDist.title === _distribution.title) {
        distributions.push(_dataDist);
      }
    });
  });

  return distributions;
}

function renderDataset(_params) {
  var dataset = getDataset(_params.dataset_identifier);
  var distributions = getDistributions(_params.distribution, dataset.distribution);
  var elementDom = [];

  distributions.forEach(function (_dist, k) {
    var endSpacing;

    if (k === distributions.length - 1) {
      endSpacing = ['div', {
        className: 'break-line'
      }, ['br'], ['hr']];
    } else {
      endSpacing = ['div', {
        className: 'break-line'
      }, ['br'], ['hr'], ['br'], ['br']];
    }
    elementDom.push(['div', {
      className: 'max-width flex flex-justify-between flex-align-start distributionBlock'
    }, ['div', {
      className: 'flex flex-column flex-align-start flex-wrap max-width'
    }, ['h3', {
      innerHTML: _dist.title
    }], ['div', {
      className: 'break-line'
    }, ['br']], ['p', {
      innerHTML: _dist.description ? _dist.description : ''
    }]], ['a', {
      href: _dist.downloadURL,
      download: ''
    }, ['button', {
      className: 'button',
      download: ''
    }, ['span', {
      className: 'button-waves',
      innerHTML: 'Descargar'
    }]]]], endSpacing);
  });

  var metaDataComponent = makeDomElement('div', {}, ['h2', {
    innerHTML: '<a class="link" href="' + _params.dataset_landingPage + '" target="_blank">' + dataset.title + '</a>'
  }], ['div', {
    className: 'break-line'
  }, ['br']], ['p', {
    innerHTML: dataset.description
  }], ['div', {
    className: 'break-line'
  }, ['br'], ['br']], ['h2', {
    innerHTML: 'Recursos del dataset'
  }], ['div', {
    className: 'break-line'
  }, ['br'], ['hr'], ['br'], ['br']], ['div', {
    className: 'flex flex-column'
  }].concat(elementDom));

  $('#metaData').append(metaDataComponent);
}

function changeView(_nameView, _cardId) {
  var container_charts = $("#chartsContainer"),
      container_cards = $("#cardsContainer"),
      container_metaData = $("#metaDataContainer");

  $('html, body').scrollTop(0);

  if (_nameView === 'chartsContainer') {
    STORAGE.activeCard = _cardId;
    container_charts.show();
    container_cards.hide();
    container_metaData.hide();
  } else {
    container_charts.fadeOut(250);
    container_cards.show();
    container_metaData.show();
  }
}

function injectCardData(_card) {
  var data = STORAGE[_card.id].data,
      metadata = STORAGE[_card.id].meta,
      cardComponent = $(document.getElementById(metadata[1]['field']['id']));

  cardComponent.find('.frequency')[0].innerHTML = parseFormatDate(metadata[0]['frequency'], data[0][0], true);
  cardComponent.find('.units_representation')[0].innerHTML = parseValueIndicator(_card.units_representation, data[0][1]);
  cardComponent.find('.units')[0].innerHTML = metadata[1]['field']['units'];
  cardComponent.find('.human_frecuency')[0].innerHTML = parseHumanFrecuency(metadata[0]['frequency'], _card.laps);
  cardComponent.find('.loading').remove();

  renderMiniChart(_card, cardComponent.find('.mini-chart'));
}

function renderMiniChart(_cardData, _element) {
  var data = void 0,
      container = void 0,
      margin = void 0,
      width = void 0,
      height = void 0,
      minValue = void 0,
      maxValue = void 0,
      chartWidth = void 0,
      chartHeight = void 0,
      scaleX = void 0,
      scaleY = void 0,
      line = void 0,
      svg = void 0,
      chartContainer = void 0;

  ////////////////////////////////////////////////////////////////////////////
  // Render Mini-LineChart
  ////////////////////////////////////////////////////////////////////////////

  // Procesamiento de los datos //////////////////////////////////////////////
  data = STORAGE[_cardData.id].data;
  data = data.filter(function (d) {
    return d[1] !== null;
  }).slice(0, parseInt(_cardData.laps <= data.length ? _cardData.laps : data.length)).map(function (d) {
    return {
      date: moment(d[0]).zone('+00:00'),
      value: roundNumber(d[1], 3)
    };
  });

  // Definición de los parámetros de configuración ///////////////////////////
  container = d3.select(_element[0]);
  margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };
  width = 100;
  height = 50;

  // Generación de parámetros para el gráfico ////////////////////////////////
  minValue = d3.min(data, function (d) {
    return d.value;
  });
  maxValue = d3.max(data, function (d) {
    return d.value;
  });
  chartWidth = width - margin.left - margin.right;
  chartHeight = height - margin.top - margin.bottom;
  scaleX = d3.scaleTime().range([0, chartWidth]).domain(d3.extent(data, function (d) {
    return d.date;
  }));
  scaleY = d3.scaleLinear().range([chartHeight, 0]).domain([minValue, maxValue]);

  // Se define el tipo de línea  /////////////////////////////////////////////
  line = d3.line().curve(d3.curveMonotoneX).x(function (d) {
    return scaleX(d.date);
  }).y(function (d) {
    return scaleY(d.value);
  });

  // Se define svg ///////////////////////////////////////////////////////////
  svg = container.append('svg').attr('width', chartWidth + margin.left + margin.right).attr('height', chartHeight + margin.top + margin.bottom);

  // se crea contenedor del gráfico //////////////////////////////////////////
  chartContainer = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

  // se genera gráfico ///////////////////////////////////////////////////////
  chartContainer.append('path').attr('stroke-width', 3).style('stroke', 'silver').style('fill', 'none').attr('d', function (d) {
    return line(data);
  });
  chartContainer.append('circle').style('fill', STORAGE.colors.gobar_dark).attr('r', 4).attr('cx', function (d) {
    return scaleX(data[0].date);
  }).attr('cy', function (d) {
    return scaleY(data[0].value);
  });
}

////////////////////////////////////////////////////////////////////////////////

function renderCardComponent(_card) {
  var _arguments2 = arguments;

  var button = void 0;

  if (_card.button.text !== '' && _card.button.urll !== '') {
    button = ['button', {
      className: 'button',
      onclick: function onclick() {
        window.open(_card.button.url, '_blank');
      }
    }, ['span', {
      className: 'button-waves',
      innerHTML: _card.button.text
    }]];
  } else {
    button = ['button', {
      className: 'button',
      onclick: function onclick() {
        changeView('chartsContainer', _card.id);
        requestAllCharts(_card.id);
      }
    }, ['span', {
      className: 'button-waves',
      innerHTML: 'Ver más gráficos'
    }]];
  }

  var cardComponent = makeDomElement('div', { id: _card.id, className: 'card' }, ['h3', { innerHTML: _card.title }], ['div', { className: 'break-line' }, ['div', { className: 'br' }], ['div', { className: 'br' }], ['hr'], ['div', { className: 'br' }], ['div', { className: 'br' }]], ['h4', { innerHTML: _card.short_name }], ['div', { className: 'break-line' }, ['div', { className: 'br' }]], ['p', { className: 'frequency' }], ['div', { className: 'break-line' }, ['div', { className: 'br' }], ['div', { className: 'br' }]], ['p', { className: 'units_representation' }], ['div', { className: 'break-line' }, ['div', { className: 'br' }]], ['p', { className: 'units' }], ['div', { className: 'break-line' }, ['div', { className: 'br' }]], ['div', { className: 'mini-chart' }], ['div', { className: 'break-line' }, ['div', { className: 'br' }]], ['p', { className: 'human_frecuency' }], ['div', { className: 'break-line' }, ['div', { className: 'br' }], ['div', { className: 'br' }]], button, ['div', { className: 'break-line' }, ['div', { className: 'br' }]], ['a', { href: _card.download_url, className: 'link', download: '', innerHTML: '<i class="fa fa-download" aria-hidden="true"></i>&nbsp;Descargar datos' }]);

  cardComponent.appendChild(addLoading());
  document.querySelector('#cardsContainer #cards').appendChild(cardComponent);

  var url_ext = inyectValueToUrl(STORAGE.params.path_files, _card.id),
      url_loc = './public/data/series/' + _card.id + '.json';

  var promesa = downloadFile({
    local: url_loc,
    external: url_ext
  }, _card.id);
  promesa.catch(function (error) {
    var indicatorError = _arguments2['0'],
        domElement = document.getElementById(indicatorError.id);

    domElement.querySelector('.loading .fa').setAttribute('class', 'fa fa-exclamation');
    domElement.querySelector('.loading .fa').setAttribute('style', 'font-size: 70px;');
    domElement.querySelector('.loading .error-message').innerHTML = 'El indicador ' + indicatorError.id + ' no existe.';
  });
  promesa.then(function (values) {
    injectCardData(_card);
  });
}

function renderNormalMode() {
  STORAGE.cards.forEach(function (_card) {
    renderCardComponent(_card);
  });
}

function renderIframeMode() {
  var app = void 0,
      cards = void 0,
      credits = void 0,
      charts = void 0;

  app = $('#app');
  app.attr('class', 'flex flex-column flex-align-end');

  cards = $('#cardsContainer');
  cards.remove();

  credits = window.document.createElement('span');
  credits.style.opacity = '0.5';
  credits.style.margin = '0 10px 0 0';
  credits.innerHTML = 'Desarrollado por <a href="' + STORAGE.params.credits_url + '" class="link"> ' + STORAGE.params.credits + '</a>';

  charts = $('#chartsContainer');
  charts.addClass('flex flex-column flex-align-end');
  charts.css({ display: 'flex', position: 'relative' });
  charts.find('.back-link').remove();
  charts.find('#charts').addClass('max-width');
  charts.append(credits);
}

////////////////////////////////////////////////////////////////////////////////

function exist_param(_params, _param) {
  return _params.hasOwnProperty(_param);
}

function httpGetFormat(_search) {
  var args = _search.substring(1).split('&'),
      argsParsed = {},
      i,
      kvp,
      key,
      value;

  for (i = 0; i < args.length; i++) {
    if (args[i].indexOf('=') === -1) {
      argsParsed[decodeURIComponent(args[i]).trim()] = true;
    } else {
      kvp = args[i].split('=');
      key = decodeURIComponent(kvp[0]).trim();
      value = decodeURIComponent(kvp[1]).trim();
      argsParsed[key] = value;
    }
  }

  return argsParsed;
}

function httpGetParams() {
  var params_http = window.location.search,
      params_format = httpGetFormat(params_http);

  return params_format;
}

function filterIndicator(_cardId, _indicatorId) {
  var data = STORAGE.cards;
  data = data.filter(function (_card) {
    return _card.id === _cardId;
  });
  data = data[0].charts;
  data = data.filter(function (_chart) {
    return _chart.id === _indicatorId;
  });
  data = data[0];

  return data;
}

function downloadIndicators(_download, start_mode) {

  switch (start_mode) {
    case "normal":
      return _download.then(renderNormalMode).then(requestDatasets);
      break;
    case "iframe":
      var params = httpGetParams(),
          data = void 0;

      return _download.then(renderIframeMode).then(function () {
        return data = filterIndicator(params.indicator, params.chart);
      }).then(function () {
        return renderChartComponent(params.indicator, data);
      });
      break;
    default:
      return _download.then(renderNormalMode).then(requestDatasets);
  }
}

function defineModeApp() {
  var params = httpGetParams(),
      validation = exist_param(params, "indicator") && exist_param(params, "chart"),
      modeApp = "normal";

  if (validation) {
    modeApp = "iframe";
  }

  return modeApp;
};

function initApp() {
  var pathFile = { local: STORAGE.params.path_cards },
      download = downloadFile(pathFile, 'cards'),
      start_mode = defineModeApp();

  // console.info("La aplicación se inicio en modo: " + start_mode);
  downloadIndicators(download, start_mode);
}

function downloadFile(_path, _name) {

  return new Promise(function (resolve, error) {
    function saveDataAndCallSuccess(_data) {
      STORAGE[_name] = _data;
      resolve();
    }
    function tryLocal() {
      $.get(_path.local).then(saveDataAndCallSuccess).fail(error);
    }

    $.get(_path.external ? _path.external : _path.local).then(saveDataAndCallSuccess).fail(tryLocal);
  });
}

// Is Document Ready

$(function () {
  var pathFile = {
    local: "./public/data/params.json"
  };

  downloadFile(pathFile, 'params').then(initApp);
});