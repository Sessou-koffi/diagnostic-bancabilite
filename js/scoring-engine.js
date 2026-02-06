/**
 * MOTEUR DE SCORING - DIAGNOSTIC DE BANCABILITÉ POUR AVANCE SUR MARCHÉ
 * =====================================================================
 * Ce fichier contient toute la logique métier de calcul des scores et ratios
 * selon le cahier des charges fourni.
 */

const ScoringEngine = {
    // Configuration des seuils et barèmes
    config: {
        // Seuils de consommation de délai
        delaiConsommation: {
            demarrage: { min: 0, max: 0.20, risque: 'faible', signal: 'VERT' },
            croisiere: { min: 0.20, max: 0.60, risque: 'modéré', signal: 'JAUNE' },
            finChantier: { min: 0.60, max: 0.90, risque: 'élevé', signal: 'ORANGE' },
            horsDelai: { min: 0.90, max: Infinity, risque: 'critique', signal: 'ROUGE' }
        },
        
        // Barème Capacité Technique (sur 20 points)
        capaciteTechnique: {
            experienceTechnique: { // 7 points max
                maitriseTotale: { seuil: 0.8, points: 7 },
                challengeMaitrise: { seuilMin: 0.4, seuilMax: 0.8, points: 4 },
                sautEchelle: { seuil: 0.4, points: 1 }
            },
            puissanceStructure: { // 7 points max
                structureSolide: { seuil: 1.5, points: 7 },
                tensionRessources: { seuilMin: 1.5, seuilMax: 3, points: 4 },
                risqueFaillite: { seuil: 3, points: 0 }
            },
            qualiteHistorique: { // 6 points max
                publicGrandsComptes: { points: 6 },
                priveParticuliers: { points: 1 }
            }
        },
        
        // Seuils diagnostic capacité technique
        diagnosticCapacite: {
            expert: { min: 16, max: 20, signal: 'VERT' },
            croissance: { min: 10, max: 15, signal: 'JAUNE' },
            fragile: { min: 0, max: 9, signal: 'ROUGE' }
        },
        
        // Ratios financiers normes
        ratiosFinanciers: {
            autonomieFinanciere: { seuil: 0.20, type: 'superieur' },
            capaciteRemboursement: { seuil: 4, type: 'inferieur' },
            rentabilite: { seuil: 0, type: 'superieur' },
            liquiditeGenerale: { seuil: 1, type: 'superieur' }
        },
        
        // Seuils garantie hypothécaire
        garantieHypothecaire: {
            conforme: { seuil: 1.20, verdict: 'Garantie Conforme' },
            partielle: { seuilMin: 1.00, seuilMax: 1.20, verdict: 'Garantie Partielle' },
            insuffisante: { seuil: 1.00, verdict: 'Garantie Insuffisante' }
        },
        
        // Couverture garantie institutionnelle
        couvertureInstitutionnelle: 0.50,
        
        // Règle avance démarrage + crédit
        maxAvancePlusCredit: 0.70
    },

    /**
     * Calcul du taux de consommation de délai
     */
    calculerTauxConsommationDelai(dateOS, dateFinPrevue) {
        const today = new Date();
        const dateDebut = new Date(dateOS);
        const dateFin = new Date(dateFinPrevue);
        
        const delaiTotal = dateFin - dateDebut;
        const delaiConsomme = today - dateDebut;
        
        if (delaiTotal <= 0) return 1; // Éviter division par 0
        
        const taux = delaiConsomme / delaiTotal;
        return Math.max(0, taux);
    },

    /**
     * Diagnostic du taux de consommation de délai
     */
    diagnostiquerDelai(taux) {
        const config = this.config.delaiConsommation;
        
        if (taux <= config.demarrage.max) {
            return {
                categorie: 'Démarrage',
                risque: 'Faible',
                signal: 'VERT',
                message: 'Idéal pour une avance de démarrage.',
                points: 10
            };
        } else if (taux <= config.croisiere.max) {
            return {
                categorie: 'Phase de croisière',
                risque: 'Modéré',
                signal: 'JAUNE',
                message: "L'avance doit être justifiée par des besoins de trésorerie spécifiques.",
                points: 7
            };
        } else if (taux <= config.finChantier.max) {
            return {
                categorie: 'Fin de chantier',
                risque: 'Élevé',
                signal: 'ORANGE',
                message: "Risque que l'avance serve à payer des dettes antérieures.",
                points: 3
            };
        } else {
            return {
                categorie: 'Hors délai',
                risque: 'Critique',
                signal: 'ROUGE',
                message: 'Alerte : Marché en retard, risque de pénalités.',
                points: 0
            };
        }
    },

    /**
     * Vérification de la cohérence du montant demandé
     */
    verifierCoherenceMontant(montantHT, montantDemande, tauxAvanceDemarrage, recevoirAvance) {
        const avancePrevu = tauxAvanceDemarrage ? montantHT * (tauxAvanceDemarrage / 100) : 0;
        const maxCredit = montantHT * this.config.maxAvancePlusCredit;
        
        let alertes = [];
        let coherent = true;
        
        if (recevoirAvance && avancePrevu > 0) {
            const maxCreditApresAvance = maxCredit - avancePrevu;
            if (montantDemande > maxCreditApresAvance) {
                coherent = false;
                alertes.push({
                    type: 'danger',
                    message: `Avec l'avance de démarrage de ${this.formatMontant(avancePrevu)}, le crédit ne peut pas dépasser ${this.formatMontant(maxCreditApresAvance)} (70% du montant HT - avance).`
                });
            }
        } else {
            if (montantDemande > maxCredit) {
                coherent = false;
                alertes.push({
                    type: 'danger',
                    message: `Le montant demandé dépasse 70% du montant HT du marché (max: ${this.formatMontant(maxCredit)}).`
                });
            }
        }
        
        return { coherent, alertes, avancePrevu, maxCredit };
    },

    /**
     * Analyse de la qualité du maître d'ouvrage
     */
    analyserMaitreOuvrage(type, sourceFinancement) {
        const qualites = {
            'etat': { score: 10, label: 'État / Administration centrale', fiabilite: 'Très élevée' },
            'collectivite': { score: 8, label: 'Collectivité locale', fiabilite: 'Élevée' },
            'entreprise_publique': { score: 9, label: 'Entreprise publique', fiabilite: 'Très élevée' },
            'prive_grand_groupe': { score: 8, label: 'Grand groupe / Multinationale', fiabilite: 'Élevée' },
            'prive_pme': { score: 5, label: 'PME privée', fiabilite: 'Modérée' },
            'ong': { score: 7, label: 'ONG / Organisation internationale', fiabilite: 'Bonne' }
        };
        
        const qualite = qualites[type] || { score: 5, label: 'Non précisé', fiabilite: 'Inconnue' };
        
        let alertes = [];
        if (type === 'collectivite' && sourceFinancement === 'budget_autonome') {
            alertes.push({
                type: 'warning',
                message: "Pour une collectivité locale avec budget autonome, vérifiez la disponibilité d'une ligne budgétaire affectée au projet."
            });
        }
        
        return { ...qualite, alertes };
    },

    /**
     * Calcul du ratio de capacité technique
     */
    calculerRatioCapacite(montantPlusGrosMarche, montantMarcheActuel) {
        if (!montantMarcheActuel || montantMarcheActuel === 0) return 0;
        return montantPlusGrosMarche / montantMarcheActuel;
    },

    /**
     * Calcul de l'indice de capacité
     */
    calculerIndiceCapacite(montantMarcheActuel, moyenneMarchesExecutes) {
        if (!moyenneMarchesExecutes || moyenneMarchesExecutes === 0) return Infinity;
        return montantMarcheActuel / moyenneMarchesExecutes;
    },

    /**
     * Score expérience technique (7 points max)
     */
    scorerExperienceTechnique(ratioCapacite) {
        const config = this.config.capaciteTechnique.experienceTechnique;
        
        if (ratioCapacite >= config.maitriseTotale.seuil) {
            return { points: config.maitriseTotale.points, label: 'Maîtrise totale' };
        } else if (ratioCapacite >= config.challengeMaitrise.seuilMin) {
            return { points: config.challengeMaitrise.points, label: 'Challenge maîtrisé' };
        } else {
            return { points: config.sautEchelle.points, label: 'Saut d\'échelle risqué' };
        }
    },

    /**
     * Score puissance de structure (7 points max)
     */
    scorerPuissanceStructure(indiceCapacite) {
        const config = this.config.capaciteTechnique.puissanceStructure;
        
        if (indiceCapacite <= config.structureSolide.seuil) {
            return { points: config.structureSolide.points, label: 'Structure solide' };
        } else if (indiceCapacite <= config.tensionRessources.seuilMax) {
            return { points: config.tensionRessources.points, label: 'Tension sur les ressources' };
        } else {
            return { points: config.risqueFaillite.points, label: 'Risque de faillite opérationnelle' };
        }
    },

    /**
     * Score qualité historique client (6 points max)
     */
    scorerQualiteHistorique(references) {
        if (!references || references.length === 0) {
            return { points: 0, label: 'Aucune référence' };
        }
        
        const hasPublicOrGrandGroupe = references.some(ref => 
            ref.typeClient === 'public' || ref.typeClient === 'grand_groupe'
        );
        
        if (hasPublicOrGrandGroupe) {
            return { points: 6, label: 'Clients publics / Grands comptes' };
        } else {
            return { points: 1, label: 'Clients privés / Particuliers uniquement' };
        }
    },

    /**
     * Diagnostic global de la capacité technique
     */
    diagnostiquerCapaciteTechnique(data) {
        const references = this.extraireReferences(data);
        const montantsReferences = references.map(r => r.montant).filter(m => m > 0);
        
        const plusGrosMarche = Math.max(...montantsReferences, 0);
        const moyenneMarches = montantsReferences.length > 0 
            ? montantsReferences.reduce((a, b) => a + b, 0) / montantsReferences.length 
            : data.caAnnuel || 0;
        
        const montantMarche = parseFloat(data.montantHT) || 0;
        
        const ratioCapacite = this.calculerRatioCapacite(plusGrosMarche, montantMarche);
        const indiceCapacite = this.calculerIndiceCapacite(montantMarche, moyenneMarches);
        
        const scoreExp = this.scorerExperienceTechnique(ratioCapacite);
        const scorePuissance = this.scorerPuissanceStructure(indiceCapacite);
        const scoreQualite = this.scorerQualiteHistorique(references);
        
        const scoreTotal = scoreExp.points + scorePuissance.points + scoreQualite.points;
        
        let diagnostic;
        const config = this.config.diagnosticCapacite;
        if (scoreTotal >= config.expert.min) {
            diagnostic = { signal: 'VERT', label: 'Profil Expert', message: 'Favorable. Capacité technique démontrée.' };
        } else if (scoreTotal >= config.croissance.min) {
            diagnostic = { signal: 'JAUNE', label: 'Profil en Croissance', message: 'Vigilance. Capacité à surveiller.' };
        } else {
            diagnostic = { signal: 'ROUGE', label: 'Profil Fragile', message: 'Alerte. Capacité insuffisante pour ce marché.' };
        }
        
        return {
            ratioCapacite,
            indiceCapacite,
            scores: {
                experienceTechnique: scoreExp,
                puissanceStructure: scorePuissance,
                qualiteHistorique: scoreQualite
            },
            scoreTotal,
            maxScore: 20,
            diagnostic
        };
    },

    /**
     * Extraction des références du formulaire
     */
    extraireReferences(data) {
        const references = [];
        for (let i = 1; i <= 5; i++) {
            const intitule = data[`ref${i}_intitule`];
            const montant = parseFloat(data[`ref${i}_montant`]) || 0;
            const typeClient = data[`ref${i}_typeClient`];
            const annee = data[`ref${i}_annee`];
            
            if (intitule || montant > 0) {
                references.push({ intitule, montant, typeClient, annee });
            }
        }
        return references;
    },

    /**
     * Calcul de la marge bénéficiaire
     */
    calculerMarge(montantHT, chargesAchats, chargesMainOeuvre, chargesImpots) {
        const totalCharges = (parseFloat(chargesAchats) || 0) 
            + (parseFloat(chargesMainOeuvre) || 0) 
            + (parseFloat(chargesImpots) || 0);
        
        const marge = (parseFloat(montantHT) || 0) - totalCharges;
        const tauxMarge = montantHT > 0 ? (marge / montantHT) * 100 : 0;
        
        let diagnostic;
        if (tauxMarge >= 20) {
            diagnostic = { signal: 'VERT', message: 'Marge confortable' };
        } else if (tauxMarge >= 10) {
            diagnostic = { signal: 'JAUNE', message: 'Marge acceptable mais limitée' };
        } else if (tauxMarge >= 0) {
            diagnostic = { signal: 'ORANGE', message: 'Marge très faible, risque élevé' };
        } else {
            diagnostic = { signal: 'ROUGE', message: 'Marge négative - Opération déficitaire !' };
        }
        
        return { marge, tauxMarge, totalCharges, diagnostic };
    },

    /**
     * Analyse de la structure des charges (spécifique BTP)
     */
    analyserStructureCharges(secteur, chargesAchats, chargesMainOeuvre) {
        const achats = parseFloat(chargesAchats) || 0;
        const mainOeuvre = parseFloat(chargesMainOeuvre) || 0;
        
        if (secteur === 'btp') {
            if (achats < mainOeuvre) {
                return {
                    signal: 'warning',
                    message: 'Pour un marché BTP, les achats de matériaux devraient normalement être supérieurs aux dépenses de main d\'œuvre.'
                };
            }
        }
        
        return null;
    },

    /**
     * Calcul des ratios financiers
     */
    calculerRatiosFinanciers(data) {
        const ca = parseFloat(data.ca_n) || 0;
        const resultatNet = parseFloat(data.resultatNet_n) || 0;
        const ebe = parseFloat(data.ebe_n) || 0;
        const capitauxPropres = parseFloat(data.capitauxPropres_n) || 0;
        const totalBilan = parseFloat(data.totalBilan_n) || 1; // Éviter division par 0
        const dettesFinancieres = parseFloat(data.dettesFinancieres_n) || 0;
        const dotationsAmort = parseFloat(data.dotationsAmort_n) || 0;
        const tresorerieActif = parseFloat(data.tresorerieActif_n) || 0;
        const tresoreriePassif = parseFloat(data.tresoreriePassif_n) || 0;
        const stocks = parseFloat(data.stocks_n) || 0;
        const creances = parseFloat(data.creances_n) || 0;
        const dettesFournisseurs = parseFloat(data.dettesFournisseurs_n) || 0;
        const dettesFiscales = parseFloat(data.dettesFiscales_n) || 0;
        const actifCirculant = parseFloat(data.actifCirculant_n) || 0;
        const passifCirculant = parseFloat(data.passifCirculant_n) || 1;
        
        // CAF
        const caf = resultatNet + dotationsAmort;
        
        // Trésorerie nette
        const tresorerieNette = tresorerieActif - tresoreriePassif;
        
        // BFR
        const bfr = (stocks + creances) - dettesFournisseurs;
        
        // Autonomie financière
        const autonomieFinanciere = capitauxPropres / totalBilan;
        
        // Capacité de remboursement
        const capaciteRemboursement = caf > 0 ? dettesFinancieres / caf : Infinity;
        
        // Rentabilité (EBE/CA)
        const rentabilite = ca > 0 ? ebe / ca : 0;
        
        // Liquidité générale
        const liquiditeGenerale = actifCirculant / passifCirculant;
        
        // Endettement global
        const endettementGlobal = caf > 0 ? dettesFinancieres / caf : Infinity;
        
        return {
            caf: {
                valeur: caf,
                diagnostic: caf >= 0 ? 'VERT' : 'ROUGE',
                message: caf >= 0 ? 'Flux de trésorerie positif' : 'Attention: CAF négative'
            },
            tresorerieNette: {
                valeur: tresorerieNette,
                diagnostic: tresorerieNette >= 0 ? 'VERT' : 'ORANGE',
                message: tresorerieNette >= 0 ? 'Trésorerie saine' : 'Dépendance aux découverts bancaires'
            },
            bfr: {
                valeur: bfr,
                diagnostic: 'INFO',
                message: 'À comparer avec l\'évolution du CA'
            },
            autonomieFinanciere: {
                valeur: autonomieFinanciere,
                seuil: 0.20,
                diagnostic: autonomieFinanciere >= 0.20 ? 'VERT' : 'ORANGE',
                message: autonomieFinanciere >= 0.20 ? 'Autonomie suffisante' : 'Structure financière fragile'
            },
            capaciteRemboursement: {
                valeur: capaciteRemboursement,
                seuil: 4,
                diagnostic: capaciteRemboursement <= 4 ? 'VERT' : 'ROUGE',
                message: capaciteRemboursement <= 4 ? 'Capacité de remboursement correcte' : 'Surendettement potentiel'
            },
            rentabilite: {
                valeur: rentabilite,
                seuil: 0,
                diagnostic: rentabilite > 0 ? 'VERT' : 'ROUGE',
                message: rentabilite > 0 ? 'Exploitation rentable' : 'Rentabilité négative'
            },
            liquiditeGenerale: {
                valeur: liquiditeGenerale,
                seuil: 1,
                diagnostic: liquiditeGenerale >= 1 ? 'VERT' : 'ORANGE',
                message: liquiditeGenerale >= 1 ? 'Liquidité suffisante' : 'Risque de liquidité'
            },
            capitauxPropres: {
                valeur: capitauxPropres,
                diagnostic: capitauxPropres > 0 ? 'VERT' : 'ROUGE',
                message: capitauxPropres > 0 ? 'Fonds propres positifs' : 'ALERTE: Fonds propres négatifs'
            },
            dettesFiscales: {
                valeur: dettesFiscales,
                diagnostic: 'INFO',
                message: 'À surveiller si augmentation avec baisse du CA'
            },
            resultatNet: {
                valeur: resultatNet,
                diagnostic: resultatNet >= 0 ? 'VERT' : 'ORANGE',
                message: resultatNet >= 0 ? 'Résultat positif' : 'Résultat déficitaire'
            }
        };
    },

    /**
     * Analyse de l'évolution du CA sur 3 ans
     */
    analyserEvolutionCA(ca_n, ca_n1, ca_n2) {
        const n = parseFloat(ca_n) || 0;
        const n1 = parseFloat(ca_n1) || 0;
        const n2 = parseFloat(ca_n2) || 0;
        
        if (!n1 || !n2) {
            return { pattern: 'INCOMPLET', message: 'Données insuffisantes pour l\'analyse d\'évolution' };
        }
        
        const variation_n_n1 = n1 > 0 ? ((n - n1) / n1) * 100 : 0;
        const variation_n1_n2 = n2 > 0 ? ((n1 - n2) / n2) * 100 : 0;
        
        // Déterminer le pattern
        if (variation_n_n1 >= 0 && variation_n1_n2 >= 0) {
            return {
                pattern: 'CROISSANCE_CONTINUE',
                signal: 'VERT',
                message: 'Croissance continue favorable',
                variations: [variation_n_n1, variation_n1_n2]
            };
        } else if (variation_n_n1 >= 0 && variation_n1_n2 < 0) {
            return {
                pattern: 'REPRISE',
                signal: 'JAUNE',
                message: 'Chute puis reprise - Acceptable',
                variations: [variation_n_n1, variation_n1_n2]
            };
        } else if (variation_n_n1 < 0 && variation_n1_n2 >= 0) {
            return {
                pattern: 'INSTABILITE',
                signal: 'ORANGE',
                message: 'Reprise puis rechute - Instabilité',
                variations: [variation_n_n1, variation_n1_n2]
            };
        } else {
            const chuteGlobale = n2 > 0 ? ((n - n2) / n2) * 100 : 0;
            return {
                pattern: 'CHUTE_CONTINUE',
                signal: chuteGlobale < -20 ? 'ROUGE' : 'ORANGE',
                message: chuteGlobale < -20 ? 'Chute continue > 20% - Déséquilibre financier élevé' : 'Tendance baissière à surveiller',
                variations: [variation_n_n1, variation_n1_n2]
            };
        }
    },

    /**
     * Analyse de l'endettement bancaire
     */
    analyserEndettementBancaire(data) {
        const creditDirect = parseFloat(data.creditDirect) || 0;
        const engagementsSignature = parseFloat(data.engagementsSignature) || 0;
        const lignesAutorisees = parseFloat(data.lignesAutorisees) || 0;
        const impayes = parseFloat(data.impayes) || 0;
        
        const dettesFinancieresBilan = parseFloat(data.dettesFinancieres_n) || 0;
        
        let alertes = [];
        let signal = 'VERT';
        
        // Vérification impayés (critique)
        if (impayes > 0) {
            signal = 'ROUGE';
            alertes.push({
                type: 'danger',
                message: `ALERTE CRITIQUE: Impayés détectés (${this.formatMontant(impayes)}). Dossier à risque élevé.`
            });
        }
        
        // Vérification écart CR/Bilan
        if (dettesFinancieresBilan > 0) {
            const ecart = Math.abs(creditDirect - dettesFinancieresBilan) / dettesFinancieresBilan;
            if (ecart > 0.20) {
                if (signal !== 'ROUGE') signal = 'ORANGE';
                alertes.push({
                    type: 'warning',
                    message: 'Écart significatif entre engagements déclarés et bilan (> 20%). Justification recommandée.'
                });
            }
        }
        
        // Vérification cautions élevées
        if (engagementsSignature > creditDirect * 2) {
            if (signal === 'VERT') signal = 'JAUNE';
            alertes.push({
                type: 'warning',
                message: 'Cautions très élevées par rapport aux crédits directs. Vérifier la capacité technique.'
            });
        }
        
        // Taux d'utilisation des lignes
        let tauxUtilisation = 0;
        if (lignesAutorisees > 0) {
            tauxUtilisation = (creditDirect / lignesAutorisees) * 100;
        }
        
        return {
            creditDirect,
            engagementsSignature,
            lignesAutorisees,
            impayes,
            tauxUtilisation,
            signal,
            alertes
        };
    },

    /**
     * Analyse des garanties
     */
    analyserGaranties(data) {
        const montantDemande = parseFloat(data.montantDemande) || 0;
        const hasGarantieInst = data.garantieInstitutionnelle === 'oui';
        const hasGarantieHypo = data.garantieHypothecaire === 'oui';
        const valeurBien = parseFloat(data.valeurBien) || 0;
        
        let couvertureTotale = 0;
        let analyses = [];
        
        // Garantie institutionnelle
        if (hasGarantieInst) {
            const couvertureInst = montantDemande * this.config.couvertureInstitutionnelle;
            couvertureTotale += couvertureInst;
            analyses.push({
                type: 'Garantie Institutionnelle',
                couverture: this.config.couvertureInstitutionnelle * 100,
                montant: couvertureInst,
                signal: 'VERT',
                message: `Couverture à hauteur de 50% soit ${this.formatMontant(couvertureInst)}`
            });
        }
        
        // Garantie hypothécaire
        if (hasGarantieHypo && valeurBien > 0) {
            const ratioHypo = valeurBien / montantDemande;
            let verdict, signal, message;
            
            if (ratioHypo >= 1.20) {
                verdict = 'Garantie Conforme';
                signal = 'VERT';
                message = 'La couverture hypothécaire est optimale et répond aux exigences de sûreté (120%).';
            } else if (ratioHypo >= 1.00) {
                verdict = 'Garantie Partielle';
                signal = 'JAUNE';
                message = 'La garantie couvre le principal mais est inférieure au seuil de sécurité de 120%. Une garantie complémentaire ou un apport personnel plus élevé pourrait être requis.';
            } else {
                verdict = 'Garantie Insuffisante';
                signal = 'ROUGE';
                message = 'La valeur de l\'hypothèque est inférieure au montant demandé. Le dossier présente un risque de défaut de couverture.';
            }
            
            couvertureTotale += valeurBien;
            analyses.push({
                type: 'Garantie Hypothécaire',
                valeurBien,
                ratio: ratioHypo * 100,
                verdict,
                signal,
                message
            });
        }
        
        // Couverture globale
        const ratioCouvertureGlobal = montantDemande > 0 ? (couvertureTotale / montantDemande) * 100 : 0;
        
        return {
            montantDemande,
            couvertureTotale,
            ratioCouvertureGlobal,
            analyses,
            signal: ratioCouvertureGlobal >= 120 ? 'VERT' : (ratioCouvertureGlobal >= 100 ? 'JAUNE' : 'ROUGE')
        };
    },

    /**
     * Vérification de la domiciliation RIB
     */
    verifierDomiciliation(ribConforme) {
        if (ribConforme === 'non') {
            return {
                alerte: true,
                message: 'Le RIB du contrat ne correspond pas à la banque de financement. Une attestation de virement irrévocable sera nécessaire.',
                signal: 'ORANGE'
            };
        }
        return { alerte: false, signal: 'VERT' };
    },

    /**
     * Calcul du score global et diagnostic final
     */
    calculerScoreGlobal(analyses) {
        let scoreTotal = 0;
        let scoreMax = 100;
        let alertesCritiques = [];
        
        // Pondérations par dimension
        const poids = {
            delai: 10,
            maitreOuvrage: 10,
            capaciteTechnique: 20,
            marge: 15,
            ratiosFinanciers: 20,
            endettement: 15,
            garanties: 10
        };
        
        // Score délai (10 pts)
        if (analyses.delai) {
            scoreTotal += analyses.delai.points;
        }
        
        // Score maître d'ouvrage (10 pts)
        if (analyses.maitreOuvrage) {
            scoreTotal += analyses.maitreOuvrage.score;
        }
        
        // Score capacité technique (20 pts)
        if (analyses.capaciteTechnique) {
            scoreTotal += analyses.capaciteTechnique.scoreTotal;
        }
        
        // Score marge (15 pts)
        if (analyses.marge) {
            const tauxMarge = analyses.marge.tauxMarge;
            if (tauxMarge >= 20) scoreTotal += 15;
            else if (tauxMarge >= 10) scoreTotal += 10;
            else if (tauxMarge >= 0) scoreTotal += 5;
            // Sinon 0 points
        }
        
        // Score ratios financiers (20 pts)
        if (analyses.ratiosFinanciers) {
            let scoreRatios = 0;
            const ratios = analyses.ratiosFinanciers;
            
            if (ratios.autonomieFinanciere?.diagnostic === 'VERT') scoreRatios += 4;
            if (ratios.capaciteRemboursement?.diagnostic === 'VERT') scoreRatios += 4;
            if (ratios.rentabilite?.diagnostic === 'VERT') scoreRatios += 4;
            if (ratios.liquiditeGenerale?.diagnostic === 'VERT') scoreRatios += 4;
            if (ratios.capitauxPropres?.diagnostic === 'VERT') scoreRatios += 4;
            
            scoreTotal += scoreRatios;
        }
        
        // Score endettement (15 pts)
        if (analyses.endettement) {
            if (analyses.endettement.signal === 'VERT') scoreTotal += 15;
            else if (analyses.endettement.signal === 'JAUNE') scoreTotal += 10;
            else if (analyses.endettement.signal === 'ORANGE') scoreTotal += 5;
            // ROUGE = 0 points
            
            if (analyses.endettement.impayes > 0) {
                alertesCritiques.push('Présence d\'impayés bancaires');
            }
        }
        
        // Score garanties (10 pts)
        if (analyses.garanties) {
            if (analyses.garanties.signal === 'VERT') scoreTotal += 10;
            else if (analyses.garanties.signal === 'JAUNE') scoreTotal += 7;
            else scoreTotal += 3;
        }
        
        // Diagnostic final
        const pourcentage = (scoreTotal / scoreMax) * 100;
        
        let diagnostic;
        if (alertesCritiques.length > 0) {
            diagnostic = {
                signal: 'ROUGE',
                label: 'FEU ROUGE',
                couleur: 'red',
                message: 'Dossier avec alertes critiques. Accompagnement fortement recommandé avant toute démarche bancaire.',
                recommandation: 'Prendre rendez-vous avec un conseiller IOB pour analyser les points bloquants.'
            };
        } else if (pourcentage >= 70) {
            diagnostic = {
                signal: 'VERT',
                label: 'FEU VERT',
                couleur: 'green',
                message: 'Votre dossier présente un profil favorable pour une demande d\'avance sur marché.',
                recommandation: 'Vous pouvez déposer votre dossier en banque. Un accompagnement IOB peut optimiser vos conditions.'
            };
        } else if (pourcentage >= 50) {
            diagnostic = {
                signal: 'ORANGE',
                label: 'FEU ORANGE',
                couleur: 'orange',
                message: 'Votre dossier présente des points à améliorer avant de solliciter un financement.',
                recommandation: 'Un accompagnement personnalisé vous permettrait d\'optimiser votre dossier.'
            };
        } else {
            diagnostic = {
                signal: 'ROUGE',
                label: 'FEU ROUGE',
                couleur: 'red',
                message: 'Votre dossier présente des faiblesses significatives qui pourraient compromettre l\'obtention du financement.',
                recommandation: 'Un diagnostic approfondi par un expert IOB est fortement recommandé.'
            };
        }
        
        return {
            scoreTotal,
            scoreMax,
            pourcentage,
            diagnostic,
            alertesCritiques
        };
    },

    /**
     * Fonction principale d'analyse complète
     */
    analyserDossier(formData) {
        const data = formData;
        const analyses = {};
        
        // 1. Analyse du délai
        if (data.dateSignatureOS && data.dateFinPrevue) {
            const tauxDelai = this.calculerTauxConsommationDelai(data.dateSignatureOS, data.dateFinPrevue);
            analyses.delai = this.diagnostiquerDelai(tauxDelai);
            analyses.delai.taux = tauxDelai;
        }
        
        // 2. Vérification cohérence montant
        analyses.coherenceMontant = this.verifierCoherenceMontant(
            parseFloat(data.montantHT),
            parseFloat(data.montantDemande),
            parseFloat(data.tauxAvanceDemarrage),
            data.recevoirAvance === 'oui'
        );
        
        // 3. Analyse maître d'ouvrage
        analyses.maitreOuvrage = this.analyserMaitreOuvrage(data.typeMaitreOuvrage, data.sourceFinancement);
        
        // 4. Capacité technique
        analyses.capaciteTechnique = this.diagnostiquerCapaciteTechnique(data);
        
        // 5. Marge et structure des charges
        analyses.marge = this.calculerMarge(
            data.montantHT,
            data.chargesAchats,
            data.chargesMainOeuvre,
            data.chargesImpots
        );
        
        const alerteStructure = this.analyserStructureCharges(
            data.secteurActivite,
            data.chargesAchats,
            data.chargesMainOeuvre
        );
        if (alerteStructure) {
            analyses.marge.alerteStructure = alerteStructure;
        }
        
        // 6. Ratios financiers
        analyses.ratiosFinanciers = this.calculerRatiosFinanciers(data);
        
        // 7. Évolution CA
        analyses.evolutionCA = this.analyserEvolutionCA(data.ca_n, data.ca_n1, data.ca_n2);
        
        // 8. Endettement bancaire
        analyses.endettement = this.analyserEndettementBancaire(data);
        
        // 9. Garanties
        analyses.garanties = this.analyserGaranties(data);
        
        // 10. Domiciliation RIB
        analyses.domiciliation = this.verifierDomiciliation(data.ribConforme);
        
        // 11. Score global et diagnostic final
        analyses.scoreGlobal = this.calculerScoreGlobal(analyses);
        
        return analyses;
    },

    /**
     * Utilitaire de formatage des montants
     */
    formatMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(montant) + ' FCFA';
    },

    /**
     * Utilitaire de formatage des pourcentages
     */
    formatPourcentage(valeur) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(valeur);
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoringEngine;
}
