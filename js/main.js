/**
 * MAIN.JS - Script principal de l'interface utilisateur
 * =====================================================
 * Gestion du formulaire multi-étapes, interactions et affichage des résultats
 */

// Configuration
const CONFIG = {
    webhookUrl: 'YOUR_N8N_WEBHOOK_URL', // À remplacer par l'URL du webhook N8N
    totalSteps: 7,
    animationDuration: 300
};

// État global
let currentStep = 1;
let referenceCount = 1;
let formData = {};

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initForm();
    initChargesCalculation();
    updateProgress();
});

function initForm() {
    const form = document.getElementById('diagnosticForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function initChargesCalculation() {
    // Calcul automatique des charges
    const chargeInputs = ['chargesAchats', 'chargesMainOeuvre', 'chargesImpots'];
    chargeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateChargesTotal);
        }
    });
    
    // Mise à jour du montant HT pour le calcul de la marge
    const montantHTInput = document.getElementById('montantHT');
    if (montantHTInput) {
        montantHTInput.addEventListener('input', updateChargesTotal);
    }
}

// ============================================
// NAVIGATION DU FORMULAIRE
// ============================================

function nextStep(step) {
    if (!validateStep(step)) {
        return;
    }
    
    const currentStepEl = document.getElementById(`step${step}`);
    const nextStepEl = document.getElementById(`step${step + 1}`);
    
    if (currentStepEl && nextStepEl) {
        currentStepEl.classList.remove('active');
        nextStepEl.classList.add('active');
        currentStep = step + 1;
        updateProgress();
        scrollToForm();
    }
}

function prevStep(step) {
    const currentStepEl = document.getElementById(`step${step}`);
    const prevStepEl = document.getElementById(`step${step - 1}`);
    
    if (currentStepEl && prevStepEl) {
        currentStepEl.classList.remove('active');
        prevStepEl.classList.add('active');
        currentStep = step - 1;
        updateProgress();
        scrollToForm();
    }
}

