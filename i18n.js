// i18n.js — Traductions FR / EN
// Usage : t('clé') retourne la traduction dans la langue active

const TRANSLATIONS = {
  fr: {
    // ── Page title ──────────────────────────────────────────────────
    page_title: 'Choisir mon point relais — Neoludis',

    // ── Étape 0 : Choix livraison ────────────────────────────────────
    step0_title: 'Comment souhaitez-vous recevoir votre commande ?',
    step0_relais_title: 'Point relais Colissimo',
    step0_relais_desc: 'Retrait dans un bureau de poste ou point relais près de chez vous',
    step0_domicile_title: 'Livraison à domicile',
    step0_domicile_desc: 'Réception directement à votre adresse',

    // ── Étape 1 : Formulaire ─────────────────────────────────────────
    step1_title_relais: 'Sélection de point relais Colissimo',
    step1_title_domicile: 'Livraison à domicile',
    step1_back: '← Modifier mon choix de livraison',
    label_prenom: 'Prénom *',
    label_nom: 'Nom *',
    label_email: 'Email *',
    label_telephone: 'Téléphone',
    label_adresse1: 'Adresse *',
    label_adresse2: "Complément d'adresse",
    label_adresse2_hint: '(optionnel)',
    label_codepostal: 'Code postal *',
    label_ville: 'Ville *',
    label_pays: 'Pays *',
    placeholder_prenom: 'Jean',
    placeholder_nom: 'Dupont',
    placeholder_email: 'jean.dupont@email.com',
    placeholder_telephone: '06 01 02 03 04',
    placeholder_adresse1: '12 rue de la Paix',
    placeholder_adresse2: 'Bâtiment A, lieu-dit...',
    placeholder_codepostal: '75001',
    placeholder_ville: 'Paris',
    err_required: 'Champ requis',
    err_email: 'Email invalide',
    btn_next_relais: 'Choisir mon point relais →',
    btn_next_domicile: 'Valider mon adresse →',

    // ── Pays ─────────────────────────────────────────────────────────
    country_group_france: 'France',
    country_group_europe: 'Europe',
    country_group_namerica: 'Amérique du Nord',
    country_group_other: 'Autre',
    country_other: 'Autre',

    // ── Étape 2 : Carte relais ───────────────────────────────────────
    step2_title: 'Votre point relais',
    step2_loading: 'Chargement de la carte…',
    step2_err_load: 'Erreur de chargement. Veuillez réessayer.',
    step2_err_auth: 'Erreur d\'authentification. Veuillez réessayer.',
    btn_validate: 'Valider ce point relais',
    btn_validate_loading: 'Enregistrement…',

    // ── Confirmation ─────────────────────────────────────────────────
    confirm_title: 'Merci !',
    confirm_relais: 'Votre choix de point relais a bien été enregistré.<br>Vous recevrez votre commande à l\'adresse sélectionnée.',
    confirm_domicile: 'Votre adresse de livraison a bien été enregistrée.<br>Vous recevrez votre commande à l\'adresse indiquée.',
    already_title: 'Choix déjà enregistré',
    already_text: 'Un choix de livraison a déjà été enregistré pour cette commande.',
    already_editeur: 'votre revendeur',

    // ── Admin : connexion ─────────────────────────────────────────────
    admin_title: 'Interface Admin',
    admin_editeur_label: 'Éditeur',
    admin_password_label: 'Mot de passe',
    admin_login_btn: 'Connexion',
    admin_wrong_password: 'Mot de passe incorrect.',
    admin_unknown_editeur: 'Éditeur inconnu ou accès non autorisé.',

    // ── Admin : onglets ───────────────────────────────────────────────
    tab_reponses: '📋 Réponses',
    tab_mails: '✉ Mails',
    tab_import: '📥 Import',
    tab_suivi: '📊 Suivi',

    // ── Admin : onglet Réponses ───────────────────────────────────────
    reponses_title: 'Réponses collectées',
    reponses_count: 'réponse(s)',
    btn_csv_local: '⬇ CSV local',
    btn_dropbox: '📦 Envoyer à la logistique',
    btn_clear: '🗑 Vider',
    no_data: 'Aucune donnée.',
    confirm_clear: 'Vider toutes les réponses ?',
    confirm_dropbox: 'commande(s) à envoyer à la logistique via Dropbox ?',
    dropbox_loading: '⏳ Dépôt en cours sur Dropbox…',
    dropbox_success: 'commande(s) déposée(s) sur Dropbox —',
    dropbox_error: '❌ Erreur :',
    col_date: 'Date',
    col_editeur: 'Éditeur',
    col_commande: 'Réf. Commande',
    col_prenom: 'Prénom',
    col_nom: 'Nom',
    col_email: 'Email',
    col_telephone: 'Téléphone',
    col_livraison: 'Mode livraison',
    col_relais: 'Point Relais',
    col_adresse: 'Adresse',
    col_id_colissimo: 'ID Colissimo',
    col_cp: 'Code Postal',
    col_ville: 'Ville',

    // ── Admin : onglet Mails ──────────────────────────────────────────
    mail_title: 'Templates emails',
    mail_initial_badge: '1er envoi',
    mail_initial_title: 'Mail initial',
    mail_relance_badge: 'Relance',
    mail_relance_title: 'Mail de relance',
    mail_label_subject: 'Objet',
    mail_label_body: 'Corps du message',
    mail_btn_preview: '👁 Aperçu',
    mail_preview_title: 'Aperçu du mail',
    mail_lang_fr: '🇫🇷 Français',
    mail_lang_en: '🇬🇧 English',

    // ── Admin : onglet Import ─────────────────────────────────────────
    import_title: 'Import CSV backers',
    import_col_ref: 'Colonne Référence / Backer ID',
    import_col_email: 'Colonne Email',
    import_col_prenom: 'Colonne Prénom',
    import_col_nom: 'Colonne Nom',
    import_col_tel: 'Colonne Téléphone',
    import_btn: '📥 Importer le CSV',
    import_success: 'backer(s) importé(s) avec succès.',
    import_error: 'Erreur lors de l\'import.',

    // ── Admin : onglet Suivi ──────────────────────────────────────────
    suivi_title: 'Suivi des backers',
    suivi_subtitle: 'État des envois et réponses',
    btn_send_all: '✉ Envoyer à tous',
    btn_relance_all: '🔁 Relancer les non-répondants',
    btn_refresh: '🔄 Actualiser',
    btn_send_selection_initial: '✉ Envoyer (initial)',
    btn_send_selection_relance: '🔁 Envoyer (relance)',
    check_all: 'Tout sélectionner',
    stat_imported: 'Backers importés',
    stat_sent: 'Emails envoyés',
    stat_replied: 'Ont répondu',
    stat_in_progress: 'En cours',
    stat_shipped: 'Expédiés',
    stat_waiting: 'En attente',
    col_ref: 'Réf.',
    col_email_sent: 'Email envoyé',
    col_replied: 'A répondu',
    col_status: 'Statut',
    status_in_progress: '📦 En cours',
    status_shipped: '🚚 Expédié',
    status_delivered: '✅ Livré',
    sending_emails: 'Envoi en cours…',
    emails_sent: 'email(s) envoyé(s)',
    emails_error: 'erreur(s)',
    no_backers_to_send: 'Tous les backers ont déjà reçu un email !',
    no_backers_to_relance: 'Aucun non-répondant à relancer !',
    no_selection: 'Aucun backer sélectionné.',
    confirm_send_all: 'Envoyer un email à tous les backers sans email ?',
    confirm_relance_all: 'Relancer tous les non-répondants ?',
    confirm_send_selection: 'Envoyer un email à',
    confirm_send_selection_suffix: 'backer(s) sélectionné(s) ?',

    // ── Templates email par défaut ────────────────────────────────────
    email_initial_subject: 'Choisissez votre mode de livraison - {editeur}',
    email_initial_body: 'Bonjour {prenom},\n\nVotre commande est prête à être expédiée.\nCliquez sur le lien ci-dessous pour choisir votre mode de livraison :\n\n{lien}\n\nCordialement,\nL\'équipe {editeur} / Neoludis',
    email_relance_subject: 'Rappel : choisissez votre mode de livraison - {editeur}',
    email_relance_body: 'Bonjour {prenom},\n\nNous n\'avons pas encore reçu votre choix de livraison.\nVotre commande est prête à partir — il ne vous reste plus qu\'à indiquer comment vous souhaitez la recevoir :\n\n{lien}\n\nN\'hésitez pas à nous contacter si vous avez la moindre question.\n\nCordialement,\nL\'équipe {editeur} / Neoludis',

    // ── Strings manquantes ────────────────────────────────────────────
    no_responses: 'Aucune réponse.',
    reponses_hint: 'Téléchargez le CSV régulièrement.',
    mail_variables: 'Variables disponibles',
    import_section_title: 'Génération de liens personnalisés',
    import_subtitle: "Importez le CSV de l'éditeur pour générer les liens personnalisés à envoyer aux clients.",
    import_file_label: 'Fichier CSV commandes',
    import_btn: 'Générer les liens →',
    suivi_empty: 'Cliquez sur Actualiser pour charger les données.',
    col_telephone: 'Tél.',
    col_livraison: 'Mode',
    col_relay_point: 'Point/Adresse',
    col_nom: 'Nom',
    step1_coords: 'Vos coordonnées',
    step1_coords_desc: 'Ces informations nous permettront d\'imprimer votre étiquette de livraison.',
    label_commande: 'Numéro de commande *',
    placeholder_commande: 'Ex : CMD-2024-001',
    confirm_recap: 'Récapitulatif',
    already_contact: 'Pour toute modification, veuillez contacter',
    btn_back: '← Retour',

    // ── Stock ─────────────────────────────────────────────────────────
    tab_stock: '📦 Stock',
    stock_title: 'Stock en temps réel',
    stock_subtitle: 'Inventaire Sage',
    stock_depot_all: 'Tous les dépôts',
    stock_depot_neo: 'Dépôt Neoludis',
    stock_depot_edit: 'Dépôt Éditeur',
    stock_search_placeholder: 'Rechercher par référence, désignation, EAN...',
    stock_empty: 'Cliquez sur Actualiser pour charger le stock.',
    stock_loading: 'Chargement du stock...',
    stock_col_ref: 'Réf. Neoludis',
    stock_col_ref_edit: 'Réf. Éditeur',
    stock_col_design: 'Désignation',
    stock_col_ean: 'EAN',
    stock_col_stock_neo: 'Stock Neoludis',
    stock_col_stock_edit: 'Stock Éditeur',
    stock_col_reserve: 'Réservé',
    stock_col_dispo: 'Disponible',
    stock_stat_refs: 'Références',
    stock_stat_in_stock: 'En stock',
    stock_stat_rupture: 'En rupture',
    stock_stat_total_neo: 'Total Neoludis',
    stock_stat_total_edit: 'Total Éditeur',
    stock_updated: 'Mis à jour le',

    // ── Lang switcher ─────────────────────────────────────────────────
    lang_fr: 'FR',
    lang_en: 'EN',
  },

  en: {
    // ── Page title ──────────────────────────────────────────────────
    page_title: 'Choose my pickup point — Neoludis',

    // ── Étape 0 : Choix livraison ────────────────────────────────────
    step0_title: 'How would you like to receive your order?',
    step0_relais_title: 'Colissimo pickup point',
    step0_relais_desc: 'Pick up at a post office or relay point near you',
    step0_domicile_title: 'Home delivery',
    step0_domicile_desc: 'Delivered directly to your address',

    // ── Étape 1 : Formulaire ─────────────────────────────────────────
    step1_title_relais: 'Colissimo pickup point selection',
    step1_title_domicile: 'Home delivery',
    step1_back: '← Change my delivery choice',
    label_prenom: 'First name *',
    label_nom: 'Last name *',
    label_email: 'Email *',
    label_telephone: 'Phone',
    label_adresse1: 'Address *',
    label_adresse2: 'Address complement',
    label_adresse2_hint: '(optional)',
    label_codepostal: 'Postal code *',
    label_ville: 'City *',
    label_pays: 'Country *',
    placeholder_prenom: 'John',
    placeholder_nom: 'Doe',
    placeholder_email: 'john.doe@email.com',
    placeholder_telephone: '+1 555 000 0000',
    placeholder_adresse1: '12 Peace Street',
    placeholder_adresse2: 'Building A, apt...',
    placeholder_codepostal: '75001',
    placeholder_ville: 'Paris',
    err_required: 'Required field',
    err_email: 'Invalid email',
    btn_next_relais: 'Choose my pickup point →',
    btn_next_domicile: 'Confirm my address →',

    // ── Pays ─────────────────────────────────────────────────────────
    country_group_france: 'France',
    country_group_europe: 'Europe',
    country_group_namerica: 'North America',
    country_group_other: 'Other',
    country_other: 'Other',

    // ── Étape 2 : Carte relais ───────────────────────────────────────
    step2_title: 'Your pickup point',
    step2_loading: 'Loading map…',
    step2_err_load: 'Loading error. Please try again.',
    step2_err_auth: 'Authentication error. Please try again.',
    btn_validate: 'Confirm this pickup point',
    btn_validate_loading: 'Saving…',

    // ── Confirmation ─────────────────────────────────────────────────
    confirm_title: 'Thank you!',
    confirm_relais: 'Your pickup point has been successfully registered.<br>You will receive your order at the selected address.',
    confirm_domicile: 'Your delivery address has been successfully registered.<br>You will receive your order at the indicated address.',
    already_title: 'Choice already registered',
    already_text: 'A delivery choice has already been registered for this order.',
    already_editeur: 'your retailer',

    // ── Admin : connexion ─────────────────────────────────────────────
    admin_title: 'Admin Interface',
    admin_editeur_label: 'Publisher',
    admin_password_label: 'Password',
    admin_login_btn: 'Login',
    admin_wrong_password: 'Incorrect password.',
    admin_unknown_editeur: 'Unknown publisher or unauthorized access.',

    // ── Admin : onglets ───────────────────────────────────────────────
    tab_reponses: '📋 Responses',
    tab_mails: '✉ Emails',
    tab_import: '📥 Import',
    tab_suivi: '📊 Tracking',

    // ── Admin : onglet Réponses ───────────────────────────────────────
    reponses_title: 'Collected responses',
    reponses_count: 'response(s)',
    btn_csv_local: '⬇ Local CSV',
    btn_dropbox: '📦 Send to logistics',
    btn_clear: '🗑 Clear',
    no_data: 'No data.',
    confirm_clear: 'Clear all responses?',
    confirm_dropbox: 'order(s) to send to logistics via Dropbox?',
    dropbox_loading: '⏳ Uploading to Dropbox…',
    dropbox_success: 'order(s) uploaded to Dropbox —',
    dropbox_error: '❌ Error:',
    col_date: 'Date',
    col_editeur: 'Publisher',
    col_commande: 'Order Ref.',
    col_prenom: 'First name',
    col_nom: 'Last name',
    col_email: 'Email',
    col_telephone: 'Phone',
    col_livraison: 'Delivery mode',
    col_relais: 'Pickup point',
    col_adresse: 'Address',
    col_id_colissimo: 'Colissimo ID',
    col_cp: 'Postal code',
    col_ville: 'City',

    // ── Admin : onglet Mails ──────────────────────────────────────────
    mail_title: 'Email templates',
    mail_initial_badge: '1st send',
    mail_initial_title: 'Initial email',
    mail_relance_badge: 'Follow-up',
    mail_relance_title: 'Follow-up email',
    mail_label_subject: 'Subject',
    mail_label_body: 'Message body',
    mail_btn_preview: '👁 Preview',
    mail_preview_title: 'Email preview',
    mail_lang_fr: '🇫🇷 French',
    mail_lang_en: '🇬🇧 English',

    // ── Admin : onglet Import ─────────────────────────────────────────
    import_title: 'Import CSV backers',
    import_col_ref: 'Reference / Backer ID column',
    import_col_email: 'Email column',
    import_col_prenom: 'First name column',
    import_col_nom: 'Last name column',
    import_col_tel: 'Phone column',
    import_btn: '📥 Import CSV',
    import_success: 'backer(s) successfully imported.',
    import_error: 'Import error.',

    // ── Admin : onglet Suivi ──────────────────────────────────────────
    suivi_title: 'Backer tracking',
    suivi_subtitle: 'Sending and response status',
    btn_send_all: '✉ Send to all',
    btn_relance_all: '🔁 Follow up non-respondents',
    btn_refresh: '🔄 Refresh',
    btn_send_selection_initial: '✉ Send (initial)',
    btn_send_selection_relance: '🔁 Send (follow-up)',
    check_all: 'Select all',
    stat_imported: 'Imported backers',
    stat_sent: 'Emails sent',
    stat_replied: 'Have replied',
    stat_in_progress: 'In progress',
    stat_shipped: 'Shipped',
    stat_waiting: 'Pending',
    col_ref: 'Ref.',
    col_email_sent: 'Email sent',
    col_replied: 'Replied',
    col_status: 'Status',
    status_in_progress: '📦 In progress',
    status_shipped: '🚚 Shipped',
    status_delivered: '✅ Delivered',
    sending_emails: 'Sending…',
    emails_sent: 'email(s) sent',
    emails_error: 'error(s)',
    no_backers_to_send: 'All backers have already received an email!',
    no_backers_to_relance: 'No non-respondents to follow up!',
    no_selection: 'No backer selected.',
    confirm_send_all: 'Send an email to all backers without email?',
    confirm_relance_all: 'Follow up all non-respondents?',
    confirm_send_selection: 'Send an email to',
    confirm_send_selection_suffix: 'selected backer(s)?',

    // ── Templates email par défaut ────────────────────────────────────
    email_initial_subject: 'Choose your delivery method - {editeur}',
    email_initial_body: 'Hello {prenom},\n\nYour order is ready to be shipped.\nClick the link below to choose your delivery method:\n\n{lien}\n\nBest regards,\nThe {editeur} / Neoludis team',
    email_relance_subject: 'Reminder: choose your delivery method - {editeur}',
    email_relance_body: 'Hello {prenom},\n\nWe have not yet received your delivery choice.\nYour order is ready to go — you just need to let us know how you\'d like to receive it:\n\n{lien}\n\nFeel free to contact us if you have any questions.\n\nBest regards,\nThe {editeur} / Neoludis team',

    // ── Strings manquantes ────────────────────────────────────────────
    no_responses: 'No responses.',
    reponses_hint: 'Download the CSV regularly.',
    mail_variables: 'Available variables',
    import_section_title: 'Personalized link generation',
    import_subtitle: "Import the publisher's CSV to generate personalized links to send to customers.",
    import_file_label: 'Orders CSV file',
    import_btn: 'Generate links →',
    suivi_empty: 'Click Refresh to load data.',
    col_telephone: 'Phone',
    col_livraison: 'Mode',
    col_relay_point: 'Point/Address',
    col_nom: 'Last name',
    step1_coords: 'Your details',
    step1_coords_desc: 'This information will allow us to print your shipping label.',
    label_commande: 'Order number *',
    placeholder_commande: 'Ex: CMD-2024-001',
    confirm_recap: 'Summary',
    already_contact: 'For any changes, please contact',
    btn_back: '← Back',

    // ── Stock ─────────────────────────────────────────────────────────
    tab_stock: '📦 Stock',
    stock_title: 'Real-time stock',
    stock_subtitle: 'Sage inventory',
    stock_depot_all: 'All warehouses',
    stock_depot_neo: 'Neoludis warehouse',
    stock_depot_edit: 'Publisher warehouse',
    stock_search_placeholder: 'Search by reference, name, EAN...',
    stock_empty: 'Click Refresh to load stock.',
    stock_loading: 'Loading stock...',
    stock_col_ref: 'Neoludis Ref.',
    stock_col_ref_edit: 'Publisher Ref.',
    stock_col_design: 'Description',
    stock_col_ean: 'EAN',
    stock_col_stock_neo: 'Neoludis stock',
    stock_col_stock_edit: 'Publisher stock',
    stock_col_reserve: 'Reserved',
    stock_col_dispo: 'Available',
    stock_stat_refs: 'References',
    stock_stat_in_stock: 'In stock',
    stock_stat_rupture: 'Out of stock',
    stock_stat_total_neo: 'Total Neoludis',
    stock_stat_total_edit: 'Total Publisher',
    stock_updated: 'Updated on',

    // ── Lang switcher ─────────────────────────────────────────────────
    lang_fr: 'FR',
    lang_en: 'EN',
  }
};

// Langue active
let currentLang = localStorage.getItem('neoludis_lang') ||
  (navigator.language || navigator.userLanguage || 'fr').startsWith('fr') ? 'fr' : 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('neoludis_lang', lang);
  document.documentElement.lang = lang;
  applyTranslations();
  // Recharger le contenu dynamique si nécessaire
  if (typeof chargerSuivi === 'function' && document.getElementById('panel-suivi') && document.getElementById('panel-suivi').style.display !== 'none') {
    chargerSuivi();
  }
  if (typeof initMailTemplates === 'function' && document.getElementById('panel-mail') && document.getElementById('panel-mail').style.display !== 'none') {
    initMailTemplates(true);
  }
  if (typeof renderAdminTable === 'function' && document.getElementById('panel-reponses') && document.getElementById('panel-reponses').style.display !== 'none') {
    renderAdminTable();
  }
}

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS['fr'] && TRANSLATIONS['fr'][key]) ||
         key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    el.label = t(el.getAttribute('data-i18n-label'));
  });
  // Update page title
  document.title = t('page_title');
  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.style.background = btn.dataset.lang === currentLang ? 'var(--ink)' : 'none';
    btn.style.color = btn.dataset.lang === currentLang ? 'white' : 'var(--ink)';
  });
}
