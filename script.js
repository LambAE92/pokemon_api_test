document.addEventListener('DOMContentLoaded', () => {
    const pokemonInput = document.getElementById('pokemonInput');
    const searchBtn = document.getElementById('searchBtn');
    const randomBtn = document.getElementById('randomBtn');
    const pokemonCard = document.getElementById('pokemonCard');
    const pokemonImage = document.getElementById('pokemonImage');
    const pokemonName = document.getElementById('pokemonName');
    const pokemonId = document.getElementById('pokemonId');
    const pokemonTypes = document.getElementById('pokemonTypes');
    const pokemonStats = document.getElementById('pokemonStats');
    const errorMessage = document.getElementById('errorMessage');
    
    // New element references
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoritesList = document.getElementById('favoritesList');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const pokemonAbilities = document.getElementById('pokemonAbilities');
    const pokemonMoves = document.getElementById('pokemonMoves');
    
    // Pagination state
    let currentPage = 1;
    const limit = 20;
    let totalPages = 45; // Approximately 898/20
    
    // Favorites state
    let favorites = JSON.parse(localStorage.getItem('pokemonFavorites')) || [];
    
    // Current Pokemon
    let currentPokemon = null;
    
    // Initialize
    updatePaginationControls();
    loadFavorites();
    
    // Event listeners
    searchBtn.addEventListener('click', searchPokemon);
    randomBtn.addEventListener('click', getRandomPokemon);
    pokemonInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPokemon();
        }
    });
    
    // Event listeners (new)
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPokemonList(currentPage);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPokemonList(currentPage);
        }
    });
    
    favoriteBtn.addEventListener('click', toggleFavorite);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
    
    // Fetch initial Pokemon list
    fetchPokemonList(currentPage);
    
    // Function to search for a Pokémon
    function searchPokemon() {
        const query = pokemonInput.value.trim().toLowerCase();
        
        if (!query) {
            showError('Please enter a Pokémon name or ID');
            return;
        }
        
        fetchPokemon(query);
    }

    // Function to get a random Pokémon
    function getRandomPokemon() {
        // There are currently 898 Pokémon in the National Pokédex
        const randomId = Math.floor(Math.random() * 898) + 1;
        fetchPokemon(randomId);
    }

    // Function to fetch Pokémon data from the API
    function fetchPokemon(query) {
        hideError();
        
        fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Pokémon not found');
                }
                return response.json();
            })
            .then(data => {
                currentPokemon = data;
                displayPokemon(data);
                fetchPokemonAbilities(data);
                updateFavoriteButton();
            })
            .catch(error => {
                showError(error.message);
                pokemonCard.classList.add('hidden');
            });
    }

    // Function to fetch Pokemon list for pagination
    function fetchPokemonList(page) {
        const offset = (page - 1) * limit;
        
        fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                displayPokemonList(data.results);
                updatePaginationControls();
            })
            .catch(error => {
                showError('Failed to load Pokémon list');
            });
    }

    // Function to display Pokemon list
    function displayPokemonList(pokemonList) {
        // Clear any existing Pokemon card
        pokemonCard.classList.add('hidden');
        
        // Create a list of Pokemon to display
        const listContainer = document.createElement('div');
        listContainer.classList.add('pokemon-list');
        
        pokemonList.forEach(pokemon => {
            const pokemonItem = document.createElement('div');
            pokemonItem.classList.add('pokemon-list-item');
            
            // Extract the Pokemon ID from the URL
            const id = pokemon.url.split('/')[6];
            
            pokemonItem.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${pokemon.name}">
                <p>${pokemon.name}</p>
            `;
            
            pokemonItem.addEventListener('click', () => {
                fetchPokemon(pokemon.name);
            });
            
            listContainer.appendChild(pokemonItem);
        });
        
        // Replace any existing list
        const existingList = document.querySelector('.pokemon-list');
        if (existingList) {
            existingList.remove();
        }
        
        // Add the new list before the error message
        document.querySelector('.container').insertBefore(listContainer, errorMessage);
        
        // Update page info
        pageInfo.textContent = `Page ${currentPage}`;
    }

    // Function to update pagination controls
    function updatePaginationControls() {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // Function to display Pokémon data
    function displayPokemon(pokemon) {
        // Set Pokémon image
        pokemonImage.src = pokemon.sprites.other['official-artwork'].front_default || 
                          pokemon.sprites.front_default;
        
        // Set Pokémon name and ID
        pokemonName.textContent = pokemon.name;
        pokemonId.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
        
        // Set Pokémon types
        pokemonTypes.innerHTML = '';
        pokemon.types.forEach(typeInfo => {
            const typeElement = document.createElement('span');
            typeElement.textContent = typeInfo.type.name;
            typeElement.classList.add('type', typeInfo.type.name);
            pokemonTypes.appendChild(typeElement);
        });
        
        // Set Pokémon stats
        pokemonStats.innerHTML = '';
        pokemon.stats.forEach(statInfo => {
            const statElement = document.createElement('div');
            statElement.classList.add('stat');
            
            const statName = document.createElement('span');
            statName.classList.add('stat-name');
            statName.textContent = formatStatName(statInfo.stat.name);
            
            const statValue = document.createElement('span');
            statValue.classList.add('stat-value');
            statValue.textContent = statInfo.base_stat;
            
            statElement.appendChild(statName);
            statElement.appendChild(statValue);
            pokemonStats.appendChild(statElement);
        });
        
        // Set Pokémon moves
        pokemonMoves.innerHTML = '';
        pokemon.moves.slice(0, 20).forEach(moveInfo => {
            const moveElement = document.createElement('div');
            moveElement.classList.add('move');
            moveElement.textContent = formatMoveName(moveInfo.move.name);
            pokemonMoves.appendChild(moveElement);
        });
        
        // Remove any existing weaknesses tab and pane first
        const existingWeaknessesTab = document.querySelector('.tab-btn[data-tab="weaknesses"]');
        if (existingWeaknessesTab) {
            existingWeaknessesTab.remove();
        }
        
        const existingWeaknessesPane = document.getElementById('weaknessesTab');
        if (existingWeaknessesPane) {
            existingWeaknessesPane.remove();
        }
        
        // Add type weaknesses tab
        const weaknessesTab = document.createElement('button');
        weaknessesTab.classList.add('tab-btn');
        weaknessesTab.setAttribute('data-tab', 'weaknesses');
        weaknessesTab.textContent = 'Weaknesses';
        document.querySelector('.tabs').appendChild(weaknessesTab);
        
        // Add click event listener to the new tab
        weaknessesTab.addEventListener('click', () => {
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            weaknessesTab.classList.add('active');
            
            // Update active tab pane
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById('weaknessesTab').classList.add('active');
        });
        
        // Add weaknesses pane
        const weaknessesPane = document.createElement('div');
        weaknessesPane.id = 'weaknessesTab';
        weaknessesPane.classList.add('tab-pane');
        weaknessesPane.innerHTML = '<div class="pokemon-weaknesses" id="pokemonWeaknesses"></div>';
        document.querySelector('.tab-content').appendChild(weaknessesPane);
        
        // Calculate and display weaknesses
        calculateWeaknesses(pokemon.types.map(t => t.type.name));
        
        // Reset to stats tab
        tabBtns[0].click();
        
        // Show the Pokémon card
        pokemonCard.classList.remove('hidden');
        
        // Hide any Pokemon list
        const pokemonList = document.querySelector('.pokemon-list');
        if (pokemonList) {
            pokemonList.style.display = 'none';
        }
    }

    // Function to fetch Pokemon abilities with descriptions
    function fetchPokemonAbilities(pokemon) {
        pokemonAbilities.innerHTML = '<p>Loading abilities...</p>';
        
        const abilityPromises = pokemon.abilities.map(abilityInfo => 
            fetch(abilityInfo.ability.url).then(response => response.json())
        );
        
        Promise.all(abilityPromises)
            .then(abilities => {
                pokemonAbilities.innerHTML = '';
                
                abilities.forEach(ability => {
                    const abilityElement = document.createElement('div');
                    abilityElement.classList.add('ability');
                    
                    const nameElement = document.createElement('div');
                    nameElement.classList.add('ability-name');
                    nameElement.textContent = formatMoveName(ability.name);
                    
                    const descriptionElement = document.createElement('div');
                    descriptionElement.classList.add('ability-description');
                    
                    // Find English description
                    const englishEntry = ability.effect_entries.find(entry => entry.language.name === 'en');
                    descriptionElement.textContent = englishEntry ? 
                        englishEntry.effect : 
                        'No description available.';
                    
                    abilityElement.appendChild(nameElement);
                    abilityElement.appendChild(descriptionElement);
                    pokemonAbilities.appendChild(abilityElement);
                });
            })
            .catch(error => {
                pokemonAbilities.innerHTML = '<p>Failed to load abilities.</p>';
            });
    }

    // Function to toggle favorite status
    function toggleFavorite() {
        if (!currentPokemon) return;
        
        const pokemonId = currentPokemon.id;
        const isFavorite = favorites.includes(pokemonId);
        
        if (isFavorite) {
            // Remove from favorites
            favorites = favorites.filter(id => id !== pokemonId);
            favoriteBtn.classList.remove('active');
        } else {
            // Add to favorites
            favorites.push(pokemonId);
            favoriteBtn.classList.add('active');
        }
        
        // Save to localStorage
        localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));
        
        // Update favorites list
        loadFavorites();
    }

    // Function to update favorite button state
    function updateFavoriteButton() {
        if (!currentPokemon) return;
        
        const isFavorite = favorites.includes(currentPokemon.id);
        
        if (isFavorite) {
            favoriteBtn.classList.add('active');
        } else {
            favoriteBtn.classList.remove('active');
        }
    }

    // Function to load favorites
    function loadFavorites() {
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p>No favorites yet.</p>';
            return;
        }
        
        // Fetch data for each favorite Pokemon
        favorites.forEach(id => {
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                .then(response => response.json())
                .then(pokemon => {
                    const favoriteItem = document.createElement('div');
                    favoriteItem.classList.add('favorite-item');
                    favoriteItem.textContent = pokemon.name;
                    
                    favoriteItem.addEventListener('click', () => {
                        fetchPokemon(pokemon.id);
                    });
                    
                    favoritesList.appendChild(favoriteItem);
                })
                .catch(error => {
                    console.error(`Failed to load favorite Pokemon #${id}`);
                });
        });
    }

    // Helper function to format stat names
    function formatStatName(statName) {
        switch (statName) {
            case 'hp':
                return 'HP';
            case 'attack':
                return 'ATK';
            case 'defense':
                return 'DEF';
            case 'special-attack':
                return 'SP.ATK';
            case 'special-defense':
                return 'SP.DEF';
            case 'speed':
                return 'SPD';
            default:
                return statName;
        }
    }

    // Helper function to format move names
    function formatMoveName(name) {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    // Function to hide error message
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Function to calculate weaknesses
    function calculateWeaknesses(types) {
        const weaknessesContainer = document.getElementById('pokemonWeaknesses');
        weaknessesContainer.innerHTML = '<p>Calculating weaknesses...</p>';
        
        // Type effectiveness chart
        const typeChart = {
            normal: { weakTo: ['fighting'], resistantTo: [], immuneTo: ['ghost'] },
            fire: { weakTo: ['water', 'ground', 'rock'], resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immuneTo: [] },
            water: { weakTo: ['electric', 'grass'], resistantTo: ['fire', 'water', 'ice', 'steel'], immuneTo: [] },
            electric: { weakTo: ['ground'], resistantTo: ['electric', 'flying', 'steel'], immuneTo: [] },
            grass: { weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'], resistantTo: ['water', 'electric', 'grass', 'ground'], immuneTo: [] },
            ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], resistantTo: ['ice'], immuneTo: [] },
            fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistantTo: ['bug', 'rock', 'dark'], immuneTo: [] },
            poison: { weakTo: ['ground', 'psychic'], resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immuneTo: [] },
            ground: { weakTo: ['water', 'grass', 'ice'], resistantTo: ['poison', 'rock'], immuneTo: ['electric'] },
            flying: { weakTo: ['electric', 'ice', 'rock'], resistantTo: ['grass', 'fighting', 'bug'], immuneTo: ['ground'] },
            psychic: { weakTo: ['bug', 'ghost', 'dark'], resistantTo: ['fighting', 'psychic'], immuneTo: [] },
            bug: { weakTo: ['fire', 'flying', 'rock'], resistantTo: ['grass', 'fighting', 'ground'], immuneTo: [] },
            rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], resistantTo: ['normal', 'fire', 'poison', 'flying'], immuneTo: [] },
            ghost: { weakTo: ['ghost', 'dark'], resistantTo: ['poison', 'bug'], immuneTo: ['normal', 'fighting'] },
            dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistantTo: ['fire', 'water', 'electric', 'grass'], immuneTo: [] },
            dark: { weakTo: ['fighting', 'bug', 'fairy'], resistantTo: ['ghost', 'dark'], immuneTo: ['psychic'] },
            steel: { weakTo: ['fire', 'fighting', 'ground'], resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immuneTo: ['poison'] },
            fairy: { weakTo: ['poison', 'steel'], resistantTo: ['fighting', 'bug', 'dark'], immuneTo: ['dragon'] }
        };
        
        // Calculate effectiveness for each attacking type
        let effectiveness = {};
        
        Object.keys(typeChart).forEach(attackingType => {
            let multiplier = 1;
            
            types.forEach(defenderType => {
                if (typeChart[defenderType].weakTo.includes(attackingType)) {
                    multiplier *= 2;
                }
                if (typeChart[defenderType].resistantTo.includes(attackingType)) {
                    multiplier *= 0.5;
                }
                if (typeChart[defenderType].immuneTo.includes(attackingType)) {
                    multiplier = 0;
                }
            });
            
            effectiveness[attackingType] = multiplier;
        });
        
        // Display weaknesses (types that deal 2x or 4x damage)
        weaknessesContainer.innerHTML = '';
        
        const weaknesses = Object.entries(effectiveness)
            .filter(([type, multiplier]) => multiplier > 1)
            .sort((a, b) => b[1] - a[1]);
        
        if (weaknesses.length === 0) {
            weaknessesContainer.innerHTML = '<p>No weaknesses found.</p>';
            return;
        }
        
        const weaknessesElement = document.createElement('div');
        weaknessesElement.classList.add('weaknesses-list');
        
        weaknesses.forEach(([type, multiplier]) => {
            const weaknessItem = document.createElement('div');
            weaknessItem.classList.add('weakness-item');
            
            const typeElement = document.createElement('span');
            typeElement.classList.add('type', type);
            typeElement.textContent = type;
            
            const multiplierElement = document.createElement('span');
            multiplierElement.classList.add('multiplier');
            multiplierElement.textContent = `${multiplier}x`;
            
            weaknessItem.appendChild(typeElement);
            weaknessItem.appendChild(multiplierElement);
            weaknessesElement.appendChild(weaknessItem);
        });
        
        weaknessesContainer.appendChild(weaknessesElement);
    }
}); 