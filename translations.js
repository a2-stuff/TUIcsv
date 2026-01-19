// Translations for TUIcsv Viewer
// Supported languages: English (en), Spanish (es), Portuguese (pt)

const translations = {
    en: {
        // Menu Bar
        menuOpen: 'Open',
        menuSearch: 'Search',
        menuFilterCols: 'Filter Cols',
        menuSort: 'Sort',
        menuExport: 'Export',
        menuInfo: 'Info',
        menuSettings: 'Settings',
        menuQuit: 'Quit',

        // Status Bar
        statusLoading: 'Loading...',
        statusReady: 'Ready',
        statusError: 'Error',
        statusRows: 'Rows',
        statusVisible: 'Visible',
        statusSearch: 'Search',
        statusWorking: 'Working',
        statusSaving: 'Saving',
        statusSaved: 'Saved',

        // File Manager
        fileManagerTitle: 'Select CSV File (Esc to Cancel)',
        fileManagerCancel: 'Cancel',
        fileManagerInvalidType: 'Invalid file type. Please select a .csv file.',

        // Search
        searchTitle: 'Search',
        searchLabel: 'Search Term',
        searchButton: 'Search (Ctrl+s)',
        searchClear: 'Clear (Ctrl+l)',
        searchCancel: 'Cancel (Esc)',

        // Column Filter
        columnFilterTitle: 'Toggle Columns (Space to toggle, Enter to save)',
        columnFilterSave: 'Save',

        // Sort
        sortTitle: 'Select Column to Sort',

        // Export
        exportTitle: 'Export Filename',
        exportLabel: 'Filename',
        exportButton: 'Save (Ctrl+s)',
        exportCancel: 'Cancel (Esc)',
        exportSuccess: 'Exported to',

        // Info
        infoTitle: 'App Info',
        infoVersion: 'Version',
        infoCreator: 'Creator',
        infoGithub: 'Github',
        infoInstructions: 'Use Arrow Keys to scroll.\nSearch filters data globally.\n\nPress {bold}Enter{/bold} or Click to close.',

        // Settings
        settingsTitle: 'Settings',
        settingsBorders: 'Show Table Borders',
        settingsTheme: 'Select Theme:',
        settingsLanguage: 'Select Language:',
        settingsReset: 'Reset All (Ctrl+r)',
        settingsCancel: 'Cancel (Esc)',
        settingsSave: 'Save (Ctrl+s)',
        settingsThemeUpdated: 'Theme updated!\nPlease restart the app if you see visual artifacts.',
        settingsLanguageUpdated: 'Language updated!',
        settingsResetMessage: 'Settings Reset. Please restart app.',

        // Languages
        languages: {
            en: 'English',
            es: 'Español',
            pt: 'Português'
        },

        // Error Messages
        errorTitle: 'Error',
        errorFileOpen: 'Could not open file:',
        errorParsing: 'Error parsing CSV:',
        errorUnexpected: 'Unexpected error:',

        // Confirm Exit
        confirmExitTitle: 'Confirm Exit',
        confirmExitMessage: 'Are you sure you want to quit?',

        // Loading Messages
        loadingFile: 'Loading',
        loadedRows: 'Loaded',
        loadedRowsSuffix: 'rows'
    },

    es: {
        // Menu Bar
        menuOpen: 'Abrir',
        menuSearch: 'Buscar',
        menuFilterCols: 'Filtrar Cols',
        menuSort: 'Ordenar',
        menuExport: 'Exportar',
        menuInfo: 'Info',
        menuSettings: 'Ajustes',
        menuQuit: 'Salir',

        // Status Bar
        statusLoading: 'Cargando...',
        statusReady: 'Listo',
        statusError: 'Error',
        statusRows: 'Filas',
        statusVisible: 'Visible',
        statusSearch: 'Buscar',
        statusWorking: 'Trabajando',
        statusSaving: 'Guardando',
        statusSaved: 'Guardado',

        // File Manager
        fileManagerTitle: 'Seleccionar archivo CSV (Esc para cancelar)',
        fileManagerCancel: 'Cancelar',
        fileManagerInvalidType: 'Tipo de archivo inválido. Por favor seleccione un archivo .csv.',

        // Search
        searchTitle: 'Buscar',
        searchLabel: 'Término de búsqueda',
        searchButton: 'Buscar (Ctrl+s)',
        searchClear: 'Limpiar (Ctrl+l)',
        searchCancel: 'Cancelar (Esc)',

        // Column Filter
        columnFilterTitle: 'Alternar Columnas (Espacio para alternar, Enter para guardar)',
        columnFilterSave: 'Guardar',

        // Sort
        sortTitle: 'Seleccionar Columna para Ordenar',

        // Export
        exportTitle: 'Nombre de archivo de exportación',
        exportLabel: 'Nombre de archivo',
        exportButton: 'Guardar (Ctrl+s)',
        exportCancel: 'Cancelar (Esc)',
        exportSuccess: 'Exportado a',

        // Info
        infoTitle: 'Información de la App',
        infoVersion: 'Versión',
        infoCreator: 'Creador',
        infoGithub: 'Github',
        infoInstructions: 'Use las teclas de flecha para desplazarse.\nLa búsqueda filtra datos globalmente.\n\nPresione {bold}Enter{/bold} o haga clic para cerrar.',

        // Settings
        settingsTitle: 'Ajustes',
        settingsBorders: 'Mostrar bordes de tabla',
        settingsTheme: 'Seleccionar Tema:',
        settingsLanguage: 'Seleccionar Idioma:',
        settingsReset: 'Restablecer Todo (Ctrl+r)',
        settingsCancel: 'Cancelar (Esc)',
        settingsSave: 'Guardar (Ctrl+s)',
        settingsThemeUpdated: '¡Tema actualizado!\nReinicie la aplicación si ve artefactos visuales.',
        settingsLanguageUpdated: '¡Idioma actualizado!',
        settingsResetMessage: 'Ajustes Restablecidos. Por favor reinicie la aplicación.',

        // Languages
        languages: {
            en: 'English',
            es: 'Español',
            pt: 'Português'
        },

        // Error Messages
        errorTitle: 'Error',
        errorFileOpen: 'No se pudo abrir el archivo:',
        errorParsing: 'Error al analizar CSV:',
        errorUnexpected: 'Error inesperado:',

        // Confirm Exit
        confirmExitTitle: 'Confirmar Salida',
        confirmExitMessage: '¿Está seguro de que desea salir?',

        // Loading Messages
        loadingFile: 'Cargando',
        loadedRows: 'Cargado',
        loadedRowsSuffix: 'filas'
    },

    pt: {
        // Menu Bar
        menuOpen: 'Abrir',
        menuSearch: 'Pesquisar',
        menuFilterCols: 'Filtrar Cols',
        menuSort: 'Ordenar',
        menuExport: 'Exportar',
        menuInfo: 'Info',
        menuSettings: 'Configurações',
        menuQuit: 'Sair',

        // Status Bar
        statusLoading: 'Carregando...',
        statusReady: 'Pronto',
        statusError: 'Erro',
        statusRows: 'Linhas',
        statusVisible: 'Visível',
        statusSearch: 'Pesquisar',
        statusWorking: 'Trabalhando',
        statusSaving: 'Salvando',
        statusSaved: 'Salvo',

        // File Manager
        fileManagerTitle: 'Selecionar arquivo CSV (Esc para cancelar)',
        fileManagerCancel: 'Cancelar',
        fileManagerInvalidType: 'Tipo de arquivo inválido. Por favor, selecione um arquivo .csv.',

        // Search
        searchTitle: 'Pesquisar',
        searchLabel: 'Termo de pesquisa',
        searchButton: 'Pesquisar (Ctrl+s)',
        searchClear: 'Limpar (Ctrl+l)',
        searchCancel: 'Cancelar (Esc)',

        // Column Filter
        columnFilterTitle: 'Alternar Colunas (Espaço para alternar, Enter para salvar)',
        columnFilterSave: 'Salvar',

        // Sort
        sortTitle: 'Selecionar Coluna para Ordenar',

        // Export
        exportTitle: 'Nome do arquivo de exportação',
        exportLabel: 'Nome do arquivo',
        exportButton: 'Salvar (Ctrl+s)',
        exportCancel: 'Cancelar (Esc)',
        exportSuccess: 'Exportado para',

        // Info
        infoTitle: 'Informações do App',
        infoVersion: 'Versão',
        infoCreator: 'Criador',
        infoGithub: 'Github',
        infoInstructions: 'Use as teclas de seta para rolar.\nA pesquisa filtra dados globalmente.\n\nPressione {bold}Enter{/bold} ou clique para fechar.',

        // Settings
        settingsTitle: 'Configurações',
        settingsBorders: 'Mostrar bordas da tabela',
        settingsTheme: 'Selecionar Tema:',
        settingsLanguage: 'Selecionar Idioma:',
        settingsReset: 'Redefinir Tudo (Ctrl+r)',
        settingsCancel: 'Cancelar (Esc)',
        settingsSave: 'Salvar (Ctrl+s)',
        settingsThemeUpdated: 'Tema atualizado!\nReinicie o aplicativo se você ver artefatos visuais.',
        settingsLanguageUpdated: 'Idioma atualizado!',
        settingsResetMessage: 'Configurações Redefinidas. Por favor, reinicie o aplicativo.',

        // Languages
        languages: {
            en: 'English',
            es: 'Español',
            pt: 'Português'
        },

        // Error Messages
        errorTitle: 'Erro',
        errorFileOpen: 'Não foi possível abrir o arquivo:',
        errorParsing: 'Erro ao analisar CSV:',
        errorUnexpected: 'Erro inesperado:',

        // Confirm Exit
        confirmExitTitle: 'Confirmar Saída',
        confirmExitMessage: 'Tem certeza de que deseja sair?',

        // Loading Messages
        loadingFile: 'Carregando',
        loadedRows: 'Carregado',
        loadedRowsSuffix: 'linhas'
    }
};

// Helper function to get translation
function t(key, lang = 'en') {
    const keys = key.split('.');
    let value = translations[lang];

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return translations.en[key] || key; // Fallback to English
        }
    }

    return value || translations.en[key] || key;
}

module.exports = {
    translations,
    t,
    availableLanguages: ['en', 'es', 'pt']
};
