const COLORS = { green: '#c6ff4d', gold: '#ffc857', blue: '#68d5ff', red: '#ff6c73', muted: '#8c9ba6', grid: '#263742', text: '#dfe7e8' };
const REGION_ORDER = ['World', 'India', 'China', 'United States', 'Nigeria', 'Brazil'];
let dataset = null;
let selectedCountry = 'World';
const baseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: COLORS.muted, size: 10 },
  margin: { l: 48, r: 15, t: 15, b: 38 },
  xaxis: { gridcolor: 'rgba(0,0,0,0)', zerolinecolor: COLORS.grid, linecolor: COLORS.grid, tickfont: {size: 9} },
  yaxis: { gridcolor: COLORS.grid, zerolinecolor: COLORS.grid, linecolor: COLORS.grid, tickfont: {size: 9}, automargin: true },
  showlegend: false,
  hoverlabel: { bgcolor: '#101923', bordercolor: '#c6ff4d', font: {color:'#fff'} }
};
const config = {responsive:true, displaylogo:false, modeBarButtonsToRemove:['lasso2d','select2d','autoScale2d']};
function layout(extra={}) { return {...baseLayout, ...extra}; }
function getRegions() {
  return REGION_ORDER.filter(name => dataset?.countries?.[name]);
}
function numericValue(value, fallback=0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function render(country) {
  const d = dataset.countries[country] || dataset.countries.World;
  selectedCountry = dataset.countries[country] ? country : 'World';
  const pop = d.population[d.population.length-1];
  const safePop = numericValue(pop);
  const urban = numericValue(d.urban);
  const migration = numericValue(d.migration);
  document.getElementById('populationMetric').textContent = (safePop >= 1 ? safePop.toFixed(2) : (safePop*1000).toFixed(0)) + (safePop >= 1 ? 'B' : 'M');
  document.getElementById('urbanMetric').textContent = urban + '%';
  document.getElementById('ageMetric').innerHTML = numericValue(d.median_age).toFixed(1) + ' <small>yrs</small>';
  document.getElementById('migrationMetric').textContent = (migration > 0 ? '+' : '') + migration.toFixed(1);
  Plotly.react('populationChart', [{
    x: dataset.years, y: d.population, type:'scatter', mode:'lines+markers',
    line:{color:COLORS.green,width:3,shape:'spline'}, marker:{color:COLORS.green,size:5},
    fill:'tozeroy', fillcolor:'rgba(198,255,77,.08)', hovertemplate:'Year %{x}<br>Population %{y:.3f}B<extra></extra>'
  }], layout({yaxis:{...baseLayout.yaxis,title:{text:'Population (billions)',font:{size:9}},rangemode:'tozero'}, xaxis:{...baseLayout.xaxis,dtick:4}}), config);
  const ageValues = dataset.age_shares[country];
  Plotly.react('ageChart', [{
    type:'pie', labels:dataset.age_labels, values:ageValues, hole:.66,
    marker:{colors:[COLORS.green,COLORS.gold,COLORS.blue,'#b28cff',COLORS.red],line:{color:'#101923',width:3}},
    textinfo:'percent', textfont:{color:'#081018',size:10}, hovertemplate:'Age %{label}<br>%{value}%<extra></extra>'
  }], layout({margin:{l:5,r:5,t:5,b:10},showlegend:true,legend:{orientation:'h',y:-.1,x:.05,font:{size:9,color:COLORS.muted}}}), config);
  const regions = getRegions();
  const migrationValues = regions.map(n=>numericValue(dataset.countries[n].migration));
  const migrationExtent = Math.max(1, ...migrationValues.map(value=>Math.abs(value))) * 1.2;
  Plotly.react('migrationChart', [{
    x:migrationValues, y:regions, type:'bar', orientation:'h',
    marker:{color:regions.map(n=>n===selectedCountry?COLORS.green:(numericValue(dataset.countries[n].migration)>=0?COLORS.blue:COLORS.red))},
    text:migrationValues.map(value=>`${value > 0 ? '+' : ''}${value.toFixed(1)}`),
    textposition:'auto',
    insidetextanchor:'middle',
    textfont:{color:'#081018',size:11},
    cliponaxis:false,
    hovertemplate:'%{y}<br>Net migration: %{x:.1f} per 1,000<extra></extra>'
  }], layout({margin:{l:105,r:25,t:12,b:35},xaxis:{...baseLayout.xaxis,title:{text:'Net migration per 1,000 people',font:{size:9}},range:[-migrationExtent,migrationExtent],zeroline:true,zerolinecolor:'#f2f5ef',zerolinewidth:2,ticksuffix:' '},yaxis:{...baseLayout.yaxis,autorange:'reversed'}}), config);
  Plotly.react('urbanChart', [{
    x:regions.map(n=>numericValue(dataset.countries[n].urban)),
    y:regions,
    type:'bar', orientation:'h',
    marker:{color:regions.map(n=>n===selectedCountry?COLORS.green:'#2b5964')},
    hovertemplate:'%{y}<br>Urban population: %{x}%<extra></extra>'
  }], layout({margin:{l:105,r:25,t:8,b:30},xaxis:{...baseLayout.xaxis,range:[0,100],ticksuffix:'%'},yaxis:{...baseLayout.yaxis,autorange:'reversed'}}), config);
}
function regenerateAnalysis() {
  if (!dataset?.countries) return;
  const nextDataset = JSON.parse(JSON.stringify(dataset));
  getRegions().forEach(name => {
    const region = nextDataset.countries[name];
    const urbanBase = numericValue(region.urban);
    const migrationBase = numericValue(region.migration);
    region.urban = Math.max(0, Math.min(100, Math.round(urbanBase + (Math.random() - 0.5) * 6)));
    region.migration = Number((migrationBase + (Math.random() - 0.5) * 1.2).toFixed(1));
  });
  const button = document.getElementById('regenerateButton');
  button.disabled = true;
  button.textContent = 'REGENERATING...';
  fetch('/api/data', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(nextDataset)})
    .then(response => { if (!response.ok) throw new Error(`Save failed with status ${response.status}`); return response.json(); })
    .then(() => { dataset = nextDataset; render(selectedCountry); button.textContent = 'REGENERATE ANALYSIS'; })
    .catch(error => { console.error('Unable to regenerate dashboard data:', error); button.textContent = 'RETRY REGENERATION'; })
    .finally(() => { button.disabled = false; });
}
fetch('/api/data').then(response=>{
  if (!response.ok) {
    throw new Error(`Data request failed with status ${response.status}`);
  }
  return response.json();
}).then(data=>{
  dataset=data;
  const selector=document.getElementById('countrySelect');
  selector.innerHTML=Object.keys(data.countries).map(name=>`<option value="${name}">${name}</option>`).join('');
  selector.addEventListener('change',e=>render(e.target.value));
  render('World');
  document.getElementById('regenerateButton').addEventListener('click', regenerateAnalysis);
}).catch(error=>{
  // Opening index.html directly (file://) does not provide Flask's /api/data endpoint.
  // Keep the page styled and usable; start app.py to enable saved data and charts.
  console.error('Unable to load dashboard data:', error);
  document.querySelector('.hero-tag').textContent='DATA UNAVAILABLE · START FLASK FOR DATA';
});
document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const target=document.getElementById(btn.dataset.target);
  if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
}));
window.addEventListener('resize',()=>{if(dataset) ['populationChart','ageChart','migrationChart','urbanChart'].forEach(id=>Plotly.Plots.resize(id));});
