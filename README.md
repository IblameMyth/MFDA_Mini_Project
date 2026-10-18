# World Population and Demographic Analysis

## 1. Problem statement

An international research organization wants to study population growth, age
distribution, migration patterns, and urbanization trends in different regions
and countries.

The purpose of this project is to create an interactive dashboard that:

- Shows how population changes over time.
- Displays the percentage of people in different age groups.
- Compares net migration between countries.
- Compares the percentage of people living in urban areas.
- Allows the user to select a country or region and update the dashboard.
- Presents the results as interactive charts instead of only text or tables.

The application uses Python with Flask for the server and API, JavaScript for
data processing and interactive charts, and JSON for storing the demographic
data.

This README explains the project code. It does not explain the HTML structure
or CSS styling.

---

## 2. Project files

| File | Purpose |
| --- | --- |
| `app.py` | Python Flask server and data API |
| `dashboard.js` | Loads data, calculates display values, and creates charts |
| `data.json` | Population and demographic data |
| `data.js` | Reserved for optional client-side data logic |
| `requirements.txt` | Python package requirements |
| `index.html` | Dashboard page that displays the results |
| `style.css` | Dashboard styling |

The main programming files used to implement the logic are `app.py`,
`dashboard.js`, and `data.json`.

---

## 3. Technologies used

- **Python**: Server-side programming language.
- **Flask**: Python web framework used to create the server and API routes.
- **JavaScript**: Loads data and controls the interactive dashboard.
- **Plotly.js**: Creates interactive charts in the browser.
- **JSON**: Stores the population and demographic values.
- **HTTP API**: Transfers data between Flask and the browser.

---

## 4. How the application works

The application follows this sequence:

1. The user runs `app.py`.
2. Flask starts a local web server.
3. The browser requests the dashboard page.
4. `dashboard.js` sends a `GET` request to `/api/data`.
5. Flask reads the contents of `data.json`.
6. Flask returns the JSON data to the browser.
7. JavaScript stores the response in the `dataset` variable.
8. JavaScript creates four Plotly charts.
9. The user selects a country.
10. The `render()` function updates the metric cards and all charts.

The charts are generated from the same dataset, so changing the selected
country updates the complete report consistently.

---

## 5. Explanation of `app.py`

### 5.1 Import statements

```python
from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import json
from threading import Lock
```

- `Flask` creates the web application.
- `jsonify` converts Python data into a JSON HTTP response.
- `request` reads JSON sent by the browser.
- `send_from_directory` serves files from the project folder.
- `Path` creates reliable file paths.
- `json` reads and writes the `data.json` file.
- `Lock` prevents two requests from reading or writing the data file at the
  same time.

### 5.2 Application and file configuration

```python
app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"
DATA_LOCK = Lock()
```

- `app` is the Flask application object.
- `BASE_DIR` points to the folder containing `app.py`.
- `DATA_FILE` points to the JSON data file.
- `DATA_LOCK` protects file operations from simultaneous requests.

### 5.3 Dashboard route

```python
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")
```

When the browser opens the root address, Flask sends `index.html` to the
browser.

### 5.4 Static file route

```python
@app.route("/<path:filename>")
def static_root(filename):
    allowed = {"style.css", "dashboard.js", "data.js", "data.json"}
    if filename not in allowed:
        return ("Not found", 404)
    return send_from_directory(BASE_DIR, filename)
```

The browser needs JavaScript, CSS, and JSON files after receiving the page.
This route serves only the expected project files.

The `allowed` set is also a safety measure. It prevents arbitrary files from
being requested through the URL.

### 5.5 Reading data with `GET /api/data`

```python
@app.route("/api/data", methods=["GET"])
def get_data():
    with DATA_LOCK:
        if not DATA_FILE.exists():
            DATA_FILE.write_text("{}", encoding="utf-8")
        try:
            payload = json.loads(
                DATA_FILE.read_text(encoding="utf-8") or "{}"
            )
        except json.JSONDecodeError:
            return jsonify(
                {"error": "data.json contains invalid JSON"}
            ), 500
    return jsonify(payload)
```

This route sends the demographic data to the browser.

1. The lock temporarily protects the file.
2. If `data.json` does not exist, an empty JSON object is created.
3. The file is read as text.
4. `json.loads()` converts the text into Python data.
5. If the file contains invalid JSON, the server returns an error with status
   code `500`.
6. Otherwise, `jsonify()` sends the data as a JSON response.

The JavaScript dashboard calls this route when it starts.

### 5.6 Saving data with `POST /api/data`

```python
@app.route("/api/data", methods=["POST"])
def save_data():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Send a valid JSON object"}), 400
```

This route accepts new JSON data from a client.

- `request.get_json()` reads the request body.
- The application requires the body to be a JSON object.
- Invalid input receives status code `400`, which means bad request.

```python
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    temp_file = DATA_FILE.with_suffix(".json.tmp")
    with DATA_LOCK:
        temp_file.write_text(serialized + "\n", encoding="utf-8")
        temp_file.replace(DATA_FILE)
```

