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
        }
    }

    // Save selection to localStorage - NOTE: localStorage not supported in Claude artifacts
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedMachine', machine);
    }
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
    
    // Save view selection to localStorage - NOTE: localStorage not supported in Claude artifacts
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentView', view);
    }
}

function findMatches(searchTerm) {
    if (!searchTerm) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Maak de zoekterm lowercase voor case-insensitive zoeken
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    const matches = vspData[currentMachine].vsp_lijst.filter(item => {
        // Zoek op E-Circuit nummer (bestaande functionaliteit)
        const normalizedECircuit = item.E_Circuit.replace('15E', '').replace('.', '').toLowerCase();
        const matchesECircuit = normalizedECircuit.includes(normalizedSearch.replace('15E', '').replace('.', ''));
        
        // Zoek op Machineonderdeel naam (nieuwe functionaliteit)
        const normalizedMachineonderdeel = item.Machineonderdeel.toLowerCase();
        const matchesMachineonderdeel = normalizedMachineonderdeel.includes(normalizedSearch);
        
        // Return true als een van beide matches
        return matchesECircuit || matchesMachineonderdeel;
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
            const response = await fetch('procedures/pm2_procedures.json');
            proceduresData[currentMachine] = await response.json();
        }
        
        const select = document.getElementById('procedureSelect');
        select.innerHTML = '<option value="">Selecteer een procedure...</option>';
        
        // Groepeer procedures per type
        const groupedProcedures = {};
        proceduresData[currentMachine].procedures.forEach(proc => {
            if (!groupedProcedures[proc.type]) {
                groupedProcedures[proc.type] = [];
            }
            groupedProcedures[proc.type].push(proc);
        });

        // Voeg procedures toe per groep
        Object.keys(groupedProcedures).sort().forEach(type => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;
            
            groupedProcedures[type].forEach(proc => {
                const option = document.createElement('option');
                option.value = proc.id;
                option.textContent = proc.title;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    } catch (error) {
        console.error('Error loading procedures:', error);
        document.getElementById('procedureSelect').innerHTML = '<option value="">Geen procedures beschikbaar</option>';
    }
}

document.getElementById('procedureSelect').addEventListener('change', async (e) => {
    const procedureId = e.target.value;
    if (!procedureId) {
        return;
    }
    
    try {
        // Vind de geselecteerde procedure
        const procedure = proceduresData[currentMachine].procedures.find(
            p => p.id === procedureId
        );
        
        if (procedure) {
            console.log('Downloading:', procedure.filename); // Debug log
            const response = await fetch(`procedures/${procedure.filename}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Maak een downloadlink
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = procedure.filename;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        }
    } catch (error) {
        console.error('Error downloading procedure:', error);
        alert('Er ging iets mis bij het downloaden van de procedure. ' + error.message);
    }
});

// Event listeners
searchInput.addEventListener('input', (e) => {
    findMatches(e.target.value);
    // Save search term to localStorage - NOTE: localStorage not supported in Claude artifacts
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lastSearch', e.target.value);
    }
});

// Load saved state
window.addEventListener('load', async () => {
    // Load saved machine selection - NOTE: localStorage not supported in Claude artifacts
    if (typeof localStorage !== 'undefined') {
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