/**
 * Internationalization (i18n) module
 * Handles language detection, switching, and translation application
 */
class I18n {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'pt';
        this.defaultLanguage = 'pt';
        this.englishSpeakingCountries = [
            'US', 'GB', 'AU', 'CA', 'IE', 'NZ', 'ZA', 'IN', 'PK', 'BD', 'MY', 'SG', 'PH', 'KE', 'UG', 'TZ', 'ZW', 'BW', 'MW', 'ZM', 'MT'
        ];
        
        this.init();
    }

    async init() {
        try {
            await this.loadTranslations();
            await this.detectUserLanguage();
            this.setupLanguageSwitcher();
            this.applyTranslations();
            this.updateMetaTags();
            this.updateDocumentLang();
        } catch (error) {
            console.error('Error initializing i18n:', error);
        }
    }

    async loadTranslations() {
        try {
            const response = await fetch('./js/translations.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            throw error;
        }
    }

    async detectUserLanguage() {
        // Check if user has a saved language preference
        const savedLanguage = localStorage.getItem('preferred-language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
            return;
        }

        try {
            // Try to detect user's country based on their IP
            const countryCode = await this.getUserCountry();
            
            if (countryCode && this.englishSpeakingCountries.includes(countryCode)) {
                this.currentLanguage = 'en';
            } else {
                // Fall back to browser language detection
                this.detectBrowserLanguage();
            }
        } catch (error) {
            console.warn('Geolocation failed, falling back to browser language:', error);
            this.detectBrowserLanguage();
        }

        // Save the detected language
        localStorage.setItem('preferred-language', this.currentLanguage);
    }

    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.languages[0];
        if (browserLang.startsWith('en')) {
            this.currentLanguage = 'en';
        } else {
            this.currentLanguage = this.defaultLanguage;
        }
    }

    async getUserCountry() {
        try {
            // Using a free IP geolocation service
            const response = await fetch('https://ipapi.co/country_code/', {
                timeout: 5000
            });
            
            if (response.ok) {
                const countryCode = await response.text();
                return countryCode.trim().toUpperCase();
            }
        } catch (error) {
            // Fallback to another service if the first one fails
            try {
                const fallbackResponse = await fetch('https://ipinfo.io/country', {
                    timeout: 5000
                });
                
                if (fallbackResponse.ok) {
                    const countryCode = await fallbackResponse.text();
                    return countryCode.trim().toUpperCase();
                }
            } catch (fallbackError) {
                console.warn('Both geolocation services failed:', error, fallbackError);
                throw fallbackError;
            }
        }
        
        throw new Error('Unable to detect country');
    }

    switchLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('preferred-language', language);
            this.applyTranslations();
            this.updateMetaTags();
            this.updateDocumentLang();
            this.updateLanguageSwitcher();
        }
    }

    applyTranslations() {
        // Handle regular data-i18n elements
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Handle data-i18n-attr elements (for attributes like aria-label, alt, etc.)
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(element => {
            const attrMapping = element.getAttribute('data-i18n-attr');
            const [attrName, key] = attrMapping.split(':');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.setAttribute(attrName, translation);
            }
        });

        // Handle special cases for links with dynamic content
        this.updateWhatsAppLinks();
        this.updateSpecialElements();
    }

    updateWhatsAppLinks() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        whatsappLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href.includes('text=')) {
                const baseUrl = href.split('text=')[0] + 'text=';
                const newMessage = encodeURIComponent(this.getTranslation('contact.whatsapp_message'));
                link.setAttribute('href', baseUrl + newMessage);
            }
        });

        // Update "want one" buttons
        const wantOneLinks = document.querySelectorAll('a[href*="quero%20or%C3%A7ar"]');
        wantOneLinks.forEach(link => {
            const baseUrl = link.getAttribute('href').split('text=')[0] + 'text=';
            const newMessage = encodeURIComponent(this.getTranslation('portfolio.want_one_whatsapp'));
            link.setAttribute('href', baseUrl + newMessage);
        });
    }

    updateSpecialElements() {
        // Update About section description with links
        const aboutDesc = document.querySelector('[data-i18n="about.description"]');
        if (aboutDesc) {
            const description = this.getTranslation('about.description');
            const photographyLink = this.getTranslation('about.photography_link');
            const andText = this.getTranslation('about.and');
            const printing3dLink = this.getTranslation('about.printing_3d_link');

            aboutDesc.innerHTML = `${description} <a href="http://instagram.com/macro_martian" target="_blank">${photographyLink}</a> ${andText} <a href="https://www.thingiverse.com/marciofao/designs" target="_blank">${printing3dLink}</a>`;
        }

        // Update common modal buttons that don't have data-i18n attributes
        const visitSiteButtons = document.querySelectorAll('a[class*="btn-primary"][class*="modal-btn"]');
        visitSiteButtons.forEach(button => {
            if (button.textContent.trim().includes('Visitar site') && !button.querySelector('[data-i18n]')) {
                const icon = button.querySelector('i');
                const iconHtml = icon ? icon.outerHTML : '<i class="fa fa-external-link"></i>';
                button.innerHTML = `<span data-i18n="portfolio.visit_site">${this.getTranslation('portfolio.visit_site')}</span> ${iconHtml}`;
            }
        });

        const wantOneButtons = document.querySelectorAll('a[class*="btn-success"][class*="modal-btn"]');
        wantOneButtons.forEach(button => {
            if (button.textContent.includes('Gostei, quero um') && !button.querySelector('[data-i18n]')) {
                const icon = button.querySelector('i');
                const iconHtml = icon ? icon.outerHTML : '<i class="fa fa-rocket"></i>';
                button.innerHTML = `<span data-i18n="portfolio.want_one">${this.getTranslation('portfolio.want_one')}</span> ${iconHtml}`;
            }
        });

        const closeButtons = document.querySelectorAll('a[class*="btn-danger"][class*="modal-btn"][class*="portfolio-modal-dismiss"]');
        closeButtons.forEach(button => {
            if (button.textContent.includes('Fechar') && !button.querySelector('[data-i18n]')) {
                const icon = button.querySelector('i');
                const iconHtml = icon ? icon.outerHTML : '<i class="fa fa-close"></i>';
                button.innerHTML = `${iconHtml} <span data-i18n="portfolio.close">${this.getTranslation('portfolio.close')}</span>`;
            }
        });

        // Handle modal titles that don't have data-i18n attributes
        const modalTitles = document.querySelectorAll('.modal-title');
        modalTitles.forEach(title => {
            if (!title.hasAttribute('data-i18n')) {
                // Add a generic translation for untranslated modal titles
                console.log('Found untranslated modal title:', title.textContent);
            }
        });
    }

    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && typeof translation === 'object' && translation[k] !== undefined) {
                translation = translation[k];
            } else {
                // Fallback to default language
                translation = this.translations[this.defaultLanguage];
                for (const fallbackKey of keys) {
                    if (translation && typeof translation === 'object' && translation[fallbackKey] !== undefined) {
                        translation = translation[fallbackKey];
                    } else {
                        console.warn(`Translation not found for key: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }
        
        return translation;
    }

    updateMetaTags() {
        const title = this.getTranslation('meta.title');
        const description = this.getTranslation('meta.description');

        // Update document title
        document.title = title;

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', description);
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        
        if (ogTitle) ogTitle.setAttribute('content', title);
        if (ogDesc) ogDesc.setAttribute('content', description);

        // Update Twitter tags
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        
        if (twitterTitle) twitterTitle.setAttribute('content', title);
        if (twitterDesc) twitterDesc.setAttribute('content', description);
    }

    updateDocumentLang() {
        document.documentElement.lang = this.currentLanguage === 'pt' ? 'pt-br' : 'en';
    }

    setupLanguageSwitcher() {
        // Create language switcher if it doesn't exist
        const existingSwitcher = document.getElementById('language-switcher');
        if (!existingSwitcher) {
            this.createLanguageSwitcher();
        }
        this.updateLanguageSwitcher();
    }

    createLanguageSwitcher() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            const langSwitcherLi = document.createElement('li');
            langSwitcherLi.className = 'nav-item mx-0 mx-lg-1';
            langSwitcherLi.id = 'language-switcher';
            
            langSwitcherLi.innerHTML = `
                <div class="nav-link py-3 px-0 px-lg-3 rounded">
                    <button id="lang-pt" class="btn btn-sm btn-outline-light me-1" onclick="window.i18n.switchLanguage('pt')" 
                            aria-label="Mudar para Português">PT</button>
                    <button id="lang-en" class="btn btn-sm btn-outline-light" onclick="window.i18n.switchLanguage('en')" 
                            aria-label="Switch to English">EN</button>
                </div>
            `;
            
            navbarNav.appendChild(langSwitcherLi);
        }
    }

    updateLanguageSwitcher() {
        const ptBtn = document.getElementById('lang-pt');
        const enBtn = document.getElementById('lang-en');
        
        if (ptBtn && enBtn) {
            // Remove active class from both
            ptBtn.classList.remove('btn-light');
            ptBtn.classList.add('btn-outline-light');
            enBtn.classList.remove('btn-light');
            enBtn.classList.add('btn-outline-light');
            
            // Add active class to current language
            const activeBtn = this.currentLanguage === 'pt' ? ptBtn : enBtn;
            activeBtn.classList.remove('btn-outline-light');
            activeBtn.classList.add('btn-light');
        }
    }
}

// Initialize the i18n system when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}