- `json.dumps()` converts the Python object into formatted JSON text.
- A temporary file is written first.
- The temporary file replaces the original file only after writing finishes.
- This reduces the chance of leaving a partially written `data.json`.

```python
    return jsonify({"saved": True, "file": "data.json"})
```

The client receives a confirmation after saving.

### 5.7 Starting the server

```python
if __name__ == "__main__":
    app.run(debug=True)
```

This starts Flask only when `app.py` is run directly. Debug mode helps during
development by showing useful error messages and reloading the server after
source changes.

---

## 6. Explanation of `data.json`

The JSON file is the data source for the dashboard.

### 6.1 Years

```json
"years": [2000, 2002, 2004, "...", 2024]
```

The `years` array is used as the horizontal axis of the population growth
chart.

Each population array must have the same number of values as the `years`
array. For example, the value at index `0` belongs to the year at index `0`.

### 6.2 Country records

```json
"countries": {
  "India": {
    "population": [1.05, 1.13, 1.21],
    "urban": 36,
    "median_age": 28.4,
    "migration": -0.3
  }
}
```

Each country contains:

- `population`: Population values in billions for each year.
- `urban`: Percentage of the population living in urban areas.
- `median_age`: The middle age of the population.
- `migration`: Net migration per 1,000 people.

The dashboard currently contains records for:

- World
- India
- China
- United States
- Nigeria
- Brazil

### 6.3 Age distribution

```json
"age_labels": ["0-14", "15-24", "25-54", "55-64", "65+"],
"age_shares": {
  "India": [26, 18, 43, 7, 6]
}
```

`age_labels` gives the names of the age groups. The values in `age_shares`
give the percentage for each matching age group.

For India:

- 26% are between 0 and 14.
- 18% are between 15 and 24.
- 43% are between 25 and 54.
- 7% are between 55 and 64.
- 6% are 65 or older.

These values are displayed in the doughnut chart.

---

## 7. Explanation of `dashboard.js`

### 7.1 Chart colors and shared regions

```javascript
const COLORS = {
  green: '#c6ff4d',
  gold: '#ffc857',
  blue: '#68d5ff',
  red: '#ff6c73',
  muted: '#8c9ba6',
  grid: '#263742',
  text: '#dfe7e8'
};

const REGIONS = [
  'World',
  'India',
  'China',
  'United States',
  'Nigeria',
  'Brazil'
];

let dataset = null;
```

- `COLORS` keeps chart colors consistent.
- `REGIONS` prevents the same country list from being repeated in multiple
  places.
- `dataset` is initially empty and later contains the response from Flask.

### 7.2 Shared Plotly layout

```javascript
const baseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: COLORS.muted, size: 10 },
  showlegend: false
};
```

This object contains settings shared by all charts, such as transparent
backgrounds, font color, and default legend behavior.

The full project also defines axis colors, margins, grid lines, and hover
styles in this object.

### 7.3 Chart configuration helpers

```javascript
const config = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d']
};

function layout(extra = {}) {
  return { ...baseLayout, ...extra };
}
```

- `config` makes charts responsive and removes unnecessary Plotly controls.
- `layout()` copies the common layout and allows an individual chart to
  override settings.
- The spread operator `...` combines JavaScript objects.

### 7.4 The `render(country)` function

```javascript
function render(country) {
  const d = dataset.countries[country];
  const pop = d.population[d.population.length - 1];
```

`render()` is the main dashboard function.

- It receives the selected country name.
- It finds that country in `dataset.countries`.
- It takes the latest population value using the last array index.

### 7.5 Updating summary metrics

```javascript
document.getElementById('populationMetric').textContent =
  (pop >= 1 ? pop.toFixed(2) : (pop * 1000).toFixed(0)) +
  (pop >= 1 ? 'B' : 'M');

document.getElementById('urbanMetric').textContent = d.urban + '%';
document.getElementById('ageMetric').innerHTML =
  d.median_age.toFixed(1) + ' <small>yrs</small>';
document.getElementById('migrationMetric').textContent =
  (d.migration > 0 ? '+' : '') + d.migration.toFixed(1);
```

These statements update the four summary values:

1. Population is shown in billions when the value is at least `1`; smaller
   values are converted to millions.
2. Urban population is shown as a percentage.
3. Median age is shown to one decimal place.
4. Positive migration values receive a plus sign.

### 7.6 Population growth chart

```javascript
Plotly.react('populationChart', [{
  x: dataset.years,
  y: d.population,
  type: 'scatter',
  mode: 'lines+markers'
}], layout(...), config);
```

This creates or updates the population chart.

- The x-axis uses the years from JSON.
- The y-axis uses the selected country's population values.
- `scatter` creates a line-based chart.
- `lines+markers` shows both the trend line and individual data points.
- `Plotly.react()` updates an existing chart without rebuilding the page.

### 7.7 Age distribution chart

```javascript
const ageValues = dataset.age_shares[country];

Plotly.react('ageChart', [{
  type: 'pie',
  labels: dataset.age_labels,
  values: ageValues,
  hole: 0.66
}], layout(...), config);
```

