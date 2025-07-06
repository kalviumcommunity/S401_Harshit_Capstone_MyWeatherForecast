class WeatherApp {
    constructor() {
        this.apiKey = CONFIG.WEATHER_API_KEY; // Replace with your actual API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.iconBaseUrl = 'https://openweathermap.org/img/wn/';
        
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.weatherContainer = document.getElementById('weatherContainer');
        this.weatherBg = document.getElementById('weatherBg');
        
        this.searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
        this.defaultCity = localStorage.getItem('defaultCity') || 'London';
        
        this.init();
    }

    init() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Load default city weather on page load
        this.getWeather(this.defaultCity);
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.getWeather(city);
        this.cityInput.value = '';
    }

    async getWeather(city) {
        try {
            this.showLoading();
            
            // GET API - Fetch weather data
            const response = await fetch(`${this.baseUrl}?q=${city}&appid=${this.apiKey}&units=metric`);
            
            if (!response.ok) {
                throw new Error(`Weather data not found for ${city}`);
            }

            const data = await response.json();
            this.displayWeather(data);
            this.updateBackground(data.weather[0].main.toLowerCase());
            
            // Save to search history (POST API simulation)
            await this.saveSearchHistory(city);
            
            // Update default city (PUT API simulation)
            await this.updateDefaultCity(city);
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            this.showError(error.message);
            this.showNotification('Failed to load weather data', 'error');
        }
    }

    showLoading() {
        this.weatherContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>Loading weather data...</p>
            </div>
        `;
    }

    displayWeather(data) {
        const iconUrl = `${this.iconBaseUrl}${data.weather[0].icon}@4x.png`;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Format temperatures with 2 decimal places
        const currentTemp = data.main.temp.toFixed(2);
        const feelsLike = data.main.feels_like.toFixed(2);
        const minTemp = data.main.temp_min.toFixed(2) - 7.5;
        const maxTemp = data.main.temp_max.toFixed(2);

        this.weatherContainer.innerHTML = `
            <div class="weather-card">
                <div class="weather-main">
                    <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
                    <div class="weather-info">
                        <h2>${data.name}, ${data.sys.country}</h2>
                        <div class="description">${data.weather[0].description}</div>
                        <div class="feels-like">Feels like ${feelsLike}°C</div>
                    </div>
                    <div class="temperature">${currentTemp}°C</div>
                </div>

                <div class="weather-details">
                    <div class="detail-item">
                        <i class="fas fa-thermometer-half"></i>
                        <div class="label">Min / Max</div>
                        <div class="value">${minTemp}° / ${maxTemp}°</div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-tint"></i>
                        <div class="label">Humidity</div>
                        <div class="value">${data.main.humidity}%</div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-gauge-high"></i>
                        <div class="label">Pressure</div>
                        <div class="value">${data.main.pressure} hPa</div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-wind"></i>
                        <div class="label">Wind Speed</div>
                        <div class="value">${data.wind.speed.toFixed(2)} m/s</div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-eye"></i>
                        <div class="label">Visibility</div>
                        <div class="value">${(data.visibility / 1000).toFixed(2)} km</div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-compass"></i>
                        <div class="label">Wind Direction</div>
                        <div class="value">${data.wind.deg || 0}°</div>
                    </div>
                </div>

                <div class="sun-times">
                    <div class="sun-item sunrise">
                        <i class="fas fa-sun"></i>
                        <div class="label">Sunrise</div>
                        <div class="value">${sunrise}</div>
                    </div>
                    <div class="sun-item sunset">
                        <i class="fas fa-moon"></i>
                        <div class="label">Sunset</div>
                        <div class="value">${sunset}</div>
                    </div>
                </div>
            </div>
        `;
        

        // Animate card appearance
        setTimeout(() => {
            const card = document.querySelector('.weather-card');
            if (card) card.classList.add('show');
        }, 100);
    }

    updateBackground(weatherCondition) {
        // Remove all weather background classes and body classes
        this.weatherBg.className = 'weather-bg';
        document.body.classList.remove('clear-weather', 'cloudy-weather');
        
        // Add appropriate background based on weather condition
        switch (weatherCondition) {
            case 'clear':
                this.weatherBg.classList.add('clear-bg');
                document.body.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)';
                document.body.classList.add('clear-weather');
                break;
            case 'clouds':
                this.weatherBg.classList.add('clouds-bg');
                document.body.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
                document.body.classList.add('cloudy-weather');
                break;
            case 'rain':
            case 'drizzle':
                this.weatherBg.classList.add('rain-bg');
                document.body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
                break;
            case 'snow':
                this.weatherBg.classList.add('snow-bg');
                document.body.style.background = 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)';
                break;
            case 'thunderstorm':
                this.weatherBg.classList.add('thunderstorm-bg');
                document.body.style.background = 'linear-gradient(135deg, #434343 0%, #000000 100%)';
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                this.weatherBg.classList.add('mist-bg');
                document.body.style.background = 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)';
                break;
            default:
                document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    // POST API - Simulate saving search history
    async saveSearchHistory(city) {
        try {
            const searchData = {
                city: city,
                timestamp: new Date().toISOString(),
                userId: 'user123' // Mock user ID
            };

            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Search history saved:', result);
                
                // Save to local storage as well
                this.searchHistory.unshift(city);
                this.searchHistory = [...new Set(this.searchHistory)]; // Remove duplicates
                this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10
                localStorage.setItem('weatherSearchHistory', JSON.stringify(this.searchHistory));
                
                this.showNotification(`📍 ${city} added to search history`, 'success');
            }
        } catch (error) {
            console.error('❌ Error saving search history:', error);
        }
    }

    // PUT API - Simulate updating default city preference
    async updateDefaultCity(city) {
        try {
            const updateData = {
                userId: 'user123',
                defaultCity: city,
                updatedAt: new Date().toISOString()
            };

            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Default city updated:', result);
                
                // Save to local storage
                const previousDefault = this.defaultCity;
                localStorage.setItem('defaultCity', city);
                this.defaultCity = city;
                
                if (previousDefault !== city) {
                    this.showNotification(`🏠 Default city changed to ${city}`, 'info');
                }
            }
        } catch (error) {
            console.error('❌ Error updating default city:', error);
        }
    }

    showError(message) {
        this.weatherContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <small>Please check the city name and try again</small>
            </div>
        `;
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = '';
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                icon = 'fas fa-exclamation-circle';
                break;
            case 'info':
                icon = 'fas fa-info-circle';
                break;
            default:
                icon = 'fas fa-bell';
        }

        notification.innerHTML = `
            <i class="${icon}"></i>
            ${message}
            <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 500);
        }, 4000);
    }
}

// Initialize the weather app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode for when API key is not provided
if (!window.location.search.includes('demo=false')) {
    // console.log('🌟 Demo Mode: Replace YOUR_OPENWEATHERMAP_API_KEY with your actual API key from https://openweathermap.org/api');
    console.log('📝 API Operations:');
    console.log('   GET: Fetching weather data from OpenWeatherMap API');
    console.log('   POST: Saving search history to mock backend');
    console.log('   PUT: Updating user default city preference');
}