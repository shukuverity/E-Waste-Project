(function () {
    var chartRoot = document.getElementById('weekly-trend-graph');
    if (!chartRoot) {
        return;
    }

    var weekLabels = ['W1', 'W2', 'WE', 'W4', 'W5'];
    var chartValues = weekLabels.map(function (_, index) {
        return Math.floor(Math.random() * 31) + 50 + index;
    });

    var svgNamespace = 'http://www.w3.org/2000/svg';
    var chart = {
        width: 560,
        height: 210,
        paddingX: 26,
        paddingTop: 18,
        paddingBottom: 34
    };
    var drawableHeight = chart.height - chart.paddingTop - chart.paddingBottom;
    var stepX = (chart.width - chart.paddingX * 2) / (weekLabels.length - 1);

    function getPoint(value, index) {
        return {
            x: chart.paddingX + index * stepX,
            y: chart.paddingTop + (100 - value) / 100 * drawableHeight
        };
    }

    var points = chartValues.map(getPoint);
    var linePoints = points.map(function (point) {
        return point.x + ',' + point.y;
    });

    var svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + chart.width + ' ' + chart.height);
    svg.setAttribute('class', 'trend-line-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Weekly disposal trend line graph');

    var area = document.createElementNS(svgNamespace, 'polygon');
    area.setAttribute('class', 'trend-line-area');
    area.setAttribute(
        'points',
        linePoints.join(' ') +
            ' ' + (chart.width - chart.paddingX) + ',' + (chart.height - chart.paddingBottom) +
            ' ' + chart.paddingX + ',' + (chart.height - chart.paddingBottom)
    );
    svg.appendChild(area);

    var line = document.createElementNS(svgNamespace, 'polyline');
    line.setAttribute('class', 'trend-line-path');
    line.setAttribute('points', linePoints.join(' '));
    svg.appendChild(line);

    chartValues.forEach(function (value, index) {
        var pointData = points[index];

        var point = document.createElementNS(svgNamespace, 'circle');
        point.setAttribute('class', 'trend-point');
        point.setAttribute('cx', pointData.x);
        point.setAttribute('cy', pointData.y);
        point.setAttribute('r', 4.5);
        svg.appendChild(point);

        var valueText = document.createElementNS(svgNamespace, 'text');
        valueText.setAttribute('class', 'trend-point-value');
        valueText.setAttribute('x', pointData.x);
        valueText.setAttribute('y', pointData.y - 10);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.textContent = value + '%';
        svg.appendChild(valueText);
    });

    chartRoot.appendChild(svg);

    var xAxis = document.createElement('div');
    xAxis.className = 'trend-x-axis';
    weekLabels.forEach(function (label) {
        var xLabel = document.createElement('span');
        xLabel.className = 'trend-x-label';
        xLabel.textContent = label;
        xAxis.appendChild(xLabel);
    });
    chartRoot.appendChild(xAxis);
})();

(function () {
    var toggleBtn = document.getElementById('modules-toggle');
    var modulesMenu = document.getElementById('admin-modules-menu');
    if (!toggleBtn || !modulesMenu) {
        return;
    }

    toggleBtn.addEventListener('click', function () {
        var isOpen = modulesMenu.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (event) {
        if (!modulesMenu.classList.contains('open')) {
            return;
        }

        if (modulesMenu.contains(event.target) || toggleBtn.contains(event.target)) {
            return;
        }

        modulesMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
    });
})();
