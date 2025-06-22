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

// Maak variabelen beschikbaar voor debugging
window.currentMachine = currentMachine;
window.vspData = vspData;

function selectMachine(machine) {
    currentMachine = machine;
    window.currentMachine = machine; // Update window variable
    
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

    // Save selection to localStorage
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
    
    // Save view selection to localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentView', view);
    }
}

function findMatches(searchTerm) {
    if (!searchTerm) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Check of data beschikbaar is
    if (!vspData[currentMachine] || !vspData[currentMachine].vsp_lijst) {
        console.log('Data not loaded yet for machine:', currentMachine);
        resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center;">Data wordt geladen...</div>';
        return;
    }

    // Maak de zoekterm lowercase en trim spaties
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    console.log('Searching for:', `"${normalizedSearch}"`, 'in machine:', currentMachine);
    console.log('Available data items:', vspData[currentMachine].vsp_lijst.length);
    
    const matches = vspData[currentMachine].vsp_lijst.filter(item => {
        // Check of item en vereiste velden bestaan
        if (!item || !item.E_Circuit || !item.Machineonderdeel) {
            return false;
        }
        
        // Zoek op E-Circuit nummer (bestaande functionaliteit)
        let matchesECircuit = false;
        try {
            const normalizedECircuit = item.E_Circuit.toString().replace(/15E/gi, '').replace(/\./g, '').toLowerCase();
            const searchWithoutPrefix = normalizedSearch.replace(/15e/gi, '').replace(/\./g, '');
            matchesECircuit = normalizedECircuit.includes(searchWithoutPrefix);
        } catch (e) {
            console.log('Error processing E_Circuit:', item.E_Circuit);
        }
        
        // Zoek op Machineonderdeel naam - verbeterde matching
        let matchesMachineonderdeel = false;
        try {
            const normalizedMachineonderdeel = item.Machineonderdeel.toString().toLowerCase().trim();
            matchesMachineonderdeel = normalizedMachineonderdeel.includes(normalizedSearch);
        } catch (e) {
            console.log('Error processing Machineonderdeel:', item.Machineonderdeel);
        }
        
        // Debug logging voor eerste match die we vinden
        if (matchesMachineonderdeel && matches.length < 1) {
            console.log('Found name match:', {
                original: item.Machineonderdeel,
                normalized: item.Machineonderdeel.toString().toLowerCase().trim(),
                searchTerm: normalizedSearch,
                result: 'MATCH!'
            });
        }
        
        return matchesECircuit || matchesMachineonderdeel;
    });

    console.log('Total matches found:', matches.length);
    if (matches.length > 0) {
        console.log('First match example:', matches[0].Machineonderdeel);
    }
    displayResults(matches);
}

function displayResults(matches) {
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Geen resultaten gevonden</div>';
        return;
    }
    
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
    // Save search term to localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lastSearch', e.target.value);
    }
});

// Load saved state
window.addEventListener('load', async () => {
    // Load saved machine selection
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
    
    console.log('Data loaded successfully:');
    console.log('PM1:', pm1Data.vsp_lijst ? pm1Data.vsp_lijst.length + ' items' : 'No data');
    console.log('PM2:', pm2Data.vsp_lijst ? pm2Data.vsp_lijst.length + ' items' : 'No data');
    console.log('PULP:', pulpData.vsp_lijst ? pulpData.vsp_lijst.length + ' items' : 'No data');
    
    // Start met PM2 geselecteerd
    findMatches(searchInput.value);
}).catch(error => {
    console.error('Error loading data:', error);
    resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Fout bij laden van data</div>';
});