function updateProgress() {
    // Mise à jour de la barre de progression
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const percentage = (currentStep / CONFIG.totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    // Mise à jour des étapes
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

function scrollToForm() {
    const formSection = document.getElementById('diagnostic-form');
    if (formSection) {
        const headerOffset = 100;
        const elementPosition = formSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ============================================
// VALIDATION DES ÉTAPES
// ============================================

function validateStep(step) {
    const stepEl = document.getElementById(`step${step}`);
    if (!stepEl) return true;
    
    const requiredFields = stepEl.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            field.addEventListener('input', () => field.classList.remove('error'), { once: true });
        }
    });
    
    if (!isValid) {
        showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
    }
    
    return isValid;
}

// ============================================
// GESTION DES RÉFÉRENCES TECHNIQUES
// ============================================

function addReference() {
    if (referenceCount >= 5) {
        showNotification('Maximum 5 références autorisées.', 'warning');
        return;
    }
    
    referenceCount++;
    const container = document.getElementById('referencesContainer');
    
    const newRef = document.createElement('div');
    newRef.className = 'reference-card';
    newRef.id = `reference${referenceCount}`;
    newRef.innerHTML = `
        <div class="reference-header">
            <span class="reference-number">Référence #${referenceCount}</span>
            <button type="button" class="btn-icon remove-reference" onclick="removeReference(${referenceCount})">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Intitulé du marché</label>
                <input type="text" name="ref${referenceCount}_intitule" placeholder="Description du marché réalisé">
            </div>
            <div class="form-group">
                <label>Montant HT (FCFA)</label>
                <input type="number" name="ref${referenceCount}_montant" min="0" placeholder="Ex: 30000000">
            </div>
            <div class="form-group">
                <label>Type de client</label>
                <select name="ref${referenceCount}_typeClient">
                    <option value="">Sélectionnez...</option>
                    <option value="public">Public / État</option>
                    <option value="grand_groupe">Grand groupe / Multinationale</option>
                    <option value="pme">PME</option>
                    <option value="particulier">Particulier / TPE</option>
                </select>
            </div>
            <div class="form-group">
                <label>Année de réalisation</label>
                <input type="number" name="ref${referenceCount}_annee" min="2000" max="2026" placeholder="Ex: 2024">
            </div>
        </div>
    `;
    
    container.appendChild(newRef);
    
    // Montrer le bouton de suppression de la première référence si on a plus d'une
    if (referenceCount > 1) {
        const firstRemoveBtn = document.querySelector('#reference1 .remove-reference');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'block';
    }
}

function removeReference(id) {
    if (referenceCount <= 1) return;
    
    const refEl = document.getElementById(`reference${id}`);
    if (refEl) {
        refEl.remove();
        referenceCount--;
        renumberReferences();
    }
}

function renumberReferences() {
    const refs = document.querySelectorAll('.reference-card');
    refs.forEach((ref, index) => {
        const num = index + 1;
        ref.id = `reference${num}`;
        ref.querySelector('.reference-number').textContent = `Référence #${num}`;
        
        // Mettre à jour les noms des champs
        ref.querySelectorAll('input, select').forEach(input => {
            const name = input.name;
            if (name) {
                input.name = name.replace(/ref\d+/, `ref${num}`);
            }
        });
        
        // Mettre à jour le bouton de suppression
        const removeBtn = ref.querySelector('.remove-reference');
        if (removeBtn) {
            removeBtn.onclick = () => removeReference(num);
            removeBtn.style.display = refs.length > 1 ? 'block' : 'none';
        }
    });
    referenceCount = refs.length;
}

// ============================================
// CALCUL DES CHARGES ET MARGE
// ============================================

function updateChargesTotal() {
    const achats = parseFloat(document.getElementById('chargesAchats')?.value) || 0;
    const mainOeuvre = parseFloat(document.getElementById('chargesMainOeuvre')?.value) || 0;
    const impots = parseFloat(document.getElementById('chargesImpots')?.value) || 0;
    const montantHT = parseFloat(document.getElementById('montantHT')?.value) || 0;
    
    const total = achats + mainOeuvre + impots;
    const marge = montantHT - total;
    
    const totalEl = document.getElementById('totalCharges');
    const margeEl = document.getElementById('margePrevisionnelle');
    
    if (totalEl) {
        totalEl.textContent = formatMontant(total);
    }
    
    if (margeEl) {
        margeEl.textContent = formatMontant(marge);
        margeEl.style.color = marge >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    }
}

// ============================================
// TOGGLES D'AFFICHAGE CONDITIONNELS
// ============================================

function toggleAvanceDetails(show) {
    const detailsGroup = document.getElementById('avanceDetailsGroup');
    if (detailsGroup) {
        detailsGroup.style.display = show ? 'block' : 'none';
    }
}

function toggleGarantieInst(show) {
    const details = document.getElementById('garantieInstDetails');
    if (details) {
        details.style.display = show ? 'block' : 'none';
    }
}

function toggleGarantieHypo(show) {
    const valeurGroup = document.getElementById('valeurBienGroup');
    if (valeurGroup) {
        valeurGroup.style.display = show ? 'block' : 'none';
    }
}

function toggleYearSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// ============================================
// SOUMISSION DU FORMULAIRE
// ============================================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validation finale
    if (!validateStep(7)) return;
    
    // Vérification du consentement
    const consent = document.getElementById('consent');
    if (!consent?.checked) {
        showNotification('Veuillez accepter les conditions pour continuer.', 'error');
        return;
    }
    
    // Collecte des données
    const form = e.target;
    const formDataObj = new FormData(form);
    formData = Object.fromEntries(formDataObj.entries());
    
    // Afficher le loader
    showLoading(true);
    
    try {
        // Analyse locale avec le moteur de scoring
        const analyses = ScoringEngine.analyserDossier(formData);
        
        // Envoi au webhook N8N (en parallèle)
        sendToWebhook(formData, analyses);
        
        // Simuler un délai pour l'UX
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Afficher les résultats
        displayResults(analyses);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
        showLoading(false);
    }
}

async function sendToWebhook(data, analyses) {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            formData: data,
            analyses: analyses,
            scoreGlobal: analyses.scoreGlobal
        };
        
        // Envoi au webhook N8N (non-bloquant)
        if (CONFIG.webhookUrl !== 'YOUR_N8N_WEBHOOK_URL') {
            fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(err => console.log('Webhook error (non-critique):', err));
        }
    } catch (error) {
        console.log('Erreur webhook (non-critique):', error);
    }
}

// ============================================
// AFFICHAGE DES RÉSULTATS
// ============================================

