#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const Papa = require('papaparse');
const Conf = require('conf');

// --- Configuration & Setup ---
const config = new Conf({
  projectName: 'csv-tui-viewer',
  defaults: {
    settings: {
      showBorders: true,
      lastFile: null,
      theme: 'dark'
    },
    filePreferences: {}
  }
});

const APP_INFO = {
  name: 'TUIcsv Viewer',
  version: '1.3.1',
  author: '@not_jarod',
  contact: 'https://github.com/a2-stuff/TUIcsv'
};

const THEMES = {
  dark: {
    base: { bg: 'black', fg: 'white' },
    header: { fg: 'white', bold: true },
    selected: { bg: 'grey', fg: 'white' },
    tableHeader: { fg: 'green', bold: true },
    tableCell: { fg: 'gray', selected: { bg: 'white', fg: 'black' } },
    menu: { bg: 'black', item: { bg: 'black', fg: 'white' }, selected: { bg: 'white', fg: 'black' } }
  },
  default: {
    base: { bg: 'blue', fg: 'white' },
    header: { fg: 'blue', bold: true },
    selected: { bg: 'cyan', fg: 'black' },
    tableHeader: { fg: 'blue', bold: true },
    tableCell: { fg: 'white', selected: { bg: 'blue', fg: 'white' } },
    menu: { bg: 'blue', item: { bg: 'blue', fg: 'white' }, selected: { bg: 'cyan', fg: 'black' } }
  },
  ocean: {
    base: { bg: 'cyan', fg: 'black' },
    header: { fg: 'black', bold: true },
    selected: { bg: 'blue', fg: 'white' },
    tableHeader: { fg: 'blue', bold: true },
    tableCell: { fg: 'black', selected: { bg: 'blue', fg: 'white' } },
    menu: { bg: 'cyan', item: { bg: 'cyan', fg: 'black' }, selected: { bg: 'blue', fg: 'white' } }
  },
  sunset: {
    base: { bg: '#2b0000', fg: 'yellow' },
    header: { fg: 'red', bold: true },
    selected: { bg: 'yellow', fg: 'red' },
    tableHeader: { fg: 'yellow', bold: true },
    tableCell: { fg: 'white', selected: { bg: 'yellow', fg: 'black' } },
    menu: { bg: '#2b0000', item: { bg: '#2b0000', fg: 'yellow' }, selected: { bg: 'yellow', fg: '#2b0000' } }
  },
  retro: {
    base: { bg: 'black', fg: 'yellow' },
    header: { fg: 'yellow', bold: true },
    selected: { bg: 'yellow', fg: 'black' },
    tableHeader: { fg: 'yellow', bold: true },
    tableCell: { fg: 'yellow', selected: { bg: 'yellow', fg: 'black' } },
    menu: { bg: 'black', item: { bg: 'black', fg: 'yellow' }, selected: { bg: 'yellow', fg: 'black' } }
  },
  matrix: {
    base: { bg: 'black', fg: 'green' },
    header: { fg: 'green', bold: true },
    selected: { bg: 'green', fg: 'black' },
    tableHeader: { fg: 'green', bold: true },
    tableCell: { fg: 'green', selected: { bg: 'green', fg: 'black' } },
    menu: { bg: 'black', item: { bg: 'black', fg: 'green' }, selected: { bg: 'green', fg: 'black' } }
  },
  high_contrast: {
    base: { bg: 'white', fg: 'black' },
    header: { fg: 'black', bold: true },
    selected: { bg: 'black', fg: 'white' },
    tableHeader: { fg: 'black', bold: true },
    tableCell: { fg: 'black', selected: { bg: 'black', fg: 'white' } },
    menu: { bg: 'white', item: { bg: 'white', fg: 'black' }, selected: { bg: 'black', fg: 'white' } }
  }
};

let currentThemeName = config.get('settings.theme');
let theme = THEMES[currentThemeName] || THEMES.dark;

let filename = process.argv[2] || config.get('settings.lastFile');
let configKey = filename ? filename.replace(/\./g, '_') : 'default';

