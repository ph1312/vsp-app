let currentMachine = 'pm2';
const vspData = {
    pm1: { vsp_lijst: [] },
    pm2: { vsp_lijst: [] },
    pulp: { vsp_lijst: [] }
};

const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const pm1Button = document.getElementById('pm1Button');
const pm2Button = document.getElementById('pm2Button');

function selectMachine(machine) {
    currentMachine = machine;
    
    // Update buttons
    pm1Button.classList.toggle('active', machine === 'pm1');
    pm2Button.classList.toggle('active', machine === 'pm2');
    
    // Update zoekresultaten
    findMatches(searchInput.value);

    // Save selection to localStorage
    localStorage.setItem('selectedMachine', machine);
}

function findMatches(searchTerm) {
    if (!searchTerm) {
        resultsDiv.innerHTML = '';
        return;
    }

    const normalizedSearch = searchTerm.replace('15E', '').replace('.', '');
    
    const matches = vspData[currentMachine].vsp_lijst.filter(item => {
        const normalizedItem = item.E_Circuit.replace('15E', '').replace('.', '');
        return normalizedItem.includes(normalizedSearch);
    });

    displayResults(matches);
}

function displayResults(matches) {
    resultsDiv.innerHTML = matches.map(item => `
        <div class="result-card">
            <img src="https://i.ibb.co/5jFg0jq/Schermafbeelding-2025-01-23-201422.png" class="thumbnail">
            <div class="card-title">${item.Machineonderdeel}</div>
            <div class="card-field">E-Nummer: ${item.E_Circuit}</div>
            <div class="card-field">MCC: ${item.Locatie}</div>
            <div class="card-field">Kast: ${item.Kast}</div>
            <div class="card-field">Lade: ${item.Lade}</div>
        </div>
    `).join('');
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    findMatches(e.target.value);
    // Save search term to localStorage
    localStorage.setItem('lastSearch', e.target.value);
});

// Load saved state
window.addEventListener('load', () => {
    const savedMachine = localStorage.getItem('selectedMachine');
    if (savedMachine) {
        selectMachine(savedMachine);
    }

    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
        searchInput.value = lastSearch;
        findMatches(lastSearch);
    }
});

// Laad beide JSON bestanden
Promise.all([
    fetch('pm1_vsp_lijst.json').then(response => response.json()),
    fetch('pm2_vsp_lijst.json').then(response => response.json()),
    fetch('vsp_lijstcentralepulp.json').then(response => response.json())
]).then(([pm1Data, pm2Data, pulpData]) => {
    vspData.pm1 = pm1Data;
    vspData.pm2 = pm2Data;
    vspData.pulp = pulpData;
    // Start met PM2 geselecteerd
    findMatches(searchInput.value);
}).catch(error => console.error('Error loading data:', error));