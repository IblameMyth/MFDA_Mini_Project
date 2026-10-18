const COLORS = { green: '#c6ff4d', gold: '#ffc857', blue: '#68d5ff', red: '#ff6c73', muted: '#8c9ba6', grid: '#263742', text: '#dfe7e8' };
const REGIONS = ['World', 'India', 'China', 'United States', 'Nigeria', 'Brazil'];
let dataset = null;
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
function render(country) {
  const d = dataset.countries[country];
  const pop = d.population[d.population.length-1];
  document.getElementById('populationMetric').textContent = (pop >= 1 ? pop.toFixed(2) : (pop*1000).toFixed(0)) + (pop >= 1 ? 'B' : 'M');
  document.getElementById('urbanMetric').textContent = d.urban + '%';
  document.getElementById('ageMetric').innerHTML = d.median_age.toFixed(1) + ' <small>yrs</small>';
  document.getElementById('migrationMetric').textContent = (d.migration > 0 ? '+' : '') + d.migration.toFixed(1);
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
  const migrationNames = REGIONS;
  Plotly.react('migrationChart', [{
    x:migrationNames, y:migrationNames.map(n=>dataset.countries[n].migration), type:'bar',
    marker:{color:migrationNames.map(n=>n===country?COLORS.green:(dataset.countries[n].migration>=0?COLORS.blue:COLORS.red))},
    hovertemplate:'%{x}<br>Net migration: %{y:.1f} per 1,000<extra></extra>'
  }], layout({margin:{l:35,r:8,t:12,b:65},xaxis:{...baseLayout.xaxis,tickangle:-28},yaxis:{...baseLayout.yaxis,title:{text:'Per 1,000 people',font:{size:9}},zeroline:true,zerolinecolor:'#71818b'}}), config);
  Plotly.react('urbanChart', [{
    x:REGIONS.map(n=>dataset.countries[n].urban),
    y:REGIONS,
    type:'bar', orientation:'h',
    marker:{color:REGIONS.map(n=>n===country?COLORS.green:'#2b5964')},
    hovertemplate:'%{y}<br>Urban population: %{x}%<extra></extra>'
  }], layout({margin:{l:105,r:25,t:8,b:30},xaxis:{...baseLayout.xaxis,range:[0,100],ticksuffix:'%'},yaxis:{...baseLayout.yaxis,autorange:'reversed'}}), config);
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