// --- Global State ---
let rawData = [];
let headers = [];
let processedRows = []; // Filtered & Sorted rows (Array of Objects)
let sortConfig = { column: null, direction: 'asc' };
let hiddenColumns = [];
let searchQuery = '';

// Virtual Scrolling State
let scrollIndex = 0;
let tableHeight = 0;

// --- Animations ---
const SPINNERS = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  grow: [' ', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃']
};

let spinnerInterval;
function startSpinner(msg = 'Working') {
  let frame = 0;
  if (spinnerInterval) clearInterval(spinnerInterval);
  statusBar.style.bg = 'yellow';
  statusBar.style.fg = 'black';
  spinnerInterval = setInterval(() => {
    statusBar.setContent(` ${SPINNERS.dots[frame % SPINNERS.dots.length]} ${msg}... `);
    screen.render();
    frame++;
  }, 80);
}

function stopSpinner(msg = 'Ready') {
  if (spinnerInterval) clearInterval(spinnerInterval);
  statusBar.style.bg = theme.base.bg;
  statusBar.style.fg = theme.base.fg;
  statusBar.setContent(` ${msg} `);
  screen.render();
}

// --- UI Setup ---
const screen = blessed.screen({
  smartCSR: true,
  title: APP_INFO.name,
  fullUnicode: true
});

const menuBar = blessed.listbar({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  mouse: true,
  keys: true,
  autoCommandKeys: true,
  style: theme.menu,
  items: {
    'Open': showFileManager,
    'Search': showSearchPrompt,
    'Filter Cols': toggleColumnFilter,
    'Sort': toggleSortMenu,
    'Export': exportData,
    'Info': showInfo,
    'Settings': showSettings,
    'Quit': () => process.exit(0)
  }
});

const table = blessed.listtable({
  parent: screen,
  top: 1,
  left: 0,
  width: '100%',
  height: '100%-2', // Leave room for status bar
  keys: true,
  mouse: true, // We handle scrolling manually, but mouse selection needs this
  vi: true,
  align: 'left',
  tags: true,
  border: { type: 'line' },
  style: {
    header: theme.tableHeader,
    cell: theme.tableCell
  }
});

const statusBar = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: ' Loading... ',
  style: { bg: theme.base.bg, fg: theme.base.fg }
});

// --- Logic ---

function applyTheme(newThemeName) {
  currentThemeName = newThemeName;
  theme = THEMES[currentThemeName];
  config.set('settings.theme', currentThemeName);

  menuBar.style = theme.menu;
  menuBar.items.forEach(item => item.style = theme.menu.item);
  table.style.header = theme.tableHeader;
  table.style.cell = theme.tableCell;
  
  if (!spinnerInterval) {
    statusBar.style = { bg: theme.base.bg, fg: theme.base.fg };
  }
  
  screen.render();
}

function loadData(fileToLoad) {
  if (!fileToLoad || !fs.existsSync(fileToLoad)) {
    showFileManager();
    return;
  }

  startSpinner(`Loading ${path.basename(fileToLoad)}`);

  setImmediate(() => {
    try {
      filename = fileToLoad;
      configKey = filename.replace(/\./g, '_');
      config.set('settings.lastFile', filename);
      screen.title = `${APP_INFO.name} - ${path.basename(filename)}`;

      fs.readFile(filename, 'utf8', (err, fileContent) => {
        if (err) {
          stopSpinner('Error');
          showErrorMessage(`Could not open file: ${err.message}`);
          return;
        }

        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          error: (err) => {
            stopSpinner('Error');
            showErrorMessage(`Error parsing CSV: ${err.message}`);
          },
          complete: (results) => {
            rawData = results.data;
            headers = results.meta.fields || [];
            
            if (!config.has(`filePreferences.${configKey}`)) {
              hiddenColumns = [];
              config.set(`filePreferences.${configKey}.hiddenColumns`, []);
            } else {
              hiddenColumns = config.get(`filePreferences.${configKey}.hiddenColumns`);
            }
            
            processData();
            stopSpinner(`Loaded ${rawData.length} rows`);
            screen.render();
          }
        });
      });
    } catch (err) {
      stopSpinner('Error');
      showErrorMessage(`Unexpected error: ${err.message}`);
    }
  });
}

