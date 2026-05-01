import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let query = '';
let currentData = [];

function getSearchFiltered() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function applyFilters() {
  let filtered = getSearchFiltered();
  if (selectedIndex !== -1 && currentData[selectedIndex]) {
    filtered = filtered.filter(
      (p) => String(p.year) === String(currentData[selectedIndex].label),
    );
  }
  renderProjects(filtered, projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  currentData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(currentData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  d3.select('#projects-pie-plot').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  let svg = d3.select('#projects-pie-plot');
  newArcs.forEach((arc, idx) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg
          .selectAll('path')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, i) =>
            i === selectedIndex ? 'legend-item selected' : 'legend-item',
          );

        applyFilters();
      });
  });

  let legend = d3.select('.legend');
  currentData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let searchFiltered = getSearchFiltered();

  // Remember selected year before re-rendering
  let selectedYear = selectedIndex !== -1 ? currentData[selectedIndex]?.label : null;

  // Re-render pie chart with search filtered data
  renderPieChart(searchFiltered);

  // Re-select the same year if it still exists in new data
  if (selectedYear) {
    let newIdx = currentData.findIndex((d) => String(d.label) === String(selectedYear));
    selectedIndex = newIdx;
    d3.select('#projects-pie-plot')
      .selectAll('path')
      .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));
    d3.select('.legend')
      .selectAll('li')
      .attr('class', (_, i) =>
        i === selectedIndex ? 'legend-item selected' : 'legend-item',
      );
  }

  applyFilters();
});