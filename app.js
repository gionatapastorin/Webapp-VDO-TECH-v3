// ============================================================================
// SCRIPT GLOBALE
// ============================================================================
(function () {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzdMikZRPiZwQqNVvyx3ggP-D4Z0_iqCtnN3c97WoyEh6_W-UbgOWRtDsBO0XSf9jWB8A/exec';
    async function callBackend(functionName, payload) {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ functionName, payload })
        });
        if (!response.ok) { throw new Error(`Network response was not ok: ${response.statusText}`); }
        return response.json();
    }
    window.callBackend = callBackend;
    const byId = id => document.getElementById(id);
    const switcher = byId('switcher'), btnClim = byId('btn-clim'), btnHiv = byId('btn-hiv'), viewClim = byId('view-clim'), viewHiv = byId('view-hiv'), btnInterv = byId('btn-interv'), viewInterv = byId('view-interv');
    window.APP = window.APP || {};
    const $ = (sel, root = document) => root.querySelector(sel);
    const views = byId('views'), loginBox = $('#loginBox'), userBox = $('#userBox'), accessCode = $('#accessCode'), btnLogin = $('#btnLogin'), loginStatus = $('#loginStatus'), userNameEl = $('#userName'), userRoleEl = $('#userRole'), btnLogout = $('#btnLogout');
    (function preloadIcons() { const srcs = ['https://www.noticons.com/icon/DpLb/11735D/FFFEFE00.svg', 'https://www.noticons.com/icon/DpLb/D4EDBC/FFFEFE00.svg', 'https://www.noticons.com/icon/xJqj/11735D/FFFEFE00.svg', 'https://www.noticons.com/icon/xJqj/D4EDBC/FFFEFE00.svg', 'https://www.noticons.com/icon/nwa9/11735D/FFFEFE00.svg', 'https://www.noticons.com/icon/nwa9/D4EDBC/FFFEFE00.svg']; srcs.forEach(s => { const im = new Image(); im.decoding = 'async'; im.src = s; }); })();
    function setLoginStatus(msg, ok) { if (!loginStatus) return; loginStatus.textContent = msg || ''; loginStatus.classList.toggle('is-error', ok === false); }
    function saveUser(u) { try { localStorage.setItem('vdo_user', JSON.stringify(u)); } catch (e) {} }
    function loadUser() { try { return JSON.parse(localStorage.getItem('vdo_user') || 'null'); } catch (e) { return null; } }
    function clearUser() { try { localStorage.removeItem('vdo_user'); } catch (e) {} }
    function renderUser() { const u = APP.user || null; if (u && u.name) { if (userNameEl) userNameEl.textContent = u.name; if (userRoleEl) userRoleEl.textContent = u.role ? `(${u.role})` : ''; if (loginBox) loginBox.style.display = 'none'; if (userBox) userBox.style.display = ''; document.querySelectorAll('#clim-root #quiRadios, #hiv-root #quiRadios').forEach(el => el && (el.style.display = 'none')); if (views) views.setAttribute('aria-hidden', 'false'); document.dispatchEvent(new CustomEvent('userchange', { detail: { user: u } })); if (btnClim) btnClim.style.display = ''; if (btnHiv) btnHiv.style.display = ''; if (btnInterv) btnInterv.style.display = ''; } else { if (loginBox) loginBox.style.display = ''; if (userBox) userBox.style.display = 'none'; document.querySelectorAll('#clim-root #quiRadios, #hiv-root #quiRadios').forEach(el => el && (el.style.display = '')); if (views) views.setAttribute('aria-hidden', 'true'); document.dispatchEvent(new CustomEvent('userchange', { detail: { user: null } })); if (btnClim) btnClim.style.display = 'none'; if (btnHiv) btnHiv.style.display = 'none'; if (btnInterv) btnInterv.style.display = 'none'; } }
    async function doLogin() { const code = (accessCode && accessCode.value || '').trim(); if (!code) { setLoginStatus('Entrez un code', false); return; } setLoginStatus('Vérification en cours…'); try { const res = await callBackend('validateAccessCode', code); if (res && res.ok && res.user && res.user.name) { APP.user = { name: res.user.name, role: res.user.role || '', code }; saveUser(APP.user); setLoginStatus('Accès réussi', true); renderUser(); } else { setLoginStatus(res && res.reason ? res.reason : 'Code non valide.', false); } } catch (err) { console.error(err); setLoginStatus('Erreur réseau ou serveur.', false); } }
    function doLogout() { APP.user = null; clearUser(); renderUser(); }
    if (btnLogin) btnLogin.addEventListener('click', doLogin);
    if (accessCode) accessCode.addEventListener('keyup', (e) => { if (e.key === 'Enter') doLogin(); });
    if (btnLogout) btnLogout.addEventListener('click', doLogout);
    const stored = loadUser();
    if (stored && stored.code) { setLoginStatus('Vérification en cours…'); callBackend('validateAccessCode', stored.code).then(res => { if (res && res.ok && res.user) { APP.user = { name: res.user.name, role: res.user.role || '', code: stored.code }; saveUser(APP.user); } else { clearUser(); APP.user = null; setLoginStatus(res && res.reason ? res.reason : "Accès réservé à l'équipe Technique", false); } renderUser(); }).catch(() => { clearUser(); APP.user = null; renderUser(); }); } else { APP.user = (stored && stored.name) ? stored : null; renderUser(); }
    window.APP = APP;
    document.addEventListener('viewchange', renderUser);
    function setActive(mode) { switcher.classList.add('compact'); const isClim = mode === 'clim', isHiv = mode === 'hiv', isInterv = mode === 'interv'; btnClim && btnClim.classList.toggle('is-selected', isClim); btnHiv && btnHiv.classList.toggle('is-selected', isHiv); btnInterv && btnInterv.classList.toggle('is-selected', isInterv); btnClim && btnClim.classList.toggle('is-collapsed', !isClim); btnHiv && btnHiv.classList.toggle('is-collapsed', !isHiv); btnInterv && btnInterv.classList.toggle('is-collapsed', !isInterv); viewClim && viewClim.classList.toggle('is-active', isClim); viewHiv && viewHiv.classList.toggle('is-active', isHiv); viewInterv && viewInterv.classList.toggle('is-active', isInterv); document.dispatchEvent(new CustomEvent('viewchange', { detail: { view: mode } })); }
    btnClim && btnClim.addEventListener('click', () => setActive('clim'));
    btnHiv && btnHiv.addEventListener('click', () => setActive('hiv'));
    btnInterv && btnInterv.addEventListener('click', () => setActive('interv'));
    setActive('hiv');
})();