function showErrorMessage(msg) {
  const box = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 'shrink',
    height: 'shrink',
    border: 'line',
    label: ' Error ',
    style: { border: { fg: 'red' }, bg: theme.base.bg, fg: 'red' }
  });
  box.display(msg, 0, () => {
    if (rawData.length === 0) showFileManager();
  });
}

function processData() {
  // 1. Filter Rows (Search)
  let processed = rawData;
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    processed = rawData.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }

  // 2. Sort Data
  if (sortConfig.column) {
    processed.sort((a, b) => {
      let valA = a[sortConfig.column];
      let valB = b[sortConfig.column];
      if (!isNaN(valA) && !isNaN(valB)) {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  processedRows = processed;
  scrollIndex = 0; // Reset scroll on new data
  renderTable();
}

function renderTable() {
  const visibleHeaders = headers.filter(h => !hiddenColumns.includes(h));
  
  // Calculate viewport
  // listtable height includes borders and header. 
  // We need to know how many data rows fit.
  // Approximation: height - 2 (borders) - 1 (header)
  // But blessed handles borders internally. 
  // Safe bet: screen.height - 4 (menu + status + borders)
  const availableHeight = table.height - 3; // Rough estimate
  tableHeight = Math.max(5, availableHeight);

  // Slice data for virtualization
  const visibleRows = processedRows.slice(scrollIndex, scrollIndex + tableHeight);
  
  const tableData = [visibleHeaders];
  visibleRows.forEach(row => {
    tableData.push(visibleHeaders.map(h => row[h]));
  });

  table.setData(tableData);
  
  // Update Status Bar
  if (!spinnerInterval) {
    const percent = processedRows.length > 0 ? Math.round(((scrollIndex + visibleRows.length) / processedRows.length) * 100) : 0;
    statusBar.setContent(` Rows: ${processedRows.length} | Visible: ${scrollIndex + 1}-${scrollIndex + visibleRows.length} (${percent}%) | Search: "${searchQuery}" `);
  }
  
  screen.render();
}

// --- Input Handling for Virtual Scrolling ---

// We override default navigation to handle virtual scrolling
table.key(['up', 'k'], () => {
  if (scrollIndex > 0) {
    scrollIndex--;
    renderTable();
  }
});

table.key(['down', 'j'], () => {
  if (scrollIndex + tableHeight < processedRows.length) {
    scrollIndex++;
    renderTable();
  }
});

table.key(['pageup', 'C-b'], () => {
  scrollIndex = Math.max(0, scrollIndex - tableHeight);
  renderTable();
});

table.key(['pagedown', 'C-f'], () => {
  scrollIndex = Math.min(processedRows.length - tableHeight, scrollIndex + tableHeight);
  // Ensure we don't go out of bounds if length < height
  if (scrollIndex < 0) scrollIndex = 0; 
  renderTable();
});

table.key(['home', 'g'], () => {
  scrollIndex = 0;
  renderTable();
});

table.key(['end', 'G'], () => {
  scrollIndex = Math.max(0, processedRows.length - tableHeight);
  renderTable();
});

// Also handle wheel (mouse support)
table.on('wheeldown', () => {
    if (scrollIndex + tableHeight < processedRows.length) {
        scrollIndex++;
        renderTable();
    }
});

table.on('wheelup', () => {
    if (scrollIndex > 0) {
        scrollIndex--;
        renderTable();
    }
});


// --- Features ---

function showSearchPrompt() {
  const form = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 12, // Increased height to fit larger input
    border: 'line',
    label: ' Search ',
    keys: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });

  const input = blessed.textbox({
    parent: form,
    top: 1,
    left: 2,
    right: 2,
    height: 3, // Height 3 is required for borders + text
    name: 'search',
    label: ' Search Term ',
    value: searchQuery,
    inputOnFocus: true,
    keys: true,
    border: { type: 'line' },
    style: {
        fg: 'white',
        bg: 'black',
        focus: {
            fg: 'white',
            bg: 'black',
            border: { fg: 'cyan' }
        }
    }
  });
  
  // Pre-fill with existing query
  input.setValue(searchQuery);

  const searchBtn = blessed.button({
    parent: form,
    bottom: 1,
    right: 2,
    content: ' Search (Ctrl+s) ',
    style: { bg: 'green', fg: 'black', focus: { bg: 'lightgreen' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });
  
  const clearBtn = blessed.button({
    parent: form,
    bottom: 1,
    left: 'center',
    content: ' Clear (Ctrl+l) ',
    style: { bg: 'yellow', fg: 'black', focus: { bg: 'lightyellow' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });

  const cancelBtn = blessed.button({
      parent: form,
      bottom: 1,
      left: 2,
      content: ' Cancel (Esc) ',
      style: { bg: 'red', fg: 'white', focus: { bg: 'lightred' } },
      mouse: true,
      shrink: true,
      padding: { left: 1, right: 1 }
  });

  // Handlers
  const doSearch = () => {
    searchQuery = input.getValue() || '';
    processData();
    screen.remove(form);
    screen.render();
  };

  const doClear = () => {
      searchQuery = '';
      processData();
      screen.remove(form);
      screen.render();
  };
  
  const doCancel = () => {
      screen.remove(form);
      screen.render();
  };

  input.key('enter', doSearch);
  searchBtn.on('press', doSearch);
  clearBtn.on('press', doClear);
  cancelBtn.on('press', doCancel);
  
  // Control keys (More reliable on Mac than Alt)
  form.key(['C-s'], doSearch);
  form.key(['C-l'], doClear);
  
  input.key(['C-s'], doSearch);
  input.key(['C-l'], doClear);
  
  form.key(['escape'], doCancel);

  screen.append(form);
  input.focus();
  screen.render();
}

function showFileManager() {
  const fm = blessed.filemanager({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: '60%',
    border: 'line',
    label: ' Select CSV File (Esc to Cancel) ',
    cwd: process.cwd(),
    keys: true,
    mouse: true,
    scrollbar: {
      ch: ' ',
      track: { bg: 'grey' },
      style: { inverse: true }
    },
    style: {
      item: { fg: theme.base.fg, bg: theme.base.bg },
      selected: theme.selected
    }
  });

  const cancelBtn = blessed.button({
    parent: fm,
    bottom: 0,
    right: 1,
    content: ' Cancel ',
    style: { bg: 'red', fg: 'white', focus: { bg: 'lightred' } },
    keys: true,
    mouse: true,
    shrink: true
  });

  cancelBtn.on('press', () => {
    screen.remove(fm);
    screen.render();
  });

  fm.on('file', (file) => {
    if (file.endsWith('.csv')) {
      screen.remove(fm);
      loadData(file);
    } else {
      showErrorMessage('Invalid file type. Please select a .csv file.');
    }
  });
  
  // Explicitly handle cancel keys
  fm.key(['escape', 'q'], () => {
    screen.remove(fm);
    screen.render();
  });

  fm.refresh(); 
  screen.append(fm);
  fm.focus();
  screen.render();
}

function showInfo() {
  const box = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 'shrink',
    border: 'line',
    label: ' App Info ',
    tags: true,
    hidden: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });
  
  const infoText = `
  {bold}${APP_INFO.name}{/bold}
  Version: ${APP_INFO.version}
  Creator: ${APP_INFO.author}
  Github: ${APP_INFO.contact}
  
  Use Arrow Keys to scroll.
  Search filters data globally.
  
  Press {bold}Enter{/bold} or Click to close.
  `;
  
  box.display(infoText, 0, () => {});
}

function toggleColumnFilter() {
  const form = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '80%',
    border: 'line',
    label: ' Toggle Columns (Space to toggle, Enter to save) ',
    keys: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });

  let checkY = 0;
  const checkboxes = headers.map((header) => {
    const cb = blessed.checkbox({
      parent: form,
      top: checkY++,
      left: 2,
      name: header,
      content: header,
      checked: !hiddenColumns.includes(header),
      mouse: true,
      style: { fg: theme.base.fg, bg: theme.base.bg }
    });
    return cb;
  });

  const saveBtn = blessed.button({
    parent: form,
    bottom: 1,
    left: 'center',
    content: ' Save ',
    style: { bg: 'green', fg: 'black', focus: { bg: 'lightgreen' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });

  saveBtn.on('press', () => form.submit());

  form.on('submit', (data) => {
    hiddenColumns = headers.filter(h => data[h] === false);
    config.set(`filePreferences.${configKey}.hiddenColumns`, hiddenColumns);
    processData();
    screen.remove(form);
    screen.render();
  });

  form.key(['escape'], () => {
    screen.remove(form);
    screen.render();
  });

  screen.append(form);
  if (checkboxes.length > 0) checkboxes[0].focus();
  screen.render();
}

function toggleSortMenu() {
  const list = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '40%',
    height: '60%',
    border: 'line',
    label: ' Select Column to Sort ',
    keys: true,
    mouse: true,
    items: headers,
    style: {
      item: { fg: theme.base.fg },
      selected: theme.selected
    }
  });

  list.on('select', (item) => {
    const col = item.content;
    if (sortConfig.column === col) {
      sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.column = col;
      sortConfig.direction = 'asc';
    }
    processData();
    screen.remove(list);
    screen.render();
  });
  
  list.key(['escape'], () => {
    screen.remove(list);
    screen.render();
  });

  screen.append(list);
  list.focus();
  screen.render();
}

function showSettings() {
  const form = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '80%',
    border: 'line',
    label: ' Settings ',
    keys: true,
    style: { bg: theme.base.bg, fg: theme.base.fg },
    shadow: true
  });

  const borderCheck = blessed.checkbox({
    parent: form,
    top: 1,
    left: 2,
    name: 'showBorders',
    content: 'Show Table Borders',
    checked: config.get('settings.showBorders'),
    mouse: true,
    style: { fg: theme.base.fg, bg: theme.base.bg }
  });
  
  blessed.text({
    parent: form,
    top: 3,
    left: 2,
    content: 'Select Theme:',
    style: { fg: theme.base.fg, bg: theme.base.bg }
  });
  
  const themeList = blessed.list({
    parent: form,
    top: 4,
    left: 2,
    height: 10,
    width: '90%',
    items: Object.keys(THEMES),
    keys: true,
    mouse: true,
    style: {
      item: { fg: theme.base.fg, bg: theme.base.bg },
      selected: theme.selected
    },
    border: 'line',
    scrollbar: { ch: ' ' }
  });
  
  const initialTheme = currentThemeName;
  const themeIndex = Object.keys(THEMES).indexOf(currentThemeName);
  if (themeIndex >= 0) themeList.select(themeIndex);

  const resetBtn = blessed.button({
      parent: form,
      bottom: 1,
      left: 2,
      content: ' Reset All (Ctrl+r) ',
      style: { bg: 'red', fg: 'white', focus: { bg: 'lightred' } },
      mouse: true,
      shrink: true,
      padding: { left: 1, right: 1 }
  });

  const cancelBtn = blessed.button({
      parent: form,
      bottom: 1,
      right: 22,
      content: ' Cancel (Esc) ',
      style: { bg: 'yellow', fg: 'black', focus: { bg: 'lightyellow' } },
      mouse: true,
      shrink: true,
      padding: { left: 1, right: 1 }
  });

  const saveBtn = blessed.button({
    parent: form,
    bottom: 1,
    right: 2,
    content: ' Save (Ctrl+s) ',
    style: { bg: 'green', fg: 'black', focus: { bg: 'lightgreen' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });

  const doCancel = () => {
      screen.remove(form);
      screen.render();
  };

  const doSave = () => {
      form.submit();
      const selectedTheme = themeList.getItem(themeList.selected).content;
      
      applyTheme(selectedTheme);
      screen.remove(form);
      
      if (selectedTheme !== initialTheme) {
        const msg = blessed.message({ 
          parent: screen, 
          top: 'center', 
          left: 'center', 
          width: '50%',
          border: 'line',
          style: { bg: 'blue', fg: 'white' }
        });
        msg.display('Theme updated!\nPlease restart the app if you see visual artifacts.', 3, () => {
            screen.render();
        });
      } else {
        screen.render();
      }
  };

  const doReset = () => {
      config.clear();
      screen.remove(form);
      const msg = blessed.message({ parent: screen, top: 'center', left: 'center', border: 'line' });
      msg.display('Settings Reset. Please restart app.', 2, () => {});
  };

  cancelBtn.on('press', doCancel);
  saveBtn.on('press', doSave);
  resetBtn.on('press', doReset);

  form.on('submit', (data) => {
    config.set('settings.showBorders', data.showBorders);
    if (data.showBorders) table.border = { type: 'line' };
    else table.border = { type: 'bg' };
  });
  
  // Key bindings
  form.key(['escape'], doCancel);
  form.key(['C-s'], doSave);
  form.key(['C-r'], doReset);

  screen.append(form);
  themeList.focus();
  screen.render();
}

function exportData() {
  const form = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 12, // Increased height
    border: 'line',
    label: ' Export Filename ',
    keys: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });

  const input = blessed.textbox({
    parent: form,
    top: 1,
    left: 2,
    right: 2,
    height: 3, // Fix visibility
    name: 'filename',
    label: ' Filename ',
    value: 'export.csv',
    inputOnFocus: true,
    keys: true,
    border: { type: 'line' },
    style: {
        fg: 'white',
        bg: 'black',
        focus: {
            fg: 'white',
            bg: 'black',
            border: { fg: 'cyan' }
        }
    }
  });

  // Pre-fill
  input.setValue('export.csv');

  const saveBtn = blessed.button({
    parent: form,
    bottom: 1,
    right: 2,
    content: ' Save (Ctrl+s) ',
    style: { bg: 'green', fg: 'black', focus: { bg: 'lightgreen' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });
  
  const cancelBtn = blessed.button({
    parent: form,
    bottom: 1,
    left: 2,
    content: ' Cancel (Esc) ',
    style: { bg: 'red', fg: 'white', focus: { bg: 'lightred' } },
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });

  const doExport = () => {
    const value = input.getValue();
    if (value) {
        screen.remove(form);
        startSpinner('Saving');
        
        setTimeout(() => {
            const visibleHeaders = headers.filter(h => !hiddenColumns.includes(h));
            const exportData = processedRows.map(row => {
                const newRow = {};
                visibleHeaders.forEach(h => newRow[h] = row[h]);
                return newRow;
            });
            
            const csv = Papa.unparse(exportData);
            fs.writeFileSync(value, csv);
            
            stopSpinner('Saved');
            
            const msg = blessed.message({
                parent: screen,
                top: 'center',
                left: 'center',
                height: 'shrink',
                width: '50%',
                border: 'line'
            });
            msg.display(`Exported to ${value}`, 2, () => {});
        }, 100);
    }
  };
  
  const doCancel = () => {
      screen.remove(form);
      screen.render();
  };

  input.key('enter', doExport);
  saveBtn.on('press', doExport);
  cancelBtn.on('press', doCancel);
  
  // Control keys
  form.key(['C-s'], doExport);
  input.key(['C-s'], doExport);
  
  form.key(['escape'], doCancel);

  screen.append(form);
  input.focus();
  screen.render();
}

// --- Key Bindings ---
function confirmQuit() {
  const question = blessed.question({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '30%',
    height: 'shrink',
    border: 'line',
    label: ' Confirm Exit ',
    keys: true,
    mouse: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });

  question.ask('Are you sure you want to quit?', (err, value) => {
    if (value) {
      process.exit(0);
    } else {
      screen.render();
    }
  });
}

screen.key(['q', 'C-c'], () => confirmQuit());

// --- Start ---
// Initial resize handler to set table height correctly before render
screen.on('resize', () => {
    renderTable();
});

loadData(filename);