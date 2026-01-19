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
      theme: 'dark' // Set dark as default
    },
    filePreferences: {}
  }
});

const APP_INFO = {
  name: 'CSV TUI Viewer',
  version: '1.2.0',
  author: 'Gemini CLI Agent',
  contact: 'gemini-agent@example.com'
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
  default: { // Kept for legacy compatibility, looks like 'classic blue'
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
    base: { bg: '#2b0000', fg: 'yellow' }, // Deep red background
    header: { fg: 'red', bold: true },
    selected: { bg: 'yellow', fg: 'red' },
    tableHeader: { fg: 'yellow', bold: true },
    tableCell: { fg: 'white', selected: { bg: 'yellow', fg: 'black' } },
    menu: { bg: '#2b0000', item: { bg: '#2b0000', fg: 'yellow' }, selected: { bg: 'yellow', fg: '#2b0000' } }
  },
  retro: {
    base: { bg: 'black', fg: 'yellow' }, // Amber monochrome style
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
// Fallback if the saved theme name doesn't exist in the new list (e.g. from older version)
let theme = THEMES[currentThemeName] || THEMES.dark;

// Get filename from args or last opened or default
let filename = process.argv[2] || config.get('settings.lastFile');
let configKey = filename ? filename.replace(/\./g, '_') : 'default';

// --- Global State ---
let rawData = [];
let headers = [];
let currentData = [];
let sortConfig = { column: null, direction: 'asc' };
let hiddenColumns = [];

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
  height: '100%-1',
  keys: true,
  mouse: true,
  vi: true,
  align: 'left',
  tags: true,
  border: { type: 'line' },
  style: {
    header: theme.tableHeader,
    cell: theme.tableCell
  },
  scrollbar: {
    ch: ' ',
    track: { bg: 'grey' },
    style: { inverse: true }
  }
});

// --- Logic ---

function applyTheme(newThemeName) {
  currentThemeName = newThemeName;
  theme = THEMES[currentThemeName];
  config.set('settings.theme', currentThemeName);

  // Update styles
  menuBar.style = theme.menu;
  menuBar.items.forEach(item => {
      // Internal blessed hack to update listbar items
      item.style = theme.menu.item;
  });
  
  table.style.header = theme.tableHeader;
  table.style.cell = theme.tableCell;
  
  screen.render();
}

function loadData(fileToLoad) {
  if (!fileToLoad || !fs.existsSync(fileToLoad)) {
    // If no file, just show file manager
    showFileManager();
    return;
  }

  filename = fileToLoad;
  configKey = filename.replace(/\./g, '_');
  config.set('settings.lastFile', filename);

  const fileContent = fs.readFileSync(filename, 'utf8');
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
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
      screen.render();
    }
  });
}

function processData() {
  const visibleHeaders = headers.filter(h => !hiddenColumns.includes(h));
  
  let processed = [...rawData];
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

  const tableData = [visibleHeaders];
  processed.forEach(row => {
    tableData.push(visibleHeaders.map(h => row[h]));
  });

  currentData = tableData;
  table.setData(tableData);
  table.focus();
}

// --- Features ---

function showFileManager() {
  const fm = blessed.filemanager({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: '60%',
    border: 'line',
    label: ' Select CSV File ',
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

  fm.on('file', (file) => {
    if (file.endsWith('.csv')) {
      screen.remove(fm);
      loadData(file);
    }
  });
  
  fm.key(['escape', 'q'], () => {
    screen.remove(fm);
    screen.render();
  });

  fm.refresh(); // Refresh to show files
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
  Created by: ${APP_INFO.author}
  Contact: ${APP_INFO.contact}
  
  Settings are saved automatically.
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
    width: '50%',
    height: '60%',
    border: 'line',
    label: ' Settings ',
    keys: true,
    style: { bg: theme.base.bg }
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
  
  // Theme Selector
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
    height: 4,
    width: '90%',
    items: Object.keys(THEMES),
    keys: true,
    mouse: true,
    style: {
      item: { fg: theme.base.fg, bg: theme.base.bg },
      selected: theme.selected
    },
    border: 'line'
  });
  
  // Pre-select current theme
  const themeIndex = Object.keys(THEMES).indexOf(currentThemeName);
  if (themeIndex >= 0) themeList.select(themeIndex);

  themeList.on('select', (item) => {
    // Just select, don't apply yet until save? Or apply immediately?
    // Let's apply on Save for consistency
  });

  const resetBtn = blessed.button({
      parent: form,
      bottom: 4,
      left: 2,
      content: ' Reset All Settings ',
      style: { bg: 'red', fg: 'white', focus: { bg: 'lightred' } },
      mouse: true,
      shrink: true
  });

  const saveBtn = blessed.button({
    parent: form,
    bottom: 1,
    left: 'center',
    content: ' Save & Close ',
    style: { bg: 'green', fg: 'black', focus: { bg: 'lightgreen' } },
    keys: true,
    mouse: true,
    shrink: true,
    padding: { left: 1, right: 1 }
  });

  saveBtn.on('press', () => {
      form.submit();
      const selectedTheme = themeList.getItem(themeList.selected).content;
      applyTheme(selectedTheme);
  });
  
  resetBtn.on('press', () => {
      config.clear();
      screen.remove(form);
      const msg = blessed.message({ parent: screen, top: 'center', left: 'center', border: 'line' });
      msg.display('Settings Reset. Please restart app.', 2, () => {});
  });

  form.on('submit', (data) => {
    config.set('settings.showBorders', data.showBorders);
    if (data.showBorders) table.border = { type: 'line' };
    else table.border = { type: 'bg' };
    screen.remove(form);
    screen.render();
  });
  
  form.key(['escape'], () => {
      screen.remove(form);
      screen.render();
  });

  screen.append(form);
  themeList.focus();
  screen.render();
}

function exportData() {
  const prompt = blessed.prompt({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: 'shrink',
    border: 'line',
    label: ' Export Filename ',
    keys: true,
    mouse: true,
    style: { bg: theme.base.bg, fg: theme.base.fg }
  });

  prompt.input('Filename:', 'export.csv', (err, value) => {
    if (value) {
        const csv = Papa.unparse(currentData);
        fs.writeFileSync(value, csv);
        
        const msg = blessed.message({
            parent: screen,
            top: 'center',
            left: 'center',
            height: 'shrink',
            width: '50%',
            border: 'line'
        });
        msg.display(`Exported to ${value}`, 2, () => {});
    }
  });
}

// --- Key Bindings ---
screen.key(['q', 'C-c'], () => process.exit(0));

// --- Start ---
loadData(filename);