function displayResults(analyses) {
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('resultsSection');
    
    if (formSection) formSection.style.display = 'none';
    if (resultsSection) {
        resultsSection.style.display = 'block';
        
        // Remplir le résumé du score
        renderScoreSummary(analyses.scoreGlobal);
        
        // Remplir les détails
        renderResultsDetails(analyses);
        
        // Scroll vers les résultats
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderScoreSummary(scoreGlobal) {
    const container = document.getElementById('scoreSummary');
    if (!container) return;
    
    const couleurClass = scoreGlobal.diagnostic.couleur;
    
    container.innerHTML = `
        <div class="score-main">
            <div class="score-badge ${couleurClass}">
                <span class="score-value">${Math.round(scoreGlobal.pourcentage)}%</span>
                <span class="score-label">${scoreGlobal.scoreTotal}/${scoreGlobal.scoreMax} pts</span>
            </div>
            <div class="verdict-container">
                <div class="verdict ${couleurClass}">${scoreGlobal.diagnostic.label}</div>
                <p class="verdict-message">${scoreGlobal.diagnostic.message}</p>
            </div>
        </div>
        ${scoreGlobal.alertesCritiques.length > 0 ? `
            <div class="alert-box danger">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Alertes critiques détectées :</strong>
                    <ul>${scoreGlobal.alertesCritiques.map(a => `<li>${a}</li>`).join('')}</ul>
                </div>
            </div>
        ` : ''}
        <div class="alert-box ${couleurClass === 'green' ? 'success' : couleurClass === 'orange' ? 'warning' : 'danger'}">
            <i class="fas fa-lightbulb"></i>
            <div>
                <strong>Recommandation :</strong>
                <p>${scoreGlobal.diagnostic.recommandation}</p>
            </div>
        </div>
    `;
}

function renderResultsDetails(analyses) {
    const container = document.getElementById('resultsDetails');
    if (!container) return;
    
    let html = '';
    
    // 1. Analyse du marché
    html += `
        <div class="result-category">
            <h4><i class="fas fa-file-contract"></i> Analyse du Marché</h4>
            ${analyses.delai ? `
                <div class="result-item">
                    <span class="result-label">Consommation du délai</span>
                    <span class="result-value ${getSignalClass(analyses.delai.signal)}">
                        ${Math.round(analyses.delai.taux * 100)}% - ${analyses.delai.categorie}
                        <i class="fas fa-circle"></i>
                    </span>
                </div>
                <div class="alert-box ${getAlertClass(analyses.delai.signal)}">
                    <i class="fas fa-info-circle"></i>
                    <span>${analyses.delai.message}</span>
                </div>
            ` : ''}
            ${analyses.maitreOuvrage ? `
                <div class="result-item">
                    <span class="result-label">Maître d'ouvrage</span>
                    <span class="result-value">${analyses.maitreOuvrage.label}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Fiabilité</span>
                    <span class="result-value ${analyses.maitreOuvrage.score >= 7 ? 'success' : 'warning'}">${analyses.maitreOuvrage.fiabilite}</span>
                </div>
            ` : ''}
            ${analyses.domiciliation?.alerte ? `
                <div class="alert-box warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${analyses.domiciliation.message}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    // 2. Capacité technique
    if (analyses.capaciteTechnique) {
        const ct = analyses.capaciteTechnique;
        html += `
            <div class="result-category">
                <h4><i class="fas fa-cogs"></i> Capacité Technique</h4>
                <div class="result-item">
                    <span class="result-label">Score global</span>
                    <span class="result-value ${getSignalClass(ct.diagnostic.signal)}">
                        ${ct.scoreTotal}/${ct.maxScore} pts - ${ct.diagnostic.label}
                    </span>
                </div>
                <div class="result-item">
                    <span class="result-label">Expérience technique</span>
                    <span class="result-value">${ct.scores.experienceTechnique.points}/7 pts - ${ct.scores.experienceTechnique.label}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Puissance de structure</span>
                    <span class="result-value">${ct.scores.puissanceStructure.points}/7 pts - ${ct.scores.puissanceStructure.label}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Qualité historique clients</span>
                    <span class="result-value">${ct.scores.qualiteHistorique.points}/6 pts - ${ct.scores.qualiteHistorique.label}</span>
                </div>
            </div>
        `;
    }
    
    // 3. Structure financière du marché
    if (analyses.marge) {
        html += `
            <div class="result-category">
                <h4><i class="fas fa-coins"></i> Structure Financière du Marché</h4>
                <div class="result-item">
                    <span class="result-label">Marge prévisionnelle</span>
                    <span class="result-value ${getSignalClass(analyses.marge.diagnostic.signal)}">
                        ${formatMontant(analyses.marge.marge)} (${analyses.marge.tauxMarge.toFixed(1)}%)
                    </span>
                </div>
                <div class="alert-box ${getAlertClass(analyses.marge.diagnostic.signal)}">
                    <i class="fas fa-info-circle"></i>
                    <span>${analyses.marge.diagnostic.message}</span>
                </div>
                ${analyses.marge.alerteStructure ? `
                    <div class="alert-box warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${analyses.marge.alerteStructure.message}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 4. Situation financière
    if (analyses.ratiosFinanciers) {
        const rf = analyses.ratiosFinanciers;
        html += `
            <div class="result-category">
                <h4><i class="fas fa-chart-pie"></i> Situation Financière</h4>
                ${renderRatioItem('Autonomie financière', rf.autonomieFinanciere, true)}
                ${renderRatioItem('Capacité de remboursement', rf.capaciteRemboursement)}
                ${renderRatioItem('Rentabilité (EBE/CA)', rf.rentabilite, true)}
                ${renderRatioItem('Liquidité générale', rf.liquiditeGenerale)}
                ${renderRatioItem('CAF', rf.caf)}
                ${renderRatioItem('Trésorerie nette', rf.tresorerieNette)}
                ${analyses.evolutionCA && analyses.evolutionCA.pattern !== 'INCOMPLET' ? `
                    <div class="alert-box ${getAlertClass(analyses.evolutionCA.signal)}">
                        <i class="fas fa-chart-line"></i>
                        <span>Évolution CA : ${analyses.evolutionCA.message}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 5. Endettement bancaire
    if (analyses.endettement) {
        const ed = analyses.endettement;
        html += `
            <div class="result-category">
                <h4><i class="fas fa-landmark"></i> Endettement Bancaire</h4>
                <div class="result-item">
                    <span class="result-label">Crédits directs</span>
                    <span class="result-value">${formatMontant(ed.creditDirect)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Engagements par signature</span>
                    <span class="result-value">${formatMontant(ed.engagementsSignature)}</span>
                </div>
                ${ed.lignesAutorisees > 0 ? `
                    <div class="result-item">
                        <span class="result-label">Taux d'utilisation des lignes</span>
                        <span class="result-value">${ed.tauxUtilisation.toFixed(1)}%</span>
                    </div>
                ` : ''}
                ${ed.impayes > 0 ? `
                    <div class="alert-box danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>ALERTE : Impayés détectés (${formatMontant(ed.impayes)})</span>
                    </div>
                ` : ''}
                ${ed.alertes.map(a => `
                    <div class="alert-box ${a.type}">
                        <i class="fas fa-${a.type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
                        <span>${a.message}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 6. Garanties
    if (analyses.garanties) {
        const gr = analyses.garanties;
        html += `
            <div class="result-category">
                <h4><i class="fas fa-shield-alt"></i> Garanties</h4>
                <div class="result-item">
                    <span class="result-label">Couverture globale</span>
                    <span class="result-value ${getSignalClass(gr.signal)}">
                        ${gr.ratioCouvertureGlobal.toFixed(1)}%
                    </span>
                </div>
                ${gr.analyses.map(a => `
                    <div class="result-item">
                        <span class="result-label">${a.type}</span>
                        <span class="result-value ${getSignalClass(a.signal)}">
                            ${a.verdict || `${a.couverture}%`}
                        </span>
                    </div>
                    ${a.message ? `
                        <div class="alert-box ${getAlertClass(a.signal)}">
                            <i class="fas fa-info-circle"></i>
                            <span>${a.message}</span>
                        </div>
                    ` : ''}
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderRatioItem(label, ratio, isPercent = false) {
    if (!ratio) return '';
    
    let valeurAffichee;
    if (typeof ratio.valeur === 'number') {
        if (isPercent) {
            valeurAffichee = (ratio.valeur * 100).toFixed(1) + '%';
        } else if (ratio.valeur === Infinity) {
            valeurAffichee = 'N/A';
        } else if (Math.abs(ratio.valeur) >= 1000000) {
            valeurAffichee = formatMontant(ratio.valeur);
        } else {
            valeurAffichee = ratio.valeur.toFixed(2);
        }
    } else {
        valeurAffichee = ratio.valeur;
    }
    
    return `
        <div class="result-item">
            <span class="result-label">${label}</span>
            <span class="result-value ${getSignalClass(ratio.diagnostic)}">
                ${valeurAffichee}
                <i class="fas fa-${ratio.diagnostic === 'VERT' ? 'check-circle' : ratio.diagnostic === 'ROUGE' ? 'times-circle' : 'exclamation-circle'}"></i>
            </span>
        </div>
    `;
}

// ============================================
// UTILITAIRES
// ============================================

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
}

function getSignalClass(signal) {
    switch(signal) {
        case 'VERT': return 'success';
        case 'JAUNE':
        case 'ORANGE': return 'warning';
        case 'ROUGE': return 'danger';
        default: return '';
    }
}

function getAlertClass(signal) {
    switch(signal) {
        case 'VERT': return 'success';
        case 'JAUNE':
        case 'ORANGE': return 'warning';
        case 'ROUGE': return 'danger';
        default: return 'info';
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showNotification(message, type = 'info') {
    // Créer une notification toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Styles inline pour la notification
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease',
        backgroundColor: type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe',
        color: type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#2563eb',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    });
    
    document.body.appendChild(toast);
    
    // Supprimer après 4 secondes
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Ajouter les animations CSS dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .form-group input.error,
    .form-group select.error {
        border-color: var(--danger-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;
document.head.appendChild(style);