This creates a doughnut chart.

- `labels` contains age-group names.
- `values` contains the selected country's age percentages.
- `hole` makes the center empty, producing the doughnut appearance.

### 7.8 Migration chart

```javascript
Plotly.react('migrationChart', [{
  x: REGIONS,
  y: REGIONS.map(n => dataset.countries[n].migration),
  type: 'bar'
}], layout(...), config);
```

This creates a bar chart comparing net migration for all regions.

`map()` loops through each region and retrieves its migration value from the
JSON data. Negative values appear below zero, while positive values appear
above zero.

### 7.9 Urbanization chart

```javascript
Plotly.react('urbanChart', [{
  x: REGIONS.map(n => dataset.countries[n].urban),
  y: REGIONS,
  type: 'bar',
  orientation: 'h'
}], layout(...), config);
```

This creates a horizontal bar chart.

- The x-axis contains urban population percentages.
- The y-axis contains region names.
- `orientation: 'h'` makes the bars horizontal.
- The selected region receives the highlight color.

### 7.10 Loading data from Flask

```javascript
fetch('/api/data').then(response => {
  if (!response.ok) {
    throw new Error(`Data request failed with status ${response.status}`);
  }
  return response.json();
}).then(data => {
  dataset = data;
```

`fetch()` sends an HTTP request to Flask.

1. The browser requests `/api/data`.
2. The response status is checked.
3. A failed request creates an error.
4. A successful response is converted from JSON text to a JavaScript object.
5. The object is stored in `dataset`.

```javascript
  const selector = document.getElementById('countrySelect');
  selector.innerHTML = Object.keys(data.countries)
    .map(name => `<option value="${name}">${name}</option>`)
    .join('');

  selector.addEventListener('change', event => {
    render(event.target.value);
  });

  render('World');
});
```

This code:

- Gets the country selector.
- Creates one option for every country in the JSON data.
- Adds a change event listener.
- Calls `render()` again whenever the user chooses another country.
- Initially displays the World data.

### 7.11 Handling loading errors

```javascript
.catch(error => {
  console.error('Unable to load dashboard data:', error);
  document.querySelector('.hero-tag').textContent =
    'DATA UNAVAILABLE · START FLASK FOR DATA';
});
```

If Flask is not running or the data request fails:

- The error is written to the browser console.
- The user receives a visible message instead of a silent failure.

### 7.12 Navigation buttons

```javascript
document.querySelectorAll('.nav').forEach(button =>
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav')
      .forEach(item => item.classList.remove('active'));

    button.classList.add('active');

    const target = document.getElementById(button.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  })
);
```

When a navigation button is clicked:

1. The active state is removed from all buttons.
2. The clicked button becomes active.
3. The matching dashboard section is found.
4. The page scrolls smoothly to that section.

### 7.13 Responsive chart resizing

```javascript
window.addEventListener('resize', () => {
  if (dataset) {
    ['populationChart', 'ageChart', 'migrationChart', 'urbanChart']
      .forEach(id => Plotly.Plots.resize(id));
  }
});
```

When the browser window changes size, every Plotly chart is resized so that
the dashboard remains usable on different screen sizes.

---

## 8. Why this project is interactive

The dashboard is interactive because:

- The user can select a country.
- Summary metrics change immediately.
- The population graph changes to the selected country.
- The age distribution chart changes.
- The selected country is highlighted in comparison charts.
- Plotly provides hover information when the user moves the mouse over chart
  values.
- Navigation buttons scroll to different analysis sections.
- Charts resize when the browser window changes.

---

## 9. How to install and run

Open PowerShell in the project folder and run:

```powershell
pip install -r requirements.txt
python app.py
```

Then open this address in a browser:

```text
http://127.0.0.1:5000
```

To stop the server, press `Ctrl+C` in the terminal.

---

## 10. How to explain the project to a teacher

You can explain the project in this order:

1. **Problem**: The organization needs an easy way to understand demographic
   changes.
2. **Solution**: A Flask and JavaScript dashboard reads demographic data from
   JSON and displays interactive charts.
3. **Backend**: `app.py` starts Flask and provides `/api/data`.
4. **Data**: `data.json` stores years, population, age groups, urbanization,
   and migration values.
5. **Frontend logic**: `dashboard.js` fetches the JSON data and calls the
   `render()` function.
6. **Charts**: Plotly creates population, age, migration, and urbanization
   visualizations.
7. **Interaction**: Selecting a country updates the metrics and charts.
8. **Result**: The organization can compare demographic indicators quickly
   through visual reports.

### Short presentation summary

> This project is a World Population and Demographic Analysis dashboard. It
> uses Flask to provide demographic data through a Python API. The data is
> stored in JSON format. JavaScript fetches the data and uses Plotly to create
> interactive charts for population growth, age distribution, migration, and
> urbanization. When the user selects a country, the dashboard updates all
> metrics and charts using the selected country's data.