// ============================================================================
// SCRIPT PER LA VISTA CLIM
// ============================================================================
(function () {
    const root = document.getElementById('clim-root');
    if (!root) return;
    const statusEl = root.querySelector('#status'), submitEl = root.querySelector('#submitBtn'), mhSelect = root.querySelector('#mhSelect'), radiosBox = root.querySelector('#quiRadios'), gsWarn = document.getElementById('gsWarn');
    const state = { who: '', mh: '' };
    if (window.APP && APP.user && APP.user.name) { state.who = APP.user.name; if (radiosBox) radiosBox.style.display = 'none'; }
    document.addEventListener('userchange', (ev) => { const u = ev.detail && ev.detail.user; state.who = (u && u.name) ? u.name : ''; if (radiosBox) radiosBox.style.display = (u && u.name) ? 'none' : ''; validate(); });
    function setStatus(msg, ok) { statusEl.textContent = msg || ''; statusEl.style.color = ok ? '#0b6e4f' : '#9b2226'; }
    function validate() { submitEl.disabled = !state.mh; }
    function populateMH(list) { mhSelect.innerHTML = '<option value="">Sélectionnez n° MH…</option>'; (list || []).forEach(opt => { const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.label; mhSelect.appendChild(o); }); mhSelect.disabled = false; if (state.mh) { mhSelect.value = state.mh; if (mhSelect.value !== state.mh) state.mh = ''; } validate(); }
    async function loadMH() { mhSelect.disabled = true; mhSelect.innerHTML = '<option value="">Chargement…</option>'; try { const list = await window.callBackend('getMhOptions'); populateMH(list); setStatus('Prêt.', true); } catch (err) { console.error(err); setStatus('Erreur chargement MH.', false); if (gsWarn) gsWarn.style.display = 'block'; mhSelect.disabled = false; validate(); } }
    radiosBox.addEventListener('change', (e) => { if (e.target && e.target.name === 'person') { state.who = e.target.value; validate(); } });
    mhSelect.addEventListener('change', () => { state.mh = mhSelect.value.trim(); validate(); });
    submitEl.addEventListener('click', async () => { if (submitEl.disabled) return; submitEl.disabled = true; setStatus('Enregistrement…', true); const who = state.who || (window.APP && APP.user && APP.user.name) || ''; const payload = { person: who, mh: state.mh }; try { await window.callBackend('submitForm', payload); setStatus('✅ Enregistré', true); state.mh = ''; mhSelect.value = ''; await loadMH(); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { console.error(err); setStatus('Erreur: ' + (err && err.message ? err.message : err), false); } finally { validate(); } });
    setStatus('Prêt.', true); loadMH(); validate();
})();

// ============================================================================
// SCRIPT PER LA VISTA HIVERNAGE (MODIFICATO)
// ============================================================================
(function () {
    const root = document.getElementById('hiv-root');
    if (!root) return;
    const state = { who: '', mh: '', checks: [] };
    if (window.APP && APP.user && APP.user.name) { state.who = APP.user.name; const radios = root.querySelector('#quiRadios'); if (radios) radios.style.display = 'none'; }
    const statusEl = root.querySelector('#status'), submitEl = root.querySelector('#submitBtn'), resetEl = root.querySelector('#resetBtn'), mhSelect = root.querySelector('#mhSelect');
    const listContainer = root.querySelector('#hiver-list-container');
    let refreshInterval;
    document.addEventListener('userchange', (ev) => { const u = ev.detail && ev.detail.user; state.who = (u && u.name) ? u.name : ''; const radios = root.querySelector('#quiRadios'); if (radios) radios.style.display = (u && u.name) ? 'none' : ''; validate(); });
    // DA INCOLLARE AL POSTO DEL BLOCCO PRECEDENTE
    root.querySelectorAll('.card-header[role="button"]').forEach(h => {
        h.addEventListener('click', () => {
            const target = root.querySelector('#' + h.dataset.target);
            if (!target) return;
            const wasOpen = target.classList.contains('open');

            // Chiudi tutti gli altri accordion, ignorando la lista
            root.querySelectorAll('.card-header[role="button"]').forEach(headerToClose => {
                if (headerToClose !== h) {
                    const contentToClose = root.querySelector('#' + headerToClose.dataset.target);
                    if (contentToClose) {
                        contentToClose.classList.remove('open');
                        contentToClose.setAttribute('aria-hidden', 'true');
                    }
                    headerToClose.setAttribute('aria-expanded', 'false');
                    const chev = headerToClose.querySelector('.chev');
                    if (chev) chev.style.transform = 'rotate(0deg)';
                }
            });

            // Apri o chiudi quello cliccato
            if (!wasOpen) {
                target.classList.add('open');
                target.setAttribute('aria-hidden', 'false');
                h.setAttribute('aria-expanded', 'true');
                const ch = h.querySelector('.chev');
                if (ch) ch.style.transform = 'rotate(180deg)';
            }
            
            requestAnimationFrame(() => { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        });
    });
    root.querySelector('#quiRadios').addEventListener('change', (e) => { if (e.target && e.target.name === 'qui') { state.who = e.target.value; validate(); } });
    mhSelect.addEventListener('change', () => { state.mh = mhSelect.value.trim(); validate(); });
    
    // Funzione di visualizzazione lista (MODIFICATA)
    function renderHiverList(list) {
        if (!listContainer) return;
        if (!list || list.length === 0) {
            listContainer.innerHTML = '<p>Aucun MH hiverné pour le moment.</p>';
            return;
        }
        let html = '';
        list.forEach(item => {
            html += `
                <div class="hiver-list-item">
                    <span class="hiver-mh">${item.mh}</span>
                    <span class="hiver-person">${item.desc}</span>
                    <span class="hiver-date">${item.date}</span>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }

    async function loadHiverList() {
        if (!listContainer) return;
        try {
            const list = await window.callBackend('getHivernatedMHs');
            if (list.ok === false) {
                 throw new Error(list.error);
            }
            renderHiverList(list);
        } catch (err) {
            console.error('Errore caricamento lista hivernage:', err);
            listContainer.innerHTML = `<p style="color:red;">Erreur de chargement de la liste.</p>`;
        }
    }
    
    function hookCheckboxes() { const cbs = root.querySelectorAll('.check-item input[type="checkbox"]'); state.checks = Array.from(cbs).map(cb => cb.checked); cbs.forEach((cb, idx) => { cb.addEventListener('change', () => { state.checks[idx] = cb.checked; validate(); }); }); }
    function validate() { const mhOk = !!state.mh; const allChecked = state.checks.length > 0 && state.checks.every(v => v === true); submitEl.disabled = !(mhOk && allChecked); }
    function setStatus(msg, ok) { statusEl.textContent = msg || ''; statusEl.style.color = ok ? '#0b6e4f' : '#9b2226'; }
    async function loadMH() { mhSelect.disabled = true; mhSelect.innerHTML = '<option value="">Chargement…</option>'; try { const list = await window.callBackend('getMHOptions'); mhSelect.innerHTML = '<option value="">Sélectionnez n° MH…</option>'; (list || []).forEach(opt => { const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.label; mhSelect.appendChild(o); }); if (state.mh) { mhSelect.value = state.mh; if (mhSelect.value !== state.mh) state.mh = ''; } } catch (err) { console.error(err); setStatus('Erreur chargement MH.', false); } finally { mhSelect.disabled = false; validate(); } }
    async function handleSubmit() { if (submitEl.disabled) return; submitEl.disabled = true; setStatus('Enregistrement…', true); const who = state.who || (window.APP && APP.user && APP.user.name) || ''; const payload = { qui: who, mh: state.mh, checks: state.checks.slice() }; try { const res = await window.callBackend('submitHivernage', payload); setStatus(`Enregistré (ligne ${res && res.row ? res.row : '?'}).`, true); resetAll(false); await loadMH(); await loadHiverList(); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { console.error(err); setStatus('Erreur: ' + (err && err.message ? err.message : err), false); } finally { validate(); } }
    function resetAll(doScroll = true) { root.querySelectorAll('.check-item input[type="checkbox"]').forEach(cb => cb.checked = false); state.checks = state.checks.map(() => false); mhSelect.value = ''; state.mh = ''; root.querySelectorAll('.card-content.open').forEach(c => { c.classList.remove('open'); c.setAttribute('aria-hidden', 'true'); const header = document.querySelector(`[data-target="${c.id}"]`); if (header) { header.setAttribute('aria-expanded', 'false'); const chev = header.querySelector('.chev'); if (chev) chev.style.transform = 'rotate(0deg)'; } }); if (doScroll) window.scrollTo({ top: 0, behavior: 'smooth' }); validate(); }
    
    document.addEventListener('viewchange', (event) => {
        if (event.detail.view === 'hiv') {
            loadHiverList();
            clearInterval(refreshInterval);
            refreshInterval = setInterval(loadHiverList, 30000);
        } else {
            clearInterval(refreshInterval);
        }
    });

    (function init() {
        const checked = root.querySelector('#quiRadios input[type="radio"]:checked');
        state.who = checked ? checked.value : state.who;
        hookCheckboxes();
        validate();
        loadMH();
        if (root.closest('.view').classList.contains('is-active')) {
            loadHiverList();
        }
        resetEl.addEventListener('click', () => resetAll(true));
        submitEl.addEventListener('click', handleSubmit);
    })();
})();