let currentMachine = 'pm2';
let currentView = 'vsp';
const vspData = {
    pm1: { vsp_lijst: [] },
    pm2: { vsp_lijst: [] },
    pulp: { vsp_lijst: [] }
};
const proceduresData = {};

const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const pm1Button = document.getElementById('pm1Button');
const pm2Button = document.getElementById('pm2Button');
const pulpButton = document.getElementById('pulpButton');

function selectMachine(machine) {
    currentMachine = machine;
    
    // Update buttons
    pm1Button.classList.toggle('active', machine === 'pm1');
    pm2Button.classList.toggle('active', machine === 'pm2');
    pulpButton.classList.toggle('active', machine === 'pulp');
    
    // Update content based on current view
    if (currentView === 'vsp') {
        findMatches(searchInput.value);
    } else if (currentView === 'procedures') {
        // Alleen procedures laden voor PM2
        if (machine === 'pm2') {
            loadProcedures();
        } else {
            document.getElementById('procedureSelect').innerHTML = '<option value="">Selecteer eerst PM2...</option>';
            document.getElementById('procedureContent').innerHTML = '';
        }
    }

    // Save selection to localStorage
    localStorage.setItem('selectedMachine', machine);
}

function selectView(view) {
    currentView = view;
    document.getElementById('vspButton').classList.toggle('active', view === 'vsp');
    document.getElementById('proceduresButton').classList.toggle('active', view === 'procedures');
    
    // Toon/verberg relevante secties
    document.querySelector('.search-container').style.display = view === 'vsp' ? 'block' : 'none';
    document.getElementById('proceduresSection').style.display = view === 'procedures' ? 'block' : 'none';
    
    // Als we naar procedures gaan en PM2 is geselecteerd, laad de procedures
    if (view === 'procedures' && currentMachine === 'pm2') {
        loadProcedures();
    }
    
    // Save view selection to localStorage
    localStorage.setItem('currentView', view);
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

async function loadProcedures() {
    try {
        if (!proceduresData[currentMachine]) {
            const response = await fetch(`${currentMachine}_procedures.json`);
            proceduresData[currentMachine] = await response.json();
        }
        
        const select = document.getElementById('procedureSelect');
        select.innerHTML = '<option value="">Selecteer een procedure...</option>';
        
        proceduresData[currentMachine].procedures.forEach(proc => {
            const option = document.createElement('option');
            option.value = proc.id;
            option.textContent = proc.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading procedures:', error);
        document.getElementById('procedureSelect').innerHTML = '<option value="">Geen procedures beschikbaar</option>';
    }
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    findMatches(e.target.value);
    // Save search term to localStorage
    localStorage.setItem('lastSearch', e.target.value);
});

document.getElementById('procedureSelect').addEventListener('change', async (e) => {
    const procedureId = e.target.value;
    if (!procedureId) {
        document.getElementById('procedureContent').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`procedures/${procedureId}.html`);
        const content = await response.text();
        document.getElementById('procedureContent').innerHTML = content;
        // Save last viewed procedure
        localStorage.setItem('lastProcedure', procedureId);
    } catch (error) {
        console.error('Error loading procedure content:', error);
        document.getElementById('procedureContent').innerHTML = '<p>Fout bij het laden van de procedure.</p>';
    }
});

// Load saved state
window.addEventListener('load', async () => {
    // Load saved machine selection
    const savedMachine = localStorage.getItem('selectedMachine');
    if (savedMachine) {
        selectMachine(savedMachine);
    }

    // Load saved view selection
    const savedView = localStorage.getItem('currentView');
    if (savedView) {
        selectView(savedView);
    }

    // Load saved search term
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
        searchInput.value = lastSearch;
        findMatches(lastSearch);
    }

    // Load last viewed procedure if we're in procedures view
    if (currentView === 'procedures' && currentMachine === 'pm2') {
        const lastProcedure = localStorage.getItem('lastProcedure');
        if (lastProcedure) {
            await loadProcedures();
            document.getElementById('procedureSelect').value = lastProcedure;
            const event = new Event('change');
            document.getElementById('procedureSelect').dispatchEvent(event);
        }
    }
});

// Laad VSP data